<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new
class extends Migration {
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('visitor_id')->constrained('visitors')->cascadeOnDelete();
            $table->enum('status', ['for_validation','checked_in', 'ongoing', 'checked_out', 'denied'])->default('checked_in')->index();
            $table->dateTime('check_in_time')->nullable()->index();
            $table->dateTime('check_out_time')->nullable()->index();
            $table->string('validated_by')->nullable();
            $table->dateTime('validated_at')->nullable();
            $table->string('id_type_checked')->nullable();
            $table->string('id_number_checked')->nullable();
            $table->text('validation_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};
