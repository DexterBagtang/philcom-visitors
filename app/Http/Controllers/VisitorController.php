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
use Illuminate\Support\Str;
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

            // Check for duplicate submission within the last 2 minutes
            $recentDuplicate = Visitor::where('first_name', $validated['first_name'])
                ->where('last_name', $validated['last_name'])
                ->where('company', $validated['company'] ?? null)
                ->where('person_to_visit', $validated['person_to_visit'])
                ->whereHas('visits', function($query) {
                    $query->where('created_at', '>=', now()->subMinutes(2));
                })
                ->first();

            if ($recentDuplicate) {
                \Log::warning('Duplicate check-in attempt detected', [
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'company' => $validated['company'] ?? null,
                    'ip_address' => $request->ip(),
                ]);

                return redirect()->back()
                    ->withErrors(['duplicate' => 'You have already checked in recently. Please proceed to the reception desk.'])
                    ->withInput();
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

    /**
     * Handle group check-in submission
     */
    public function checkInGroup(Request $request)
    {
        // Validate the group leader data
        $validated = $request->validate([
            'group_leader' => 'required|array',
            'group_leader.first_name' => 'required|string|max:255',
            'group_leader.last_name' => 'required|string|max:255',
            'group_leader.company' => 'required|string|max:255',
            'group_leader.person_to_visit' => 'required|string|max:255',
            'group_leader.visit_purpose' => 'required|string|max:1000',
            'group_leader.visit_purpose_other' => 'required_if:group_leader.visit_purpose,Others|string|max:255|nullable',
            'group_leader.visitor_type' => 'required|string|max:255',
            'group_leader.visitor_type_other' => 'required_if:group_leader.visitor_type,Other|string|max:255|nullable',
            
            'companions' => 'required|array|min:1|max:20',
            'companions.*.first_name' => 'required|string|max:255',
            'companions.*.last_name' => 'required|string|max:255',
            'companions.*.person_to_visit' => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            // Generate unique group ID
            $groupId = 'GRP-' . now()->format('YmdHis') . '-' . Str::random(6);

            // Process visit purpose and type for group leader
            $leaderData = $validated['group_leader'];
            $visitPurpose = $leaderData['visit_purpose'];
            if ($visitPurpose === 'Others' && !empty($leaderData['visit_purpose_other'])) {
                $visitPurpose = $leaderData['visit_purpose_other'];
            }

            $visitorType = $leaderData['visitor_type'];
            if ($visitorType === 'Other' && !empty($leaderData['visitor_type_other'])) {
                $visitorType = $leaderData['visitor_type_other'];
            }

            // Create group leader visitor and visit
            $leaderVisitor = Visitor::create([
                'first_name' => $leaderData['first_name'],
                'last_name' => $leaderData['last_name'],
                'company' => $leaderData['company'],
                'person_to_visit' => $leaderData['person_to_visit'],
                'visit_purpose' => $visitPurpose,
                'type' => $visitorType,
            ]);

            $leaderVisit = Visit::create([
                'visitor_id' => $leaderVisitor->id,
                'status' => 'checked_in',
                'check_in_time' => now(),
                'group_id' => $groupId,
                'is_group_leader' => true,
                'group_leader_visit_id' => null,
            ]);

            // Update leader visit to reference itself as group leader
            $leaderVisit->update(['group_leader_visit_id' => $leaderVisit->id]);

            // Create companion visitors and visits
            $companionVisits = [];
            foreach ($validated['companions'] as $companionData) {
                $companionVisitor = Visitor::create([
                    'first_name' => $companionData['first_name'],
                    'last_name' => $companionData['last_name'],
                    'company' => $leaderData['company'], // Same company as leader
                    'person_to_visit' => $companionData['person_to_visit'] ?? $leaderData['person_to_visit'], // Use companion's person_to_visit if provided, else leader's
                    'visit_purpose' => $visitPurpose, // Same purpose
                    'type' => $visitorType, // Same type
                ]);

                $companionVisit = Visit::create([
                    'visitor_id' => $companionVisitor->id,
                    'status' => 'checked_in',
                    'check_in_time' => now(),
                    'group_id' => $groupId,
                    'is_group_leader' => false,
                    'group_leader_visit_id' => $leaderVisit->id,
                ]);

                $companionVisits[] = $companionVisit;
            }

            // Log the group check-in
            \Log::info('Group check-in successful', [
                'group_id' => $groupId,
                'leader_visit_id' => $leaderVisit->id,
                'leader_name' => $leaderVisitor->name,
                'company' => $leaderData['company'],
                'group_size' => count($validated['companions']) + 1,
                'ip_address' => $request->ip(),
            ]);

            // Broadcast events for real-time updates
            event(new VisitCreated($leaderVisit));
            foreach ($companionVisits as $companionVisit) {
                event(new VisitCreated($companionVisit));
            }

            DB::commit();

            return redirect()->back()->with('success', [
                'message' => 'Group check-in successful!',
                'group_size' => count($validated['companions']) + 1,
                'group_id' => $groupId,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('Group check-in failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return redirect()->back()
                ->with('error', 'An error occurred during group check-in. Please try again or contact reception.')
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

                case 'overdue':
                    $query->overdue();
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
