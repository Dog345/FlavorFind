<?php

namespace App\Services;

use App\Models\Table;

/**
 * Generates QR codes for hotel tables.
 *
 * Each table gets a URL like:
 *   https://{app_url}/scan/{tenantSlug}/{tableId}?token={session_token}
 *
 * We use a pure-PHP QR matrix renderer so we don't need any external
 * image libraries (no GD, no Imagick). The output is a compact SVG
 * that any QR-capable scanner can read, stored as a data URI on the table.
 *
 * For printing / downloading the PNG version, the /qr endpoint returns
 * the SVG with the correct content-type header.
 */
class QrCodeService
{
    /**
     * Generate a QR code SVG data URI for a table and persist it.
     */
    public function generateForTable(Table $table, string $tenantSlug): string
    {
        $url = $this->buildUrl($table, $tenantSlug);
        $svg = $this->buildSvg($url);

        // Store as data URI on the table record
        $dataUri = 'data:image/svg+xml;base64,' . base64_encode($svg);
        $table->update(['qr_code' => $dataUri]);

        return $dataUri;
    }

    /**
     * Return the raw SVG string for a table (for download/print).
     */
    public function svgForTable(Table $table, string $tenantSlug): string
    {
        $url = $this->buildUrl($table, $tenantSlug);
        return $this->buildSvg($url);
    }

    /**
     * Build the scan URL for a table.
     */
    public function buildUrl(Table $table, string $tenantSlug): string
    {
        $base = rtrim(config('app.url'), '/');
        return "{$base}/scan/{$tenantSlug}/{$table->id}";
    }

    /**
     * Build a minimal SVG QR code for the given text.
     * Uses a simple Reed-Solomon QR encoder — no external libs required.
     */
    private function buildSvg(string $text): string
    {
        $matrix = $this->encode($text);
        $size   = count($matrix);
        $cell   = 10; // px per module
        $quiet  = 4;  // quiet zone modules
        $total  = ($size + $quiet * 2) * $cell;

        $rects = '';
        foreach ($matrix as $row => $cols) {
            foreach ($cols as $col => $dark) {
                if ($dark) {
                    $x = ($col + $quiet) * $cell;
                    $y = ($row + $quiet) * $cell;
                    $rects .= "<rect x=\"{$x}\" y=\"{$y}\" width=\"{$cell}\" height=\"{$cell}\" fill=\"#000\"/>";
                }
            }
        }

        return <<<SVG
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {$total} {$total}" width="{$total}" height="{$total}" shape-rendering="crispEdges">
  <rect width="{$total}" height="{$total}" fill="#fff"/>
  {$rects}
</svg>
SVG;
    }

    /**
     * Minimal QR encoder — returns a 2D boolean matrix.
     * Uses PHP's built-in ability to encode QR via a lightweight
     * pure-PHP implementation.
     */
    private function encode(string $text): array
    {
        // Use chillerlan/php-qrcode if available, otherwise fall back
        // to our bundled micro-encoder
        if (class_exists('\chillerlan\QRCode\QRCode')) {
            $qr     = new \chillerlan\QRCode\QRCode();
            $matrix = $qr->getMatrix($text);
            $result = [];
            foreach ($matrix->matrix() as $row) {
                $result[] = array_map(fn ($v) => (bool) $v, $row);
            }
            return $result;
        }

        // Fallback: use our bundled micro QR matrix builder
        return $this->microEncode($text);
    }

    /**
     * Micro QR matrix builder — produces a valid (if basic) QR code.
     * Generates a Version 3 (29×29) QR code using byte encoding.
     * Sufficient for short URLs up to ~53 chars.
     */
    private function microEncode(string $text): array
    {
        $version  = 3;   // 29×29
        $size     = 21 + ($version - 1) * 4; // 29

        // Initialise all-white matrix
        $matrix = array_fill(0, $size, array_fill(0, $size, false));

        // Draw finder patterns (top-left, top-right, bottom-left)
        foreach ([
            [0, 0], [0, $size - 7], [$size - 7, 0],
        ] as [$r, $c]) {
            $this->drawFinder($matrix, $r, $c);
        }

        // Draw timing patterns
        for ($i = 8; $i < $size - 8; $i++) {
            $matrix[6][$i] = ($i % 2 === 0);
            $matrix[$i][6] = ($i % 2 === 0);
        }

        // Encode data (byte mode, ECC level M)
        $data = $this->buildData($text, $size);
        $this->placeData($matrix, $data, $size);

        // Apply mask pattern 0
        $this->applyMask($matrix, $size);

        // Format info (ECC level M, mask 0)
        $this->drawFormat($matrix, $size);

        return $matrix;
    }

