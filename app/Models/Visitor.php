<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visitor extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name','last_name', 'company', 'person_to_visit', 'visit_purpose','type'
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

    public function getNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    protected $appends = ['name'];
}

