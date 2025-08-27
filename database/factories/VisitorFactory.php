<?php

// database/factories/VisitorFactory.php
namespace Database\Factories;

use App\Models\Visitor;
use Illuminate\Database\Eloquent\Factories\Factory;

class VisitorFactory extends Factory
{
    protected $model = Visitor::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'company' => $this->faker->company(),
            'person_to_visit' => $this->faker->name(),
            'visit_purpose' => $this->faker->randomElement([
                'Meeting', 'Delivery', 'Interview', 'Maintenance', 'Inspection'
            ]),
            'type' => $this->faker->randomElement([
                'Visitor','Client','Contractor','Vendor','Applicant','Delivery Personnel','Other'
            ])
        ];
    }
}

