<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HostController;
use App\Http\Controllers\VisitController;
use App\Http\Controllers\VisitorController;
use App\Models\VisitorBadge;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard',[DashboardController::class,'index'])->name('dashboard');

    Route::get('/badges/index',function(){
        return inertia('badges/index',[
            'badges' => VisitorBadge::with('currentAssignment.visit.visitor')->get(),
        ]);
    });

});

// Visitor Check-in Routes (Public - no authentication required)
Route::prefix('visitor')->group(function () {
    // Show the check-in form (accessed via QR code)
    Route::get('/check-in', [VisitorController::class, 'showCheckInForm'])
        ->name('visitor.check-in.form');

    Route::get('/check-in/qr', [VisitorController::class, 'showVisitorFormQr'])
        ->name('visitor.check-in.form.qr');
    // Handle check-in form submission
    Route::post('/check-in', [VisitorController::class, 'checkIn'])
        ->name('visitor.check-in.submit');
});



// Visit management routes
Route::middleware(['auth'])->group(function () {
    // Validation routes
    Route::post('/visits/{visit}/validate', [VisitController::class, 'validate'])
        ->name('visits.validate');

    Route::post('/visits/{visit}/deny', [VisitController::class, 'deny'])
        ->name('visits.deny');

    // Get available badges for assignment
    Route::get('/visits/available-badges', [VisitController::class, 'getAvailableBadges'])
        ->name('visits.available-badges');

    // Checkout visitor
    Route::post('/visits/{visit}/checkout', [VisitController::class, 'checkout'])
        ->name('visits.checkout');

    // Generate visit report
    Route::get('/visits/{visit}/report', [VisitController::class, 'generateReport'])
        ->name('visits.report');

    // Standard CRUD routes for visits
    Route::resource('visits', VisitController::class);

    Route::get('/visitors/index', [VisitorController::class, 'table'])->name('visitors.table');

});




require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
