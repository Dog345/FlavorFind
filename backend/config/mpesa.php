<?php

return [
    /*
    |--------------------------------------------------------------------------
    | M-Pesa Daraja API Configuration
    |--------------------------------------------------------------------------
    |
    | These values are pulled from your .env file. Never commit real credentials
    | to source control. Sandbox credentials are safe for development/testing.
    |
    | To get credentials:
    | 1. Register at developer.safaricom.co.ke
    | 2. Create an app → get Consumer Key + Secret
    | 3. Use shortcode 174379 and passkey from the Daraja sandbox docs for testing
    |
    */

    // 'sandbox' or 'production'
    'env' => env('MPESA_ENV', 'sandbox'),

    // OAuth credentials from Safaricom Developer Portal
    'consumer_key'    => env('MPESA_CONSUMER_KEY', ''),
    'consumer_secret' => env('MPESA_CONSUMER_SECRET', ''),

    // Lipa Na M-Pesa Online passkey (from Daraja portal → My Apps → your app)
    'passkey' => env('MPESA_PASSKEY', ''),

    // Your business shortcode (paybill or till number)
    // Use 174379 for sandbox testing
    'shortcode' => env('MPESA_SHORTCODE', '174379'),

    // The publicly reachable URL Safaricom POSTs payment results to.
    // Must be HTTPS in production. Use ngrok/Expose for local dev.
    'callback_url' => env('MPESA_CALLBACK_URL', ''),
];
