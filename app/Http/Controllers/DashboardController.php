<?php

namespace App\Http\Controllers;

use App\Models\Visit;

class DashboardController
{
    public function index()
    {
        return inertia('dashboard/dashboard', [
            'visits' => Visit::with([
                'visitor',
                'currentBadgeAssignment.badge'
            ])
                ->whereDate('check_in_time', today())
                ->orderByDesc('created_at')
                ->get(),
        ]);

    }
}
