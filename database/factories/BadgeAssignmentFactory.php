<?php

// database/factories/BadgeAssignmentFactory.php
namespace Database\Factories;

use App\Models\BadgeAssignment;
use App\Models\Visit;
use App\Models\VisitorBadge;
use Illuminate\Database\Eloquent\Factories\Factory;

class BadgeAssignmentFactory extends Factory
{
    protected $model = BadgeAssignment::class;

    public function definition(): array
    {
        $assignedAt = $this->faker->dateTimeBetween('-2 days', 'now');
        $returnedAt = $this->faker->boolean(70) ? $this->faker->dateTimeBetween($assignedAt, 'now') : null;

        return [
            'visit_id' => Visit::factory(),
            'badge_id' => VisitorBadge::factory(),
            'assigned_at' => $assignedAt,
            'returned_at' => $returnedAt,
            'notes' => $this->faker->sentence(),
        ];
    }
}

