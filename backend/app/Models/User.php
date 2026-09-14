<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'profile_picture_path',
        'email',
        'mobile',
        'password',
        'role',
        'status',
        'must_change_password',
        'two_factor_enabled',
        'last_login_at',
        'last_login_ip',
        'permissions',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'two_factor_enabled' => 'boolean',
            'last_login_at' => 'datetime',
            'permissions' => 'array',
        ];
    }

    public function hasPermission(string $permission): bool
    {
        return $this->isSuperAdmin() || in_array($permission, $this->permissions ?? [], true);
    }

    public function representative(): HasOne
    {
        return $this->hasOne(Representative::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'counsellor_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isCampusAdmin(): bool
    {
        return in_array($this->role, ['super_admin', 'campus_admin']);
    }

    public function isFinance(): bool
    {
        return in_array($this->role, ['super_admin', 'finance_officer']);
    }

    public function isRepresentative(): bool
    {
        return $this->role === 'representative';
    }
}

