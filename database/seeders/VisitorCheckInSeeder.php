<?php

// database/seeders/VisitorCheckInSeeder.php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Visitor;
use App\Models\Visit;
use App\Models\VisitorBadge;
use App\Models\BadgeAssignment;
use Carbon\Carbon;

class VisitorCheckInSeeder extends Seeder
{
    public function run(): void
    {
        // Simulate a single visitor flow
        $now = now();

        // Step 1: Visitor Arrives & Fills Form
        $visitor = Visitor::create([
            'name' => 'John Doe',
            'company' => 'Acme Corp',
            'person_to_visit' => 'Jane Smith',
            'visit_purpose' => 'Business Meeting',
        ]);

        // Step 2: Lobby Staff Validation
        $visit = Visit::create([
            'visitor_id' => $visitor->id,
            'status' => 'checked_in',
            'check_in_time' => $now,
            'validated_by' => 'Lobby Staff #1',
            'id_type_checked' => 'Driver License',
            'id_number_checked' => 'DL1234567',
            'validation_notes' => 'All details match ID provided.',
        ]);

        // Step 3: Assign Available Badge
        $badge = VisitorBadge::where('status', 'available')->first();
        if (!$badge) {
            $badge = VisitorBadge::create([
                'badge_number' => 'B-999',
                'status' => 'available',
                'location' => 'Lobby'
            ]);
        }

        $badge->update(['status' => 'assigned']);

        $badgeAssignment = BadgeAssignment::create([
            'visit_id' => $visit->id,
            'badge_id' => $badge->id,
            'assigned_at' => $now,
            'notes' => 'Assigned at reception desk.',
        ]);

        // Step 4: Simulate Ongoing Visit (after check-in)
        $visit->update([
            'status' => 'ongoing',
        ]);

        // Step 5: Simulate Visit Finished & Badge Returned
        $checkoutTime = Carbon::parse($now)->addHours(2);
        $visit->update([
            'status' => 'checked_out',
            'check_out_time' => $checkoutTime,
        ]);

        $badgeAssignment->update([
            'returned_at' => $checkoutTime,
            'notes' => 'Returned in good condition.',
        ]);

        $badge->update(['status' => 'available']);

        // Step 6: Done
        $this->command->info("Visitor Check-In Flow simulated for {$visitor->name}");
    }
}

