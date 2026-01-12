<?php

use App\Http\Controllers\Api\SyncEmployeesController;
use Illuminate\Support\Facades\Route;

Route::post('/employees/sync', SyncEmployeesController::class);
