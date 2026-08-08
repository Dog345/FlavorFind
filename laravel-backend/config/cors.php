<?php

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins
    |--------------------------------------------------------------------------
    | Add your Next.js frontend URL here. Flutter (mobile) doesn't need CORS.
    | In production replace * with your actual domain.
    */
    'allowed_origins' => [
        'http://localhost:3000',   // Next.js dev
        env('FRONTEND_URL', '*'),  // Production Next.js URL
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [
        'X-Key-Used',
        'X-Requests-Remaining',
    ],

    'max_age' => 0,

    'supports_credentials' => false,

];
