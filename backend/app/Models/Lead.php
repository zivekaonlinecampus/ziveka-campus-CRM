<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Lead extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'lead_id',
        'full_name',
        'preferred_name',
        'mobile',
        'normalized_mobile',
        'whatsapp',
        'email',
        'normalized_email',
        'nic_passport',
        'normalized_nic',
        'dob',
        'age_group',
        'guardian_name',
        'guardian_relationship',
        'guardian_contact',
        'district_id',
        'city',
        'course_id',
        'intake',
        'preferred_language',
        'delivery_mode',
        'representative_id',
        'referral_code',
        'referral_timestamp',
        'counsellor_id',
        'status',
        'is_duplicate',
        'duplicate_of_lead_id',
        'duplicate_confidence',
        'lost_reason',
        'consent_captured',
        'privacy_notice_version',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'dob' => 'date',
            'referral_timestamp' => 'datetime',
            'is_duplicate' => 'boolean',
            'consent_captured' => 'boolean',
        ];
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'lead_courses')->withTimestamps();
    }

    public function representative(): BelongsTo
    {
        return $this->belongsTo(Representative::class);
    }

    public function counsellor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counsellor_id');
    }

    public function duplicateOf(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'duplicate_of_lead_id');
    }

    public function student(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function scholarships(): HasMany
    {
        return $this->hasMany(Scholarship::class);
    }
}

