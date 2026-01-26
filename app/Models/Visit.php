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
        'group_id', 'is_group_leader', 'group_leader_visit_id',
    ];

    protected $appends = ['is_overdue', 'group_size'];

    const OVERDUE_HOURS = 12;

    protected $casts = [
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'notification_sent_at' => 'datetime',
        'notify_employee' => 'boolean',
        'notification_sent' => 'boolean',
        'is_group_leader' => 'boolean',
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

    // Group relationships
    public function groupLeader()
    {
        return $this->belongsTo(Visit::class, 'group_leader_visit_id');
    }

    public function groupMembers()
    {
        return $this->hasMany(Visit::class, 'group_leader_visit_id')
            ->with('visitor');
    }

    // Group scopes
    public function scopeGroupLeaders($query)
    {
        return $query->where('is_group_leader', true);
    }

    public function scopeInGroup($query, $groupId)
    {
        return $query->where('group_id', $groupId);
    }

    // Group helper methods
    public function hasGroup()
    {
        return !is_null($this->group_id);
    }

    public function getGroupSizeAttribute()
    {
        if (!$this->hasGroup()) {
            return 1;
        }
        
        if ($this->is_group_leader) {
            return $this->groupMembers()->count() + 1;
        }
        
        return Visit::where('group_id', $this->group_id)->count();
    }
}
