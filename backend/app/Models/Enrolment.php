<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Enrolment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'course_id',
        'representative_id',
        'intake',
        'batch_number',
        'total_fee',
        'discount_amount',
        'paid_amount',
        'is_scholarship',
        'status',
        'enrolled_at',
    ];

    protected function casts(): array
    {
        return [
            'total_fee' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'is_scholarship' => 'boolean',
            'enrolled_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function representative(): BelongsTo
    {
        return $this->belongsTo(Representative::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function commission(): HasOne
    {
        return $this->hasOne(Commission::class);
    }

    public function isFullyPaid(): bool
    {
        return ($this->paid_amount >= ($this->total_fee - $this->discount_amount)) && !$this->is_scholarship;
    }
}

