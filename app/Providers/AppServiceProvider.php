<?php

namespace App\Providers;

use App\Services\DtrApiService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(DtrApiService::class, function ($app) {
            return new DtrApiService(
                config('services.dtr.base_url'),
                config('services.dtr.token'),
                config('services.dtr.timeout', 10)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
