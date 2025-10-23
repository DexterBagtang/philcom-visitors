<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('badge_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('visit_id')->constrained('visits')->cascadeOnDelete();
            $table->foreignId('badge_id')->constrained('visitor_badges')->cascadeOnDelete();
            $table->dateTime('assigned_at')->index();
            $table->dateTime('returned_at')->nullable()->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['visit_id', 'badge_id']); // Ensure 1 badge per visit

            // Composite indexes for better query performance
            $table->index(['visit_id', 'returned_at'], 'idx_badge_assignments_visit_returned');
            $table->index(['badge_id', 'returned_at'], 'idx_badge_assignments_badge_returned');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('badge_assignments');
    }
};
