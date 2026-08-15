<?php

return [

    /*
    |--------------------------------------------------------------------------
    | CORS — Cross-Origin Resource Sharing
    |--------------------------------------------------------------------------
    |
    | The FlavorFind API is called by:
    |   - The standalone website (different domain)
    |   - The Android app (no origin header — treated as non-CORS by browsers)
    |
    | We allow all origins on /api/* routes because this is a public read-only API.
    | No credentials (cookies/tokens) are used for the standalone product.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'OPTIONS'],

    // '*' = any origin. Fine for a public API with no auth.
    // When user accounts are added later, restrict this to specific domains.
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'Accept', 'X-Requested-With'],

    'exposed_headers' => [],

    // Preflight cache — browser won't re-send OPTIONS for 2 hours
    'max_age' => 7200,

    // False = no cookies / Authorization headers. Correct for a public API.
    'supports_credentials' => false,

];
