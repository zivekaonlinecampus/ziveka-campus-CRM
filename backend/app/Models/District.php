<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class District extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_si',
        'code',
        'province',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function representatives(): HasMany
    {
        return $this->hasMany(Representative::class, 'primary_district_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }
}

