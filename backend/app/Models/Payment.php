<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Payment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'receipt_number',
        'enrolment_id',
        'amount',
        'line_item',
        'payment_method',
        'bank_reference',
        'slip_path',
        'payment_date',
        'status',
        'idempotency_key',
        'verified_by',
        'verified_at',
        'parent_payment_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_date' => 'date',
            'verified_at' => 'datetime',
        ];
    }

    protected $appends = ['slip_url'];

    public function getSlipUrlAttribute(): ?string
    {
        return $this->slip_path ? Storage::disk('public')->url($this->slip_path) : null;
    }

    public function enrolment(): BelongsTo
    {
        return $this->belongsTo(Enrolment::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function parentPayment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'parent_payment_id');
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Payment::class, 'parent_payment_id');
    }
}

