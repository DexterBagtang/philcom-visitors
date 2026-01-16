<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visit extends Model
{
    use HasFactory;

    protected $fillable = [
        'visitor_id', 'status', 'check_in_time', 'check_out_time', 'checkout_type',
        'validated_by','validated_at','id_type_checked', 'id_number_checked', 'validation_notes',
        'notify_employee', 'notified_employee_id', 'notified_employee_name',
        'notified_employee_email', 'notified_employee_department',
        'notification_sent', 'notification_sent_at', 'notification_error',
    ];

    protected $appends = ['is_overdue'];

    const OVERDUE_HOURS = 12;

    protected $casts = [
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'notification_sent_at' => 'datetime',
        'notify_employee' => 'boolean',
        'notification_sent' => 'boolean',
    ];

    public function visitor()
    {
        return $this->belongsTo(Visitor::class);
    }

    public function badgeAssignments()
    {
        return $this->hasMany(BadgeAssignment::class);
    }

    public function currentBadgeAssignment()
    {
        return $this->hasOne(BadgeAssignment::class)->whereNull('returned_at');
    }

    public function latestBadgeAssignment()
    {
        return $this->hasOne(BadgeAssignment::class)->latestOfMany();
    }

    public function scopeOngoing($query)
    {
        return $query->where('status', 'ongoing');
    }

    public function scopeOverdue($query)
    {
        return $query->ongoing()
            ->where('check_in_time', '<', now()->subHours(self::OVERDUE_HOURS));
    }

    public function getIsOverdueAttribute(): bool
    {
        if ($this->status !== 'ongoing') {
            return false;
        }

        if (!$this->check_in_time) {
            return false;
        }

        return $this->check_in_time->lt(now()->subHours(self::OVERDUE_HOURS));
    }
}
