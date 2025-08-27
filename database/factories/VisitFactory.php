<?php

// database/factories/VisitFactory.php
namespace Database\Factories;

use App\Events\VisitCreated;
use App\Models\Visit;
use App\Models\Visitor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Collection;

class VisitFactory extends Factory
{
    protected $model = Visit::class;

    public function definition(): array
    {
//        $checkIn = $this->faker->dateTimeBetween('-2 days', 'now');
        $checkOut = $this->faker->boolean(70) ? $this->faker->dateTimeBetween('now', '+5hours') : null;

        $visit = Visit::latest()->first();
        event(new VisitCreated($visit));


        return [
            'visitor_id' => Visitor::factory(),
            'status' => 'checked_in',
            'check_in_time' => now(),
//            'check_out_time' => $checkOut,
//            'validated_by' => $this->faker->name(),
//            'validated_at' => $this->faker->dateTimeBetween(now(), $checkOut),
//            'id_type_checked' => $this->faker->randomElement(['Driver License', 'Passport', 'Company ID']),
//            'id_number_checked' => $this->faker->numerify('ID#####'),
//            'validation_notes' => $this->faker->sentence(),
        ];
    }
}

