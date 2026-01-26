<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('visits', function (Blueprint $table) {
            // Group tracking fields
            $table->string('group_id')->nullable()->index()->after('visitor_id');
            $table->boolean('is_group_leader')->default(false)->after('group_id');
            $table->foreignId('group_leader_visit_id')->nullable()->constrained('visits')->nullOnDelete()->after('is_group_leader');
            
            // Composite index for group queries
            $table->index(['group_id', 'is_group_leader'], 'idx_visits_group_tracking');
        });
    }

    public function down(): void
    {
        Schema::table('visits', function (Blueprint $table) {
            $table->dropIndex('idx_visits_group_tracking');
            $table->dropForeign(['group_leader_visit_id']);
            $table->dropColumn(['group_id', 'is_group_leader', 'group_leader_visit_id']);
        });
    }
};
