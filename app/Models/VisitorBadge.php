<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VisitorBadge extends Model
{
    use HasFactory;

    protected $fillable = [
        'badge_number', 'status', 'location'
    ];

    public function badgeAssignments()
    {
        return $this->hasMany(BadgeAssignment::class, 'badge_id');
    }

    public function currentAssignment()
    {
        return $this->hasOne(BadgeAssignment::class, 'badge_id')
            ->whereNull('returned_at');
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }
}
