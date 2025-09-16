<?php

namespace Database\Seeders;

use App\Models\BadgeAssignment;
use App\Models\SystemSetting;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\Visit;
use App\Models\Visitor;
use App\Models\VisitorBadge;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
//        // Admin and Staff users
        User::factory()->create([
            'name' => 'Admin User',
            'username' => 'admin',
            'email' => 'dexterbagtang@gmail.com',
            'role' => 'admin',
            'password' => bcrypt('asdfasdf'),
        ]);

//        User::factory()->count(5)->create();
//
//        // Visitor badges
        VisitorBadge::factory()->count(20)->create();
//        Visit::factory()->count(1)->create();
//
//        // Visitors and visits
//        Visitor::factory()
//            ->count(10)
//            ->has(
//                Visit::factory()
//                    ->count(2)
//                    ->has(
//                        BadgeAssignment::factory()->count(1)
//                    )
//            )
//            ->create();
//
//        // System settings
//        SystemSetting::factory()->count(5)->create();
//        $this->call([
//            VisitorCheckInSeeder::class,
//        ]);
    }
}
