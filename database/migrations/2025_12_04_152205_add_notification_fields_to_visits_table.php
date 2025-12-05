<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('visits', function (Blueprint $table) {
            $table->boolean('notify_employee')->default(false)->after('validation_notes');
            $table->unsignedBigInteger('notified_employee_id')->nullable()->after('notify_employee');
            $table->string('notified_employee_name')->nullable()->after('notified_employee_id');
            $table->string('notified_employee_email')->nullable()->after('notified_employee_name');
            $table->string('notified_employee_department')->nullable()->after('notified_employee_email');
            $table->boolean('notification_sent')->default(false)->after('notified_employee_department');
            $table->timestamp('notification_sent_at')->nullable()->after('notification_sent');
            $table->text('notification_error')->nullable()->after('notification_sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visits', function (Blueprint $table) {
            $table->dropColumn([
                'notify_employee',
                'notified_employee_id',
                'notified_employee_name',
                'notified_employee_email',
                'notified_employee_department',
                'notification_sent',
                'notification_sent_at',
                'notification_error'
            ]);
        });
    }
};
