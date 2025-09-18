<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BadgeAssignment extends Model
{
    use HasFactory;
    protected $fillable = [
        'visit_id', 'badge_id', 'assigned_at', 'returned_at', 'notes'
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'returned_at' => 'datetime',
    ];

    public function visit()
    {
        return $this->belongsTo(Visit::class);
    }

    public function badge()
    {
        return $this->belongsTo(VisitorBadge::class, 'badge_id');
    }
}
