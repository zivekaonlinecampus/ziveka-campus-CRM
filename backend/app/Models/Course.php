<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'title_si',
        'code',
        'registration_fee',
        'course_fee',
        'total_fee',
        'duration',
        'delivery_mode',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'registration_fee' => 'decimal:2',
            'course_fee' => 'decimal:2',
            'total_fee' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function enrolments(): HasMany
    {
        return $this->hasMany(Enrolment::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }
}

