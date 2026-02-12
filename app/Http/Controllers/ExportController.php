<?php

namespace App\Http\Controllers;

use App\Constants\VisitorConstants;
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
            'visitor_types' => 'nullable|array',
            'visitor_types.*' => 'string|in:Contractor,Vendor,Visitor,Client,Delivery Personnel,Applicant,Other',
            'visit_purposes' => 'nullable|array',
            'visit_purposes.*' => 'string|in:Official Business,Meeting,Delivery,Collection,Payment,Billing,Submit Documents / Requirements,Interview,Repair/Maintenance,Others',
        ]);

        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $status = $request->input('status', 'all');
        $includeCheckOut = $request->input('include_checkout', true);
        $visitorTypes = $request->input('visitor_types', []);
        $visitPurposes = $request->input('visit_purposes', []);

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

        if (!empty($visitorTypes)) {
            $filename .= '_' . count($visitorTypes) . 'types';
        }

        if (!empty($visitPurposes)) {
            $filename .= '_' . count($visitPurposes) . 'purposes';
        }

        $filename .= '_' . now()->format('YmdHis') . '.xlsx';

        return Excel::download(
            new VisitsExport($dateFrom, $dateTo, $status, $includeCheckOut, $visitorTypes, $visitPurposes),
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
            'visitor_types' => 'nullable|array',
            'visitor_types.*' => 'string|in:Contractor,Vendor,Visitor,Client,Delivery Personnel,Applicant,Other',
            'visit_purposes' => 'nullable|array',
            'visit_purposes.*' => 'string|in:Official Business,Meeting,Delivery,Collection,Payment,Billing,Submit Documents / Requirements,Interview,Repair/Maintenance,Others',
        ]);

        $query = Visit::with(['visitor', 'latestBadgeAssignment.badge']);

        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $status = $request->input('status', 'all');
        $visitorTypes = $request->input('visitor_types', []);
        $visitPurposes = $request->input('visit_purposes', []);

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

        if (!empty($visitorTypes)) {
            $query->whereHas('visitor', function($q) use ($visitorTypes) {
                // Check if "Other" is in the selected types
                $hasOther = in_array('Other', $visitorTypes);
                $standardTypes = array_diff($visitorTypes, ['Other']);

                if ($hasOther && !empty($standardTypes)) {
                    // Include both standard types AND anything not in predefined list
                    $q->where(function($subQ) use ($standardTypes) {
                        $subQ->whereIn('type', $standardTypes)
                            ->orWhereNotIn('type', VisitorConstants::PREDEFINED_VISITOR_TYPES);
                    });
                } elseif ($hasOther) {
                    // Only "Other" is selected - get everything not in predefined list
                    $q->whereNotIn('type', VisitorConstants::PREDEFINED_VISITOR_TYPES);
                } else {
                    // No "Other" selected - use standard filtering
                    $q->whereIn('type', $standardTypes);
                }
            });
        }

        if (!empty($visitPurposes)) {
            $query->whereHas('visitor', function($q) use ($visitPurposes) {
                // Check if "Others" is in the selected purposes
                $hasOthers = in_array('Others', $visitPurposes);
                $standardPurposes = array_diff($visitPurposes, ['Others']);

                if ($hasOthers && !empty($standardPurposes)) {
                    // Include both standard purposes AND anything not in predefined list
                    $q->where(function($subQ) use ($standardPurposes) {
                        $subQ->whereIn('visit_purpose', $standardPurposes)
                            ->orWhereNotIn('visit_purpose', VisitorConstants::PREDEFINED_VISIT_PURPOSES);
                    });
                } elseif ($hasOthers) {
                    // Only "Others" is selected - get everything not in predefined list
                    $q->whereNotIn('visit_purpose', VisitorConstants::PREDEFINED_VISIT_PURPOSES);
                } else {
                    // No "Others" selected - use standard filtering
                    $q->whereIn('visit_purpose', $standardPurposes);
                }
            });
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
