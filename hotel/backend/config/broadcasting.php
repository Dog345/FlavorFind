<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Broadcaster
    |--------------------------------------------------------------------------
    |
    | Set to 'reverb' for production WebSocket broadcasting via Laravel Reverb.
    | Set to 'log' during development if you don't want to run the Reverb server.
    | Set to 'null' to disable broadcasting entirely (e.g. in unit tests).
    |
    */

    'default' => env('BROADCAST_CONNECTION', 'reverb'),

    'connections' => [

        // ── Laravel Reverb (first-party WebSocket server) ────────────────────
        'reverb' => [
            'driver'  => 'reverb',
            'key'     => env('REVERB_APP_KEY'),
            'secret'  => env('REVERB_APP_SECRET'),
            'app_id'  => env('REVERB_APP_ID'),
            'options' => [
                'host'           => env('REVERB_HOST', '0.0.0.0'),
                'port'           => env('REVERB_PORT', 8080),
                'scheme'         => env('REVERB_SCHEME', 'http'),
                'useTLS'         => env('REVERB_SCHEME', 'http') === 'https',
            ],
            'client_options' => [
                // Guzzle client options for server-side publish requests
            ],
        ],

        // ── Pusher (compatible protocol — Reverb uses the same) ───────────────
        'pusher' => [
            'driver'  => 'pusher',
            'key'     => env('PUSHER_APP_KEY'),
            'secret'  => env('PUSHER_APP_SECRET'),
            'app_id'  => env('PUSHER_APP_ID'),
            'options' => [
                'host'    => env('PUSHER_HOST', 'api-mt1.pusher.com'),
                'port'    => env('PUSHER_PORT', 443),
                'scheme'  => env('PUSHER_SCHEME', 'https'),
                'cluster' => env('PUSHER_APP_CLUSTER', 'mt1'),
                'useTLS'  => true,
            ],
            'client_options' => [],
        ],

        // ── Log (development — events written to log file, no real WebSocket) ─
        'log' => [
            'driver' => 'log',
        ],

        // ── Null (testing — disables all broadcasting) ─────────────────────
        'null' => [
            'driver' => 'null',
        ],

    ],

];
