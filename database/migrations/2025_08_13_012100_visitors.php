<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('visitors', function (Blueprint $table) {
            $table->id();
            $table->string('first_name')->index();
            $table->string('last_name')->index();
            $table->string('company')->nullable()->index();
            $table->string('type')->nullable()->index();
            $table->string('person_to_visit')->index();
            $table->string('visit_purpose')->nullable();
            $table->timestamps();

            // Composite indexes for better query performance
            $table->index(['last_name', 'first_name'], 'idx_visitors_full_name');
            $table->index(['first_name', 'last_name', 'company'], 'idx_visitors_name_company');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitors');
    }
};
