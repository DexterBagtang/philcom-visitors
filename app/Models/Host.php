<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Host extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'department',
        'phone',
        'active'
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    // Relationships
    public function visitHosts(): HasMany
    {
        return $this->hasMany(VisitHost::class);
    }

    public function visits(): HasMany
    {
        return $this->hasMany(Visit::class, 'responding_host_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
