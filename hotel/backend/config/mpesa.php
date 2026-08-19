<?php

return [

    /*
    |--------------------------------------------------------------------------
    | M-Pesa / Safaricom Daraja API Configuration
    |--------------------------------------------------------------------------
    |
    | env: 'sandbox' for testing, 'production' for live.
    | All sensitive values should be in .env — never hardcode them here.
    |
    */

    'env' => env('MPESA_ENV', 'sandbox'),

    'consumer_key'    => env('MPESA_CONSUMER_KEY', ''),
    'consumer_secret' => env('MPESA_CONSUMER_SECRET', ''),

    // Lipa Na M-Pesa Online passkey (from Daraja portal)
    'passkey'   => env('MPESA_PASSKEY', ''),

    // Your M-Pesa paybill or till number
    'shortcode' => env('MPESA_SHORTCODE', ''),

    // The URL Safaricom will POST the STK push result to.
    // Must be publicly accessible (use ngrok in local development).
    'callback_url' => env('MPESA_CALLBACK_URL', ''),

    /*
    |--------------------------------------------------------------------------
    | Daraja API Endpoints
    |--------------------------------------------------------------------------
    */
    'endpoints' => [
        'sandbox' => [
            'auth'  => 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            'stk'   => 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            'query' => 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
        ],
        'production' => [
            'auth'  => 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            'stk'   => 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            'query' => 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query',
        ],
    ],

];
