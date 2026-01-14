<?php

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        return [
            'dtr_id' => $this->faker->unique()->randomNumber(6),
            'full_name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'department' => $this->faker->randomElement([
                'IT',
                'HR',
                'Finance',
                'Operations',
                'Marketing',
                'Sales'
            ]),
            'is_active' => true,
            'last_synced_at' => now(),
        ];
    }

    /**
     * Indicate that the employee is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
