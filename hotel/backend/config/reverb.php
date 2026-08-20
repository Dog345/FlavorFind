<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Laravel Reverb — WebSocket Server Configuration
    |--------------------------------------------------------------------------
    |
    | Reverb is Laravel's first-party WebSocket server.
    | It handles real-time broadcasting for the KDS, dashboard, and guest app.
    |
    | Start the server in development:
    |   php artisan reverb:start
    |
    | In production, use Supervisor to keep it running:
    |   php artisan reverb:start --host=0.0.0.0 --port=8080
    |
    */

    'servers' => [

        'reverb' => [
            'host'     => env('REVERB_HOST', '0.0.0.0'),
            'hostname' => env('REVERB_HOST', '0.0.0.0'),
            'port'     => env('REVERB_PORT', 8080),
            'scheme'   => env('REVERB_SCHEME', 'http'),

            // Maximum allowed connections (tune based on server RAM)
            'max_request_size' => env('REVERB_MAX_REQUEST_SIZE', 10_000),

            'options' => [
                'tls' => [],
            ],

            // How long before an idle connection is considered stale (seconds)
            'ping_interval' => env('REVERB_PING_INTERVAL', 60),

            // Scaling: set to 'redis' for multi-server deployments
            'scaling' => [
                'enabled'    => env('REVERB_SCALING_ENABLED', false),
                'channel'    => env('REVERB_SCALING_CHANNEL', 'reverb'),
                'connection' => env('REVERB_SCALING_CONNECTION', 'default'),
            ],
        ],

    ],

    'apps' => [

        'provider' => 'config',

        'apps' => [
            [
                'key'             => env('REVERB_APP_KEY', 'hotel-app-key'),
                'secret'          => env('REVERB_APP_SECRET', 'hotel-app-secret'),
                'app_id'          => env('REVERB_APP_ID', 'hotel-app'),
                'options'         => [
                    'host'   => env('REVERB_HOST', '0.0.0.0'),
                    'port'   => env('REVERB_PORT', 8080),
                    'scheme' => env('REVERB_SCHEME', 'http'),
                ],
                'allowed_origins' => ['*'],
                'ping_interval'   => env('REVERB_PING_INTERVAL', 60),
                'max_message_size'=> env('REVERB_MAX_REQUEST_SIZE', 10_000),
            ],
        ],

    ],

];
