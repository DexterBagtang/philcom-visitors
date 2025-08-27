<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visitor extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'company', 'person_to_visit', 'visit_purpose','type'
    ];

    public function visits()
    {
        return $this->hasMany(Visit::class);
    }

    public function currentVisit()
    {
        return $this->hasOne(Visit::class)
            ->whereIn('status', ['checked_in', 'ongoing'])
            ->latest();
    }
}

