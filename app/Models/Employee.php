<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'dtr_id',
        'full_name',
        'email',
        'department',
        'is_active',
        'last_synced_at',
    ];
}
