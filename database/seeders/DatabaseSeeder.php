<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@gmail.com',
            'password' => Hash::make("admin123"),
            'role' => "admin"
        ]);
        User::factory()->create([
            'name' => 'Customer',
            'email' => 'customer@gmail.com',
            'password' => Hash::make("customer123"),
            'role' => 'customer'
        ]);
        User::factory()->create([
            'name' => 'Seller',
            'email' => 'seller@gmail.com',
            'password' => Hash::make("seller123"),
            'role' => 'seller'
        ]);
    }
}
