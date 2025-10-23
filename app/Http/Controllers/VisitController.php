<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Visit;
use App\Models\VisitorBadge;
use App\Models\BadgeAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VisitController extends Controller
{
    /**
     * Validate a visitor and assign a badge
     */
    public function validate(Request $request, Visit $visit)
    {
        try {
            // Validate the request data
            $validated = $request->validate([
                'id_type_checked' => 'required|string|max:50',
                'id_number_checked' => 'required|string|max:100',
                'validation_notes' => 'nullable|string|max:1000',
                'selected_badge_id' => 'required|exists:visitor_badges,id',
                'validated_by' => 'required|string|max:100',
            ]);

            // Check if visit can be validated
            if ($visit->status !== 'checked_in') {
                return back()->withErrors([
                    'general' => 'This visit cannot be validated. Current status: ' . $visit->status
                ]);
            }

            // Check if the selected badge is still available
            $badge = VisitorBadge::find($validated['selected_badge_id']);
            if (!$badge || $badge->status !== 'available') {
                return back()->withErrors([
                    'selected_badge_id' => 'Selected badge is no longer available.'
                ]);
            }

            DB::beginTransaction();

            try {
                // Update the visit with validation information
                $visit->update([
                    'status' => 'ongoing',
                    'validated_by' => Auth::user()->name,
                    'validated_at' => now(),
                    'id_type_checked' => $validated['id_type_checked'],
                    'id_number_checked' => $validated['id_number_checked'],
                    'validation_notes' => $validated['validation_notes'],
                ]);

                // Update badge status
                $badge->update([
                    'status' => 'assigned',
                    'location' => 'With Visitor'
                ]);

                // Create badge assignment record
                BadgeAssignment::create([
                    'visit_id' => $visit->id,
                    'badge_id' => $badge->id,
                    'assigned_at' => now(),
                    'notes' => "Assigned during validation by {$validated['validated_by']}"
                ]);

                DB::commit();

//                return back()->with('success', 'Visitor validated successfully and badge assigned.');
                return redirect()->back()->with('success', 'Visitor validated successfully and badge assigned.');

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            return back()->withErrors([
                'general' => 'An error occurred during validation: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get available badges for assignment
     */
    public function getAvailableBadges()
    {
        try {
            $badges = VisitorBadge::where('status', 'available')
                ->orderBy('badge_number')
                ->get(['id', 'badge_number', 'location', 'status']);

            return response()->json([
                'success' => true,
                'badges' => $badges
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available badges: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check out a visitor
     */
    public function checkout(Request $request, Visit $visit)
    {
        try {
            if ($visit->status !== 'ongoing') {
                return back()->withErrors([
                    'general' => 'This visit cannot be checked out. Current status: ' . $visit->status
                ]);
            }

            DB::beginTransaction();

            try {
                // Update visit status
                $visit->update([
                    'status' => 'checked_out',
                    'check_out_time' => now(),
                ]);

                // Return the assigned badge
                $badgeAssignment = BadgeAssignment::where('visit_id', $visit->id)
                    ->whereNull('returned_at')
                    ->first();

                if ($badgeAssignment) {
                    // Update badge assignment
                    $badgeAssignment->update([
                        'returned_at' => now(),
                        'notes' => $badgeAssignment->notes . " | Returned at checkout"
                    ]);

                    // Update badge status
                    $badgeAssignment->badge->update([
                        'status' => 'available',
                        'location' => 'Front Desk'
                    ]);
                }

                DB::commit();

                return back()->with('success', 'Visitor checked out successfully.');

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return back()->withErrors([
                'general' => 'An error occurred during checkout: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Generate visit report
     */
    public function generateReport(Visit $visit)
    {
        try {
            if ($visit->status !== 'checked_out') {
                return back()->withErrors([
                    'general' => 'Report can only be generated for checked-out visits.'
                ]);
            }

            // Load relationships
            $visit->load(['visitor', 'badgeAssignments.badge']);

            $reportData = [
                'visit' => $visit,
                'visitor' => $visit->visitor,
                'duration' => $visit->check_out_time ?
                    $visit->check_in_time->diffInMinutes($visit->check_out_time) : null,
                'badge_used' => $visit->badgeAssignments->first()?->badge,
                'generated_at' => now(),
                'generated_by' => Auth::user()->name ?? 'System'
            ];

            return response()->json([
                'success' => true,
                'report' => $reportData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate report: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(Request $request, Visit $visit){
        $visit->load(['visitor', 'currentBadgeAssignment.badge']);
        return inertia('visitors/show',[
            'visit' => $visit,
            'from' => $request->get('from','dashboard'),
        ]);
    }

    public function deny(Request $request, Visit $visit)
    {
        try {
            $validated = $request->validate([
                'validation_notes' => 'required|string|max:1000',
            ]);

            // Check if visit can be denied
            if (!in_array($visit->status, ['checked_in', 'for_validation'])) {
                return back()->withErrors([
                    'general' => 'This visit cannot be denied. Current status: ' . $visit->status
                ]);
            }

            $visit->update([
                'status' => 'denied',
                'validated_by' => Auth::user()->name,
                'validated_at' => now(),
                'id_type_checked' => $request->input('id_type_checked'),
                'id_number_checked' => $request->input('id_number_checked'),
                'validation_notes' => $validated['validation_notes'],
            ]);

            return redirect()->back()->with('success', 'Visitor denied successfully.');
        } catch (\Exception $e) {
            return back()->withErrors([
                'general' => 'An error occurred during denial: ' . $e->getMessage()
            ]);
        }
    }
}
