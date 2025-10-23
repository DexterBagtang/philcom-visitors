<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hosts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('department')->nullable();
            $table->string('phone', 20)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            // Indexes for query performance
            $table->index('active', 'idx_hosts_active');
            $table->index('created_at', 'idx_hosts_created');
            $table->index(['active', 'created_at'], 'idx_hosts_active_created');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hosts');
    }
};
