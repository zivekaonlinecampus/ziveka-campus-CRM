<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'representative_id',
        'code',
        'slug',
        'campaign',
        'clicks_count',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'clicks_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function representative(): BelongsTo
    {
        return $this->belongsTo(Representative::class);
    }
}

