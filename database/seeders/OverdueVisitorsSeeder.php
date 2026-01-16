<?php

namespace Database\Seeders;

use App\Models\BadgeAssignment;
use App\Models\Visit;
use App\Models\Visitor;
use App\Models\VisitorBadge;
use Illuminate\Database\Seeder;

class OverdueVisitorsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates overdue visitors (ongoing visits > 12 hours) for testing.
     */
    public function run(): void
    {
        $overdueVisitors = [
            [
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'company' => 'ABC Contractors',
                'person_to_visit' => 'John Smith',
                'visit_purpose' => 'Building Maintenance',
                'type' => 'Contractor',
                'hours_ago' => 18,
            ],
            [
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'company' => 'XYZ Services',
                'person_to_visit' => 'Jane Doe',
                'visit_purpose' => 'IT Support',
                'type' => 'Contractor',
                'hours_ago' => 24,
            ],
            [
                'first_name' => 'Pedro',
                'last_name' => 'Reyes',
                'company' => 'Tech Solutions Inc.',
                'person_to_visit' => 'Mike Johnson',
                'visit_purpose' => 'Equipment Installation',
                'type' => 'Contractor',
                'hours_ago' => 15,
            ],
            [
                'first_name' => 'Ana',
                'last_name' => 'Garcia',
                'company' => 'CleanPro Services',
                'person_to_visit' => 'Sarah Williams',
                'visit_purpose' => 'Facility Cleaning',
                'type' => 'Contractor',
                'hours_ago' => 20,
            ],
            [
                'first_name' => 'Carlos',
                'last_name' => 'Mendoza',
                'company' => 'SecureGuard Corp',
                'person_to_visit' => 'David Brown',
                'visit_purpose' => 'Security Audit',
                'type' => 'Contractor',
                'hours_ago' => 36,
            ],
        ];

        // Get available badges
        $availableBadges = VisitorBadge::where('status', 'available')->get();

        if ($availableBadges->count() < count($overdueVisitors)) {
            $this->command->warn('Not enough available badges. Creating badges...');

            // Create badges if needed
            $badgesNeeded = count($overdueVisitors) - $availableBadges->count();
            $lastBadgeNumber = VisitorBadge::max('badge_number') ?? 0;

            for ($i = 1; $i <= $badgesNeeded; $i++) {
                VisitorBadge::create([
                    'badge_number' => $lastBadgeNumber + $i,
                    'status' => 'available',
                    'location' => 'Front Desk',
                ]);
            }

            $availableBadges = VisitorBadge::where('status', 'available')->get();
        }

        $badgeIndex = 0;

        foreach ($overdueVisitors as $data) {
            // Create visitor
            $visitor = Visitor::create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'company' => $data['company'],
                'person_to_visit' => $data['person_to_visit'],
                'visit_purpose' => $data['visit_purpose'],
                'type' => $data['type'],
            ]);

            // Create overdue visit (check_in_time in the past)
            $checkInTime = now()->subHours($data['hours_ago']);
            $validatedAt = $checkInTime->copy()->addMinutes(5);

            $visit = Visit::create([
                'visitor_id' => $visitor->id,
                'status' => 'ongoing',
                'check_in_time' => $checkInTime,
                'validated_by' => 'System Seeder',
                'validated_at' => $validatedAt,
                'id_type_checked' => 'Company ID',
                'validation_notes' => 'Seeded overdue visitor for testing',
            ]);

            // Assign badge
            if (isset($availableBadges[$badgeIndex])) {
                $badge = $availableBadges[$badgeIndex];

                $badge->update([
                    'status' => 'assigned',
                    'location' => 'With Visitor',
                ]);

                BadgeAssignment::create([
                    'visit_id' => $visit->id,
                    'badge_id' => $badge->id,
                    'assigned_at' => $validatedAt,
                    'notes' => 'Assigned by seeder',
                ]);

                $badgeIndex++;
            }

            $this->command->info("Created overdue visitor: {$visitor->name} (checked in {$data['hours_ago']} hours ago)");
        }

        $this->command->info('');
        $this->command->info("Created " . count($overdueVisitors) . " overdue visitors for testing.");
    }
}
