<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;

class Representative extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'representative_id',
        'initials',
        'nic_passport',
        'nic_copy_path',
        'signed_agreement_path',
        'dob',
        'residential_address',
        'primary_district_id',
        'city',
        'profile_picture_path',
        'additional_district_ids',
        'bank_name',
        'bank_branch',
        'account_name',
        'account_number',
        'agreement_version',
        'agreement_signed_at',
        'document_verified',
        'status',
        'quality_score',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'dob' => 'date',
            'additional_district_ids' => 'array',
            'agreement_signed_at' => 'datetime',
            'document_verified' => 'boolean',
            'quality_score' => 'decimal:2',
        ];
    }

    protected $appends = ['profile_picture_url', 'nic_copy_url', 'signed_agreement_url'];

    public function getProfilePictureUrlAttribute(): ?string
    {
        return $this->profile_picture_path ? Storage::disk('public')->url($this->profile_picture_path) : null;
    }

    public function getNicCopyUrlAttribute(): ?string
    {
        return $this->nic_copy_path ? Storage::disk('public')->url($this->nic_copy_path) : null;
    }

    public function getSignedAgreementUrlAttribute(): ?string
    {
        return $this->signed_agreement_path ? Storage::disk('public')->url($this->signed_agreement_path) : null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function primaryDistrict(): BelongsTo
    {
        return $this->belongsTo(District::class, 'primary_district_id');
    }

    public function referralCodes(): HasMany
    {
        return $this->hasMany(ReferralCode::class);
    }

    public function activeReferralCode(): HasOne
    {
        return $this->hasOne(ReferralCode::class)->where('is_active', true)->latestOfMany();
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function enrolments(): HasMany
    {
        return $this->hasMany(Enrolment::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class);
    }

    public function scholarships(): HasMany
    {
        return $this->hasMany(Scholarship::class);
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class);
    }
}

