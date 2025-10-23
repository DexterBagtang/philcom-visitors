<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('visitor_badges', function (Blueprint $table) {
            $table->id();
            $table->string('badge_number')->unique();
            $table->enum('status', ['available', 'assigned', 'lost', 'damaged'])->default('available')->index();
            $table->string('location')->nullable();
            $table->timestamps();

            // Composite index for common query patterns
            $table->index(['status', 'badge_number'], 'idx_badges_status_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitor_badges');
    }
};
