<?php

namespace App\Http\Controllers;

use App\Exports\VisitsExport;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;

class ExportController extends Controller
{
    /**
     * Show the export page
     */
    public function index()
    {
        // Get some statistics for the export page
        $stats = [
            'total_visits' => Visit::count(),
            'today_visits' => Visit::whereDate('check_in_time', today())->count(),
            'this_week_visits' => Visit::whereBetween('check_in_time', [
                now()->startOfWeek(),
                now()->endOfWeek()
            ])->count(),
            'this_month_visits' => Visit::whereMonth('check_in_time', now()->month)
                ->whereYear('check_in_time', now()->year)
                ->count(),
        ];

        return Inertia::render('exports/index', [
            'stats' => $stats
        ]);
    }

    /**
     * Export visitors to Excel
     */
    public function export(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'status' => 'nullable|in:all,checked_in,ongoing,checked_out',
            'include_checkout' => 'nullable|boolean',
        ]);

        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $status = $request->input('status', 'all');
        $includeCheckOut = $request->input('include_checkout', true);

        // Generate filename
        $filename = 'visitors_export_';

        if ($dateFrom && $dateTo) {
            $filename .= Carbon::parse($dateFrom)->format('Ymd') . '_to_' . Carbon::parse($dateTo)->format('Ymd');
        } elseif ($dateFrom) {
            $filename .= 'from_' . Carbon::parse($dateFrom)->format('Ymd');
        } elseif ($dateTo) {
            $filename .= 'until_' . Carbon::parse($dateTo)->format('Ymd');
        } else {
            $filename .= 'all_records';
        }

        if ($status !== 'all') {
            $filename .= '_' . $status;
        }

        $filename .= '_' . now()->format('YmdHis') . '.xlsx';

        return Excel::download(
            new VisitsExport($dateFrom, $dateTo, $status, $includeCheckOut),
            $filename
        );
    }

    /**
     * Preview export data (for display before download)
     */
    public function preview(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'status' => 'nullable|in:all,checked_in,ongoing,checked_out',
        ]);

        $query = Visit::with(['visitor', 'latestBadgeAssignment.badge']);

        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $status = $request->input('status', 'all');

        // Apply filters
        if ($dateFrom && $dateTo) {
            $query->whereBetween('check_in_time', [
                Carbon::parse($dateFrom)->startOfDay(),
                Carbon::parse($dateTo)->endOfDay()
            ]);
        } elseif ($dateFrom) {
            $query->where('check_in_time', '>=', Carbon::parse($dateFrom)->startOfDay());
        } elseif ($dateTo) {
            $query->where('check_in_time', '<=', Carbon::parse($dateTo)->endOfDay());
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        // Get total count before limiting
        $totalCount = $query->count();

        // Get first 10 records for preview
        $visits = $query->orderBy('check_in_time', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'preview' => $visits,
            'total_count' => $totalCount
        ]);
    }
}
