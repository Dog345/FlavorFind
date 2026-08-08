<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Spoonacular API Keys Pool
    |--------------------------------------------------------------------------
    | All keys are loaded from .env. Empty/null keys are filtered out
    | automatically so you can add keys incrementally.
    */

    'keys' => array_values(array_filter([
        env('SPOONACULAR_KEY_1'),
        env('SPOONACULAR_KEY_2'),
        env('SPOONACULAR_KEY_3'),
        env('SPOONACULAR_KEY_4'),
        env('SPOONACULAR_KEY_5'),
        env('SPOONACULAR_KEY_6'),
        env('SPOONACULAR_KEY_7'),
        env('SPOONACULAR_KEY_8'),
        env('SPOONACULAR_KEY_9'),
        env('SPOONACULAR_KEY_10'),
        env('SPOONACULAR_KEY_11'),
        env('SPOONACULAR_KEY_12'),
        env('SPOONACULAR_KEY_13'),
        env('SPOONACULAR_KEY_14'),
        env('SPOONACULAR_KEY_15'),
    ])),

    /*
    |--------------------------------------------------------------------------
    | Daily Request Limit Per Key
    |--------------------------------------------------------------------------
    | Spoonacular free tier = 150 requests/day per key.
    | With 15 keys = 2,250 requests/day total.
    */

    'daily_limit' => (int) env('SPOONACULAR_DAILY_LIMIT', 150),

    'base_url' => 'https://api.spoonacular.com',

];
