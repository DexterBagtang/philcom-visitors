<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visit extends Model
{
    use HasFactory;

    protected $fillable = [
        'visitor_id', 'status', 'check_in_time', 'check_out_time',
        'validated_by','validated_at','id_type_checked', 'id_number_checked', 'validation_notes',
    ];

    protected $casts = [
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
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

}
