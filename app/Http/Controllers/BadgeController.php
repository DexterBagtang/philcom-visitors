<?php

namespace App\Http\Controllers;

use App\Models\VisitorBadge;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BadgeController extends Controller
{
    public function index()
    {
        return Inertia::render('badges/index', [
            'badges' => VisitorBadge::with('currentAssignment.visit.visitor')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'badge_number' => 'required|string|max:255|unique:visitor_badges,badge_number',
            'status' => 'required|string|in:available,assigned,maintenance',
            'location' => 'required|string|max:255',
        ]);

        VisitorBadge::create($validated);

        return redirect()->back()->with('success', 'Badge created successfully!');
    }

    public function update(Request $request, VisitorBadge $badge)
    {
        $validated = $request->validate([
            'badge_number' => 'required|string|max:255|unique:visitor_badges,badge_number,' . $badge->id,
            'status' => 'required|string|in:available,assigned,maintenance',
            'location' => 'required|string|max:255',
        ]);

        $badge->update($validated);

        return redirect()->back()->with('success', 'Badge updated successfully!');
    }

    public function destroy(VisitorBadge $badge)
    {
        $badge->delete();
        return redirect()->back()->with('success', 'Badge deleted successfully!');
    }

    public function show(VisitorBadge $badge){
        //
    }
}
