<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DarajaService
{
    private string $env;
    private string $consumerKey;
    private string $consumerSecret;
    private string $passkey;
    private string $shortcode;
    private string $callbackUrl;

    // Safaricom endpoints
    private array $endpoints = [
        'sandbox'    => [
            'auth'    => 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            'stk'     => 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            'query'   => 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
        ],
        'production' => [
            'auth'    => 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            'stk'     => 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            'query'   => 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query',
        ],
    ];

    public function __construct()
    {
        $this->env           = config('mpesa.env', 'sandbox');
        $this->consumerKey   = config('mpesa.consumer_key');
        $this->consumerSecret = config('mpesa.consumer_secret');
        $this->passkey       = config('mpesa.passkey');
        $this->shortcode     = config('mpesa.shortcode');
        $this->callbackUrl   = config('mpesa.callback_url');
    }

    /**
     * Get a cached OAuth access token.
     * Token is valid for 1 hour — we cache it for 55 minutes.
     */
    public function getAccessToken(): string
    {
        return Cache::remember('mpesa_access_token', 3300, function () {
            $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
                ->get($this->endpoint('auth'));

            if ($response->failed()) {
                Log::error('M-Pesa auth failed', ['response' => $response->body()]);
                throw new \Exception('Failed to obtain M-Pesa access token.');
            }

            return $response->json('access_token');
        });
    }

    /**
     * Initiate an STK Push payment prompt on the customer's phone.
     *
     * @param string $phone      Customer phone in format 254XXXXXXXXX
     * @param int    $amount     Amount in KES (whole number)
     * @param string $orderId    Your internal order ID used as AccountReference
     * @return array             Safaricom response
     */
    public function stkPush(string $phone, int $amount, string $orderId): array
    {
        $timestamp = now()->format('YmdHis');
        $password  = base64_encode($this->shortcode . $this->passkey . $timestamp);

        $payload = [
            'BusinessShortCode' => $this->shortcode,
            'Password'          => $password,
            'Timestamp'         => $timestamp,
            'TransactionType'   => 'CustomerPayBillOnline',
            'Amount'            => $amount,
            'PartyA'            => $phone,
            'PartyB'            => $this->shortcode,
            'PhoneNumber'       => $phone,
            'CallBackURL'       => $this->callbackUrl,
            'AccountReference'  => substr($orderId, 0, 12), // max 12 chars
            'TransactionDesc'   => 'FlavorFind Order Payment',
        ];

        $response = Http::withToken($this->getAccessToken())
            ->post($this->endpoint('stk'), $payload);

        if ($response->failed()) {
            Log::error('M-Pesa STK Push failed', [
                'order_id' => $orderId,
                'response' => $response->body(),
            ]);
            throw new \Exception('STK Push request failed: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Query the status of an STK Push transaction.
     */
    public function queryStatus(string $checkoutRequestId): array
    {
        $timestamp = now()->format('YmdHis');
        $password  = base64_encode($this->shortcode . $this->passkey . $timestamp);

        $response = Http::withToken($this->getAccessToken())
            ->post($this->endpoint('query'), [
                'BusinessShortCode' => $this->shortcode,
                'Password'          => $password,
                'Timestamp'         => $timestamp,
                'CheckoutRequestID' => $checkoutRequestId,
            ]);

        return $response->json();
    }

    /**
     * Parse a Safaricom STK Push callback payload.
     * Returns structured data regardless of success/failure.
     */
    public function parseCallback(array $payload): array
    {
        $stkCallback = $payload['Body']['stkCallback'] ?? [];
        $resultCode  = $stkCallback['ResultCode'] ?? -1;
        $success     = $resultCode === 0;

        $receipt = null;
        $amount  = null;
        $phone   = null;

        if ($success) {
            $items = collect($stkCallback['CallbackMetadata']['Item'] ?? []);
            $receipt = $items->firstWhere('Name', 'MpesaReceiptNumber')['Value'] ?? null;
            $amount  = $items->firstWhere('Name', 'Amount')['Value'] ?? null;
            $phone   = $items->firstWhere('Name', 'PhoneNumber')['Value'] ?? null;
        }

        return [
            'success'              => $success,
            'result_code'          => $resultCode,
            'result_desc'          => $stkCallback['ResultDesc'] ?? '',
            'merchant_request_id'  => $stkCallback['MerchantRequestID'] ?? null,
            'checkout_request_id'  => $stkCallback['CheckoutRequestID'] ?? null,
            'mpesa_receipt'        => $receipt,
            'amount'               => $amount,
            'phone'                => $phone,
        ];
    }

    private function endpoint(string $key): string
    {
        return $this->endpoints[$this->env][$key];
    }
}
