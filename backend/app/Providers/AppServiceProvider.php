<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use OpenApi\Analysers\AttributeAnnotationFactory;
use OpenApi\Analysers\DocBlockAnnotationFactory;
use OpenApi\Analysers\ReflectionAnalyser;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configure swagger-php to scan both PHP 8 attributes (#[OA\...])
        // AND docblock annotations (@OA\...). This must be done at runtime
        // (not in the config file) because objects can't be serialized by
        // config:cache — they have no __set_state() method.
        config([
            'l5-swagger.defaults.scanOptions.analyser' => new ReflectionAnalyser([
                new AttributeAnnotationFactory(),
                new DocBlockAnnotationFactory(),
            ]),
        ]);
    }
}
