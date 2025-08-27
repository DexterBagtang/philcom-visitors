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
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitor_badges');
    }
};
