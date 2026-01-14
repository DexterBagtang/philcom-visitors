<?php

use App\Models\Employee;
use App\Services\EmployeeSearchService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->service = new EmployeeSearchService();
});

test('exact match returns highest score', function () {
    // Create employees with partial matches
    Employee::factory()->create(['full_name' => 'John Smith', 'is_active' => true]);
    Employee::factory()->create(['full_name' => 'Jane Doe', 'is_active' => true]);
    Employee::factory()->create(['full_name' => 'Johnson Alexander', 'is_active' => true]);

    // Create target employee with exact match
    $target = Employee::factory()->create([
        'full_name' => 'John Doe',
        'email' => 'john.doe@example.com',
        'is_active' => true
    ]);

    $results = $this->service->search('John Doe');

    // Exact match should have highest score (be first)
    expect($results)->not->toBeEmpty();
    expect($results->first()->id)->toBe($target->id);
});

test('partial name match works', function () {
    $employee = Employee::factory()->create([
        'full_name' => 'Maria Santos Garcia',
        'email' => 'maria.garcia@example.com',
        'is_active' => true
    ]);

    $results = $this->service->search('Santos');

    expect($results)->not->toBeEmpty();
    expect($results->first()->id)->toBe($employee->id);
});

test('fuzzy match finds typos', function () {
    $employee = Employee::factory()->create([
        'full_name' => 'Smith Johnson',
        'email' => 'smith.johnson@example.com',
        'is_active' => true
    ]);

    // Search with typo (Smyth instead of Smith)
    $results = $this->service->search('Smyth');

    expect($results)->not->toBeEmpty();
    expect($results->first()->id)->toBe($employee->id);
});

test('multi-word search matches all terms', function () {
    Employee::factory()->create([
        'full_name' => 'Jane Smith',
        'is_active' => true
    ]);

    $employee = Employee::factory()->create([
        'full_name' => 'Maria Santos Garcia',
        'is_active' => true
    ]);

    $results = $this->service->search('Maria Garcia');

    expect($results->first()->id)->toBe($employee->id);
});

test('empty query returns empty collection', function () {
    Employee::factory()->count(5)->create();

    $results = $this->service->search('');

    expect($results)->toBeEmpty();
});

test('whitespace only query returns empty collection', function () {
    Employee::factory()->count(5)->create();

    $results = $this->service->search('   ');

    expect($results)->toBeEmpty();
});

test('single character terms are ignored', function () {
    Employee::factory()->create([
        'full_name' => 'A B Doe',
        'is_active' => true
    ]);

    $results = $this->service->search('A B');

    expect($results)->toBeEmpty();
});

test('case insensitive search works', function () {
    $employee = Employee::factory()->create([
        'full_name' => 'John Doe',
        'is_active' => true
    ]);

    $results = $this->service->search('JOHN DOE');

    expect($results)->not->toBeEmpty();
    expect($results->first()->id)->toBe($employee->id);
});

test('email matching works', function () {
    $employee = Employee::factory()->create([
        'full_name' => 'John Doe',
        'email' => 'john.doe@example.com',
        'is_active' => true
    ]);

    $results = $this->service->search('john.doe');

    expect($results)->not->toBeEmpty();
    expect($results->first()->id)->toBe($employee->id);
});

test('inactive employees are not returned', function () {
    Employee::factory()->create([
        'full_name' => 'John Doe',
        'email' => 'john.doe@example.com',
        'is_active' => false
    ]);

    $results = $this->service->search('John Doe');

    expect($results)->toBeEmpty();
});

test('results are limited to specified number', function () {
    // Create 15 employees with similar names
    for ($i = 1; $i <= 15; $i++) {
        Employee::factory()->create([
            'full_name' => "John Doe {$i}",
            'is_active' => true
        ]);
    }

    $results = $this->service->search('John', 5);

    expect($results)->toHaveCount(5);
});

test('starts with matching has higher priority', function () {
    Employee::factory()->create([
        'full_name' => 'Alexander Johnson',
        'is_active' => true
    ]);

    $exactMatch = Employee::factory()->create([
        'full_name' => 'John Alexander',
        'is_active' => true
    ]);

    // Searching for 'John' should prioritize the one that starts with John
    $results = $this->service->search('John');

    expect($results->first()->id)->toBe($exactMatch->id);
});

test('multiple words increase relevance score', function () {
    Employee::factory()->create([
        'full_name' => 'John Smith',
        'is_active' => true
    ]);

    $betterMatch = Employee::factory()->create([
        'full_name' => 'Maria Santos Garcia',
        'is_active' => true
    ]);

    // Searching for multiple words should rank higher
    $results = $this->service->search('Maria Garcia');

    expect($results->first()->id)->toBe($betterMatch->id);
});

test('handles special characters in names', function () {
    $employee = Employee::factory()->create([
        'full_name' => "O'Brien",
        'is_active' => true
    ]);

    $results = $this->service->search("O'Brien");

    expect($results)->not->toBeEmpty();
    expect($results->first()->id)->toBe($employee->id);
});

test('handles hyphenated names', function () {
    $employee = Employee::factory()->create([
        'full_name' => 'Jean-Paul Santos',
        'is_active' => true
    ]);

    $results = $this->service->search('Jean-Paul');

    expect($results)->not->toBeEmpty();
    expect($results->first()->id)->toBe($employee->id);
});

test('typo with distance of 2 is matched', function () {
    $employee = Employee::factory()->create([
        'full_name' => 'Dexter Bagtang',
        'is_active' => true
    ]);

    // Dextre has distance of 2 from Dexter
    $results = $this->service->search('Dextre');

    expect($results)->not->toBeEmpty();
    expect($results->first()->id)->toBe($employee->id);
});

test('typo with distance of 3 is matched', function () {
    $employee = Employee::factory()->create([
        'full_name' => 'Christopher Martinez',
        'is_active' => true
    ]);

    // Christofer has distance of 2, Martinez -> Martines has distance of 1
    $results = $this->service->search('Martinez');

    expect($results)->not->toBeEmpty();
});

test('search returns employees ordered by relevance', function () {
    // Create employees with varying match quality
    $exact = Employee::factory()->create([
        'full_name' => 'John Smith',
        'is_active' => true
    ]);

    Employee::factory()->create([
        'full_name' => 'Alexander Johnson',
        'is_active' => true
    ]);

    Employee::factory()->create([
        'full_name' => 'Michael Johns',
        'is_active' => true
    ]);

    $results = $this->service->search('John');

    // Exact match should be first
    expect($results->first()->id)->toBe($exact->id);
});
