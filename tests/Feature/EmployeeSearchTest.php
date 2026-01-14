<?php

use App\Models\Employee;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('unauthenticated users cannot search employees', function () {
    $this->getJson('/api/dtr/employees/search?q=John')
        ->assertUnauthorized();
});

test('authenticated users can search employees', function () {
    Employee::factory()->create([
        'full_name' => 'John Doe',
        'email' => 'john.doe@example.com',
        'is_active' => true
    ]);

    $this->actingAs($this->user)
        ->getJson('/api/dtr/employees/search?q=John')
        ->assertOk()
        ->assertJson(['success' => true])
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'dtr_id',
                    'full_name',
                    'email',
                    'department'
                ]
            ]
        ]);
});

test('search returns matching employees', function () {
    $employee = Employee::factory()->create([
        'full_name' => 'John Doe',
        'is_active' => true
    ]);

    Employee::factory()->create([
        'full_name' => 'Maria Garcia',
        'is_active' => true
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/dtr/employees/search?q=John');

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                [
                    'id' => $employee->id,
                    'full_name' => 'John Doe'
                ]
            ]
        ]);

    expect($response->json('data'))->toHaveCount(1);
});

test('search requires query parameter', function () {
    $this->actingAs($this->user)
        ->getJson('/api/dtr/employees/search')
        ->assertStatus(400)
        ->assertJson([
            'success' => false,
            'message' => 'Search query is required'
        ]);
});

test('search with empty query returns error', function () {
    $this->actingAs($this->user)
        ->getJson('/api/dtr/employees/search?q=')
        ->assertStatus(400)
        ->assertJson([
            'success' => false,
            'message' => 'Search query is required'
        ]);
});

test('search returns empty array when no matches found', function () {
    Employee::factory()->create([
        'full_name' => 'John Doe',
        'is_active' => true
    ]);

    $this->actingAs($this->user)
        ->getJson('/api/dtr/employees/search?q=NonExistentName')
        ->assertOk()
        ->assertJson([
            'success' => true,
            'data' => []
        ]);
});

test('search does not return inactive employees', function () {
    Employee::factory()->create([
        'full_name' => 'John Doe',
        'is_active' => false
    ]);

    $this->actingAs($this->user)
        ->getJson('/api/dtr/employees/search?q=John')
        ->assertOk()
        ->assertJson([
            'success' => true,
            'data' => []
        ]);
});

test('search with multiple words works', function () {
    $employee = Employee::factory()->create([
        'full_name' => 'Maria Santos Garcia',
        'is_active' => true
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/dtr/employees/search?q=Maria Garcia');

    $response->assertOk();
    expect($response->json('data'))->not->toBeEmpty();
    expect($response->json('data.0.id'))->toBe($employee->id);
});

test('search matches email addresses', function () {
    $employee = Employee::factory()->create([
        'full_name' => 'John Doe',
        'email' => 'john.doe@philcom.com',
        'is_active' => true
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/dtr/employees/search?q=john.doe');

    $response->assertOk();
    expect($response->json('data'))->not->toBeEmpty();
    expect($response->json('data.0.id'))->toBe($employee->id);
});

test('search handles special characters in query', function () {
    $employee = Employee::factory()->create([
        'full_name' => "O'Brien",
        'is_active' => true
    ]);

    $this->actingAs($this->user)
        ->getJson('/api/dtr/employees/search?q=' . urlencode("O'Brien"))
        ->assertOk();
});

test('search returns maximum 3 results', function () {
    // Create 10 employees with similar names
    for ($i = 1; $i <= 10; $i++) {
        Employee::factory()->create([
            'full_name' => "John Doe {$i}",
            'is_active' => true
        ]);
    }

    $response = $this->actingAs($this->user)
        ->getJson('/api/dtr/employees/search?q=John');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(3);
});

test('search is case insensitive', function () {
    $employee = Employee::factory()->create([
        'full_name' => 'John Doe',
        'is_active' => true
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/dtr/employees/search?q=john doe');

    $response->assertOk();
    expect($response->json('data'))->not->toBeEmpty();
    expect($response->json('data.0.id'))->toBe($employee->id);
});

test('search handles typos with fuzzy matching', function () {
    $employee = Employee::factory()->create([
        'full_name' => 'Smith Johnson',
        'is_active' => true
    ]);

    // Search with typo (Smyth instead of Smith)
    $response = $this->actingAs($this->user)
        ->getJson('/api/dtr/employees/search?q=Smyth');

    $response->assertOk();
    expect($response->json('data'))->not->toBeEmpty();
});

test('search returns proper data structure', function () {
    Employee::factory()->create([
        'full_name' => 'John Doe',
        'email' => 'john@example.com',
        'department' => 'IT',
        'is_active' => true
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/dtr/employees/search?q=John');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'dtr_id',
                    'full_name',
                    'email',
                    'department'
                ]
            ]
        ]);

    $data = $response->json('data.0');
    expect($data)->toHaveKeys(['id', 'dtr_id', 'full_name', 'email', 'department']);
});
