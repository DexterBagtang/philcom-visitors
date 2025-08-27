<?php

// database/factories/VisitorBadgeFactory.php
namespace Database\Factories;

use App\Models\VisitorBadge;
use Illuminate\Database\Eloquent\Factories\Factory;

class VisitorBadgeFactory extends Factory
{
    protected $model = VisitorBadge::class;

    public function definition(): array
    {
        return [
            'badge_number' => strtoupper($this->faker->bothify('B-###')),
            'status' => 'available',
            'location' => 'Lobby',
        ];
    }
}