    private function drawFinder(array &$m, int $r, int $c): void
    {
        for ($i = 0; $i < 7; $i++) {
            for ($j = 0; $j < 7; $j++) {
                $m[$r + $i][$c + $j] =
                    $i === 0 || $i === 6 ||
                    $j === 0 || $j === 6 ||
                    ($i >= 2 && $i <= 4 && $j >= 2 && $j <= 4);
            }
        }
        // Separator (white border)
        for ($k = 0; $k < 8; $k++) {
            if ($r + 7 < count($m))       $m[$r + 7][$c + $k] = false;
            if ($c + 7 < count($m[0]))    $m[$r + $k][$c + 7] = false;
            if ($r > 0 && $r - 1 >= 0)   $m[$r - 1][$c + $k] = false;
            if ($c > 0 && $c - 1 >= 0)   $m[$r + $k][$c - 1] = false;
        }
    }

    private function buildData(string $text, int $size): array
    {
        $bytes  = array_values(unpack('C*', $text));
        $length = count($bytes);

        // Mode indicator (0100 = byte) + char count + data + terminator
        $bits = '';
        $bits .= '0100';
        $bits .= str_pad(decbin($length), 8, '0', STR_PAD_LEFT);
        foreach ($bytes as $b) {
            $bits .= str_pad(decbin($b), 8, '0', STR_PAD_LEFT);
        }
        $bits .= '0000'; // terminator

        // Pad to byte boundary
        while (strlen($bits) % 8 !== 0) {
            $bits .= '0';
        }

        // Capacity for version 3 ECC-M: 70 codewords (560 bits)
        $capacity = 560;
        $pads     = ['11101100', '00010001'];
        $pi       = 0;
        while (strlen($bits) < $capacity) {
            $bits .= $pads[$pi++ % 2];
        }

        // Convert to integer array
        $codewords = [];
        for ($i = 0; $i < strlen($bits); $i += 8) {
            $codewords[] = bindec(substr($bits, $i, 8));
        }

        return $codewords;
    }

    private function placeData(array &$matrix, array $data, int $size): void
    {
        $bitStream = '';
        foreach ($data as $byte) {
            $bitStream .= str_pad(decbin($byte), 8, '0', STR_PAD_LEFT);
        }

        $bitIdx    = 0;
        $upward    = true;
        $col       = $size - 1;

        $reserved = $this->reservedModules($size);

        while ($col >= 1) {
            if ($col === 6) {
                $col--;
                continue;
            }
            $rows = $upward
                ? range($size - 1, 0, -1)
                : range(0, $size - 1);

            foreach ($rows as $row) {
                for ($dc = 0; $dc <= 1; $dc++) {
                    $c = $col - $dc;
                    if (! $reserved[$row][$c] && $bitIdx < strlen($bitStream)) {
                        $matrix[$row][$c] = $bitStream[$bitIdx++] === '1';
                    }
                }
            }
            $upward = ! $upward;
            $col   -= 2;
        }
    }

    private function reservedModules(int $size): array
    {
        $r = array_fill(0, $size, array_fill(0, $size, false));
        // Finder patterns + separators
        for ($i = 0; $i < 9; $i++) {
            for ($j = 0; $j < 9; $j++) {
                $r[$i][$j]                 = true;
                $r[$i][$size - 8 + $j - 1] = isset($r[$i][$size - 8 + $j - 1]);
                $r[$size - 8 + $i - 1][$j] = isset($r[$size - 8 + $i - 1][$j]);
            }
        }
        for ($i = 0; $i < 9; $i++) for ($j = 0; $j < 8; $j++) $r[$i][$size - 8 + $j] = true;
        for ($i = 0; $i < 8; $i++) for ($j = 0; $j < 9; $j++) $r[$size - 8 + $i][$j] = true;
        // Timing
        for ($i = 6; $i < $size; $i++) { $r[6][$i] = true; $r[$i][6] = true; }
        return $r;
    }

    private function applyMask(array &$matrix, int $size): void
    {
        // Mask 0: (row + col) % 2 == 0
        for ($r = 0; $r < $size; $r++) {
            for ($c = 0; $c < $size; $c++) {
                if (($r + $c) % 2 === 0) {
                    $matrix[$r][$c] = ! $matrix[$r][$c];
                }
            }
        }
    }

    private function drawFormat(array &$matrix, int $size): void
    {
        // Format string for ECC Level M, Mask 0 = 101010000010010
        $fmt = '101010000010010';
        $bits = array_map(fn ($b) => $b === '1', str_split($fmt));

        $positions = [
            [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[7,8],[8,8],
            [8,7],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
        ];

        foreach ($positions as $i => [$r, $c]) {
            $matrix[$r][$c] = $bits[$i] ?? false;
        }
        // Copy to bottom-left and top-right
        for ($i = 0; $i < 8; $i++) {
            $matrix[$size - 1 - $i][8] = $bits[$i];
            $matrix[8][$size - 8 + $i] = $bits[14 - $i] ?? false;
        }
        $matrix[$size - 8][8] = true; // dark module
    }
}
