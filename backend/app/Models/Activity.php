<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Activity extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'representative_id',
        'user_id',
        'type',
        'outcome',
        'next_follow_up_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'next_follow_up_date' => 'datetime',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function representative(): BelongsTo
    {
        return $this->belongsTo(Representative::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

