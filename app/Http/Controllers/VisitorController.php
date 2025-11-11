<?php

namespace App\Http\Controllers;

use App\Events\VisitCreated;
use App\Events\VisitorCreated;
use App\Models\BadgeAssignment;
use App\Models\Visitor;
use App\Models\Visit;
use App\Models\VisitorBadge;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class VisitorController {
    /**
     * Show the visitor check-in form
     */
    public function showCheckInForm()
    {
        return Inertia::render('visitors/visitor-checkin');
    }
    public function showVisitorFormQr(){
        return Inertia::render('visitors/visitor-checkin-qr');
    }

    /**
     * Handle visitor check-in submission
     */
//    public function checkIn(Request $request)
//    {
////        dd($request->all());
//        // Validate the incoming request
//        $validator = Validator::make($request->all(), [
//            'first_name' => 'required|string|max:255',
//            'last_name' => 'required|string|max:255',
//            'company' => 'nullable|string|max:255',
//            'person_to_visit' => 'required|string|max:255',
//            'visit_purpose' => 'required|string|max:1000',
//            'visit_purpose_other' => 'required_if:visit_purpose,Others|string|max:255|nullable',
//            'visitor_type' => 'required',
//            'visitor_type_other' => 'required_if:visitor_type,Other|string|max:255|nullable',
//        ]);
//
//
//        if ($validator->fails()) {
//            return redirect()->back()
//                ->withErrors($validator)
//                ->withInput();
//        }
//
//        try {
//            // Check if visitor already exists (by email and phone)
//            $visitor = Visitor::where('name', $request->name)
//                ->first();
//
//            // If visitor doesn't exist, create a new one
//            if (!$visitor) {
//                $visitor = Visitor::create([
//                    'name' => $request->name,
//                    'company' => $request->company,
//                    'person_to_visit' => $request->person_to_visit,
//                    'visit_purpose' => $request->visit_purpose,
//                    'type' =>  $request->visitor_type,
//                ]);
//            } else {
//                // Update existing visitor information if needed
//                $visitor->update([
//                    'name' => $request->name,
//                    'company' => $request->company,
//                    'person_to_visit' => $request->person_to_visit,
//                    'visit_purpose' => $request->visit_purpose,
//                    'type' =>  $request->visitor_type,
//                ]);
//            }
//
//            // Check if visitor has an active visit (not checked out)
//            $activeVisit = Visit::where('visitor_id', $visitor->id)
//                ->whereIn('status', ['checked_in', 'ongoing'])
//                ->first();
//
//            if ($activeVisit) {
//                return redirect()->back()
//                    ->with('error', 'You already have an active visit. Please check out first before creating a new visit.');
//            }
//
//            // Create a new visit record with 'checked_in' status
//            $visit = Visit::create([
//                'visitor_id' => $visitor->id,
//                'status' => 'checked_in',
//                'check_in_time' => now(),
//                // These fields will be filled by staff during validation
//                'validated_by' => null,
//                'id_type_checked' => null,
//                'id_number_checked' => null,
//                'validation_notes' => null,
//            ]);
//
//            // Log the activity
//            \Log::info('New visitor check-in', [
//                'visitor_id' => $visitor->id,
//                'visit_id' => $visit->id,
//                'name' => $visitor->name,
//                'company' => $visitor->company,
//                'person_to_visit' => $visitor->person_to_visit,
//                'ip_address' => $request->ip(),
//                'user_agent' => $request->userAgent(),
//            ]);
//
////            event(new VisitorCreated($visitor));
//            event(new VisitCreated($visit));
//
//
//            // Redirect with success message
//            return redirect()->back()
//                ->with('success', 'Check-in successful! Please proceed to the reception desk.');
//
//        } catch (\Exception $e) {
//            \Log::error('Visitor check-in failed', [
//                'error' => $e->getMessage(),
//                'request_data' => $request->all(),
//            ]);
//
//            return redirect()->back()
//                ->with('error', 'An error occurred during check-in. Please try again or contact reception.')
//                ->withInput();
//        }
//    }

    public function checkIn(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'company' => 'nullable|string|max:255',
            'person_to_visit' => 'required|string|max:255',
            'visit_purpose' => 'required|string|max:1000',
            'visit_purpose_other' => 'required_if:visit_purpose,Others|string|max:255|nullable',
            'visitor_type' => 'required|string|max:255',
            'visitor_type_other' => 'required_if:visitor_type,Other|string|max:255|nullable',
        ]);

        try {
            // Replace "Others" with custom text if provided
            $visitPurpose = $validated['visit_purpose'];
            if ($visitPurpose === 'Others' && isset($validated['visit_purpose_other']) && !empty(trim($validated['visit_purpose_other']))) {
                $visitPurpose = $validated['visit_purpose_other'];
            }

            // Replace "Other" with custom text if provided
            $visitorType = $validated['visitor_type'];
            if ($visitorType === 'Other' && isset($validated['visitor_type_other']) && !empty(trim($validated['visitor_type_other']))) {
                $visitorType = $validated['visitor_type_other'];
            }

            // Always create a new visitor record for check-in
            $visitor = Visitor::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'company' => $validated['company'] ?? null,
                'person_to_visit' => $validated['person_to_visit'],
                'visit_purpose' => $visitPurpose,
                'type' => $visitorType,
            ]);

            // Create a visit record
            $visit = Visit::create([
                'visitor_id' => $visitor->id,
                'status' => 'checked_in',
                'check_in_time' => now(),
            ]);

            event(new VisitCreated($visit));

            return redirect()->back()->with('success', 'Check-in successful! Please proceed to the reception desk.');

        } catch (\Exception $e) {
            \Log::error('Visitor check-in failed', [
                'error' => $e->getMessage(),
                'request_data' => $request->all(),
            ]);

            return redirect()->back()
                ->with('error', 'An error occurred during check-in. Please try again or contact reception.')
                ->withInput();
        }
    }



    public function index()
    {
        return inertia('visitors/index',[
            'visitors' => Visit::with([
                'visitor',
                'currentBadgeAssignment.badge'
            ])
                ->orderByDesc('created_at')
                ->get(),
        ]);

    }

    public function getInsights(Request $request)
    {
        // Get date range from request or default to last 30 days
        $dateFrom = $request->get('dateFrom', now()->subDays(30));
        $dateTo = $request->get('dateTo', now());

        // Top Companies/Vendors
        $topCompanies = Visit::with('visitor')
            ->whereBetween('check_in_time', [$dateFrom, $dateTo])
            ->whereHas('visitor', function($q) {
                $q->whereNotNull('company')
                  ->where('company', '!=', '');
            })
            ->get()
            ->groupBy(function($visit) {
                return $visit->visitor->company;
            })
            ->map(function($visits) {
                return [
                    'company' => $visits->first()->visitor->company,
                    'count' => $visits->count()
                ];
            })
            ->sortByDesc('count')
            ->take(5)
            ->values();

        // Top Visitors (most frequent)
        $topVisitors = Visit::with('visitor')
            ->whereBetween('check_in_time', [$dateFrom, $dateTo])
            ->get()
            ->map(function ($visit) {
                return [
                    'first_name' => $visit->visitor->first_name,
                    'last_name'  => $visit->visitor->last_name,
                    'company'    => $visit->visitor->company,
                    'name'       => $visit->visitor->name,
                    'visitor_id' => $visit->visitor_id,
                ];
            })
            ->groupBy(function ($item) {
                // Combine identifying fields to make a unique group key
                return $item['first_name'] . ' ' . $item['last_name'] . '|' . $item['company'];
            })
            ->map(function ($group) {
                $first = $group->first();
                return [
                    'name'    => $first['name'],
                    'company' => $first['company'],
                    'count'   => $group->count(),
                ];
            })
            ->sortByDesc('count')
            ->take(5)
            ->values();


        // Top Persons to Visit (hosts)
        $topHosts = Visit::with('visitor')
            ->whereBetween('check_in_time', [$dateFrom, $dateTo])
            ->whereHas('visitor', function($q) {
                $q->whereNotNull('person_to_visit')
                  ->where('person_to_visit', '!=', '');
            })
            ->get()
            ->groupBy(function($visit) {
                return $visit->visitor->person_to_visit;
            })
            ->map(function($visits) {
                return [
                    'host' => $visits->first()->visitor->person_to_visit,
                    'count' => $visits->count()
                ];
            })
            ->sortByDesc('count')
            ->take(5)
            ->values();

        // Top Visit Purposes
        $topPurposes = Visit::with('visitor')
            ->whereBetween('check_in_time', [$dateFrom, $dateTo])
            ->whereHas('visitor', function($q) {
                $q->whereNotNull('visit_purpose')
                  ->where('visit_purpose', '!=', '');
            })
            ->get()
            ->groupBy(function($visit) {
                return $visit->visitor->visit_purpose;
            })
            ->map(function($visits) {
                return [
                    'purpose' => $visits->first()->visitor->visit_purpose,
                    'count' => $visits->count()
                ];
            })
            ->sortByDesc('count')
            ->take(5)
            ->values();

        // Top Visitor Types
        $topTypes = Visit::with('visitor')
            ->whereBetween('check_in_time', [$dateFrom, $dateTo])
            ->whereHas('visitor', function($q) {
                $q->whereNotNull('type')
                  ->where('type', '!=', '');
            })
            ->get()
            ->groupBy(function($visit) {
                return $visit->visitor->type;
            })
            ->map(function($visits) {
                return [
                    'type' => $visits->first()->visitor->type,
                    'count' => $visits->count()
                ];
            })
            ->sortByDesc('count')
            ->take(5)
            ->values();

        // Total visits in period
        $totalVisits = Visit::whereBetween('check_in_time', [$dateFrom, $dateTo])->count();

        return response()->json([
            'success' => true,
            'data' => [
                'topCompanies' => $topCompanies,
                'topVisitors' => $topVisitors,
                'topHosts' => $topHosts,
                'topPurposes' => $topPurposes,
                'topTypes' => $topTypes,
                'totalVisits' => $totalVisits,
                'dateRange' => [
                    'from' => $dateFrom,
                    'to' => $dateTo
                ]
            ]
        ]);
    }

    public function table(Request $request)
    {
        $query = Visit::with([
            'visitor',
            'currentBadgeAssignment.badge'
        ]);

        // Global search across multiple fields
        if ($request->filled('globalFilter')) {
            $search = $request->get('globalFilter');
            $query->whereHas('visitor', function($q) use ($search) {
                $q->where('visitors.first_name', 'like', "%{$search}%")
                    ->orWhere('visitors.last_name', 'like', "%{$search}%")
                    ->orWhere('company', 'like', "%{$search}%")
                    ->orWhere('visitors.visit_purpose', 'like', "%{$search}%")
                    ->orWhere('person_to_visit', 'like', "%{$search}%");
            });
        }

        // Quick filters
        if ($request->filled('quickFilter')) {
            $quickFilter = $request->get('quickFilter');

            switch ($quickFilter) {
                case 'today':
                    $query->whereDate('check_in_time', today());
                    break;

                case 'week':
                    $query->whereBetween('check_in_time', [
                        now()->startOfWeek(),
                        now()->endOfWeek()
                    ]);
                    break;

                case 'checked_in':
                    $query->where('status', 'checked_in');
                    break;

                case 'ongoing':
                    $query->where('status', 'ongoing');
                    break;

                case 'checked_out':
                    $query->where('status', 'checked_out');
                    break;

                case 'denied':
                    $query->where('status', 'denied');
                    break;
            }
        }

        // Date range filter - Fix the request parameter access
        if ($request->has('dateRange') || $request->filled(['dateRange[from]', 'dateRange[to]'])) {
            // Try both ways Laravel might parse the parameters
            $dateFrom = $request->get('dateRange')['from'] ?? $request->get('dateRange[from]');
            $dateTo = $request->get('dateRange')['to'] ?? $request->get('dateRange[to]');

            if ($dateFrom && $dateTo) {
                // Both dates provided
                $query->whereBetween('check_in_time', [
                    Carbon::parse($dateFrom)->startOfDay(),
                    Carbon::parse($dateTo)->endOfDay()
                ]);
            } elseif ($dateFrom) {
                // Only start date provided
                $query->where('check_in_time', '>=', Carbon::parse($dateFrom)->startOfDay());
            } elseif ($dateTo) {
                // Only end date provided
                $query->where('check_in_time', '<=', Carbon::parse($dateTo)->endOfDay());
            }
        }

        // Column-specific filters
        if ($request->filled('columnFilters')) {
            $columnFilters = $request->get('columnFilters');

            foreach ($columnFilters as $filter) {
                $columnId = $filter['id'];
                $value = $filter['value'];

                switch ($columnId) {
                    case 'status':
                        $query->where('status', $value);
                        break;
                    case 'name':
                        $query->whereHas('visitor', function($q) use ($value) {
                            $q->where('first_name', 'like', "%{$value}%")
                            ->orWhere('last_name', 'like', "%{$value}%");
                        });
                        break;
                    case 'company':
                        $query->whereHas('visitor', function($q) use ($value) {
                            $q->where('company', 'like', "%{$value}%");
                        });
                        break;
                }
            }
        }

        // Sorting
        if ($request->filled('sorting')) {
            $sort = $request->input('sorting');

            $columnId = $sort['id'] ?? null;
            $desc = filter_var($sort['desc'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $direction = $desc ? 'desc' : 'asc';

            if ($columnId) {
                switch ($columnId) {
                    case 'name':
                        $query->join('visitors', 'visits.visitor_id', '=', 'visitors.id')
                            ->orderBy('visitors.first_name', $direction)
                            ->select('visits.*');
                        break;

                    case 'check_in_time':
                        $query->orderBy('check_in_time', $direction);
                        break;

                    case 'status':
                        $query->orderBy('status', $direction);
                        break;

                    default:
                        $query->orderBy('created_at', $direction);
                        break;
                }
            }
        } else {
            $query->orderByDesc('created_at');
        }

        // Pagination
        $pageSize = $request->get('pageSize', 20);
        $pageIndex = $request->get('pageIndex', 0);

        $visits = $query->paginate(
            perPage: $pageSize,
            page: $pageIndex + 1
        );

        return inertia('visitors/index', [
            'visits' => [
                'data' => $visits->items(),
                'links' => $visits->links(),
                'meta' => [
                    'current_page' => $visits->currentPage(),
                    'last_page' => $visits->lastPage(),
                    'per_page' => $visits->perPage(),
                    'total' => $visits->total(),
                    'from' => $visits->firstItem(),
                    'to' => $visits->lastItem(),
                ]
            ],
            'meta' => [
                'pageCount' => $visits->lastPage(),
                'pageIndex' => $visits->currentPage() - 1,
                'pageSize' => $visits->perPage(),
                'total' => $visits->total(),
                'hasNextPage' => $visits->hasMorePages(),
                'hasPreviousPage' => $visits->currentPage() > 1,
            ]
        ]);
    }

}
