<?php

namespace App\Jobs;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * SendReservationConfirmation
 *
 * Dispatched when a reservation is confirmed (status → confirmed).
 * Sends:
 *  1. Confirmation email (if guest_email is set)
 *  2. SMS stub via Africa's Talking / Twilio (logs in non-production)
 *
 * The job is queued so it never blocks the HTTP response.
 * In testing, set QUEUE_CONNECTION=sync to run inline.
 */
class SendReservationConfirmation implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Retry up to 3 times with exponential backoff */
    public int $tries = 3;

    /** Backoff in seconds between retries */
    public array $backoff = [30, 120, 300];

    public function __construct(public readonly Reservation $reservation)
    {
    }

    public function handle(): void
    {
        $reservation = $this->reservation;

        // ── Email ─────────────────────────────────────────────────────────────
        if ($reservation->guest_email) {
            $this->sendConfirmationEmail($reservation);
        }

        // ── SMS ───────────────────────────────────────────────────────────────
        if ($reservation->guest_phone) {
            $this->sendConfirmationSms($reservation);
        }
    }

    // ─── Email ───────────────────────────────────────────────────────────────

    private function sendConfirmationEmail(Reservation $reservation): void
    {
        try {
            Mail::send([], [], function ($message) use ($reservation) {
                $message
                    ->to($reservation->guest_email, $reservation->guest_name)
                    ->subject("Your reservation is confirmed — {$reservation->tenant->name}")
                    ->html($this->buildEmailHtml($reservation));
            });
        } catch (\Throwable $e) {
            Log::error('ReservationConfirmation: email failed', [
                'reservation_id' => $reservation->id,
                'email'          => $reservation->guest_email,
                'error'          => $e->getMessage(),
            ]);
            // Don't rethrow — SMS can still succeed
        }
    }

    private function buildEmailHtml(Reservation $reservation): string
    {
        $date     = $reservation->reserved_at->format('l, d F Y');
        $time     = $reservation->reserved_at->format('H:i');
        $covers   = $reservation->covers;
        $hotel    = $reservation->tenant->name;
        $table    = $reservation->table?->label ?? 'to be assigned';

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family:sans-serif;color:#111;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#16a34a">Reservation Confirmed ✓</h2>
          <p>Dear {$reservation->guest_name},</p>
          <p>Your reservation at <strong>{$hotel}</strong> has been confirmed.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">Date</td>
                <td style="padding:8px;border:1px solid #e5e7eb">{$date}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">Time</td>
                <td style="padding:8px;border:1px solid #e5e7eb">{$time}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">Guests</td>
                <td style="padding:8px;border:1px solid #e5e7eb">{$covers}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">Table</td>
                <td style="padding:8px;border:1px solid #e5e7eb">{$table}</td></tr>
          </table>
          <p style="color:#6b7280;font-size:13px">
            Please arrive on time. If you need to cancel or make changes,
            contact us as soon as possible.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
          <p style="color:#9ca3af;font-size:12px">Powered by FlavorFind HotelManager</p>
        </body>
        </html>
        HTML;
    }

    // ─── SMS ─────────────────────────────────────────────────────────────────

    /**
     * Send an SMS confirmation.
     *
     * In non-production environments (or when no SMS provider is configured)
     * this logs the message instead of making a real API call.
     *
     * To wire a real provider:
     *  - Africa's Talking: implement via AT SDK, key from tenant mpesa credentials or global .env
     *  - Twilio: swap in the Twilio SDK
     *  - Infobip, AfricasTalking, etc.: any PSR-compliant HTTP call
     */
    private function sendConfirmationSms(Reservation $reservation): void
    {
        $date  = $reservation->reserved_at->format('d/m/Y');
        $time  = $reservation->reserved_at->format('H:i');
        $hotel = $reservation->tenant->name;

        $message = "Hi {$reservation->guest_name}, your table for {$reservation->covers} "
            . "at {$hotel} on {$date} at {$time} is confirmed. We look forward to seeing you!";

        // ── Production SMS hook ───────────────────────────────────────────────
        // Replace this block with your SMS provider integration, e.g.:
        //
        //   $africastalking = AfricasTalking::sms();
        //   $africastalking->send([
        //       'to'      => [$reservation->guest_phone],
        //       'message' => $message,
        //   ]);
        //
        // ─────────────────────────────────────────────────────────────────────

        // Stub: log the SMS content (visible in tests + dev)
        Log::info('ReservationConfirmation: SMS stub', [
            'to'             => $reservation->guest_phone,
            'message'        => $message,
            'reservation_id' => $reservation->id,
            'env'            => config('app.env'),
        ]);
    }
}
