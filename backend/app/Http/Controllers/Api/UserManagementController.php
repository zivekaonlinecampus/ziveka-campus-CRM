<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\District;
use App\Models\ReferralCode;
use App\Models\Representative;
use App\Models\User;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    private const MANAGE_USERS = 'manage_user_accounts';

    public function index(Request $request)
    {
        abort_unless($this->canManageUsers($request->user()), 403);

        return response()->json([
            'users' => User::select('id', 'name', 'profile_picture_path', 'email', 'role', 'status', 'permissions', 'created_at')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        abort_unless($this->canManageUsers($request->user()), 403);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['campus_admin', 'finance_officer', 'counsellor', 'auditor', 'representative'])],
            'profile_picture' => 'nullable|file|extensions:jpg,jpeg,png,webp,gif,bmp|max:5120',
            'mobile' => 'required_if:role,representative|string|max:20',
            'primary_district_id' => 'required_if:role,representative|exists:districts,id',
            'city' => 'required_if:role,representative|string|max:100',
            'nic_passport' => 'nullable|string|max:30',
            'nic_copy' => 'nullable|file|extensions:jpg,jpeg,png,webp,gif,bmp,pdf|max:5120',
            'signed_agreement' => 'nullable|file|extensions:jpg,jpeg,png,webp,gif,bmp,pdf|max:5120',
            'bank_name' => 'nullable|string',
            'bank_branch' => 'nullable|string',
            'account_name' => 'nullable|string',
            'account_number' => 'nullable|string',
        ]);

        $user = DB::transaction(function () use ($request, $data) {
            $profilePicturePath = $request->hasFile('profile_picture')
                ? $request->file('profile_picture')->store('profile-pictures', 'public')
                : null;

            $user = User::create([
                'name' => $data['name'],
                'profile_picture_path' => $profilePicturePath,
                'email' => $data['email'],
                'mobile' => $data['mobile'] ?? null,
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
                'status' => 'active',
                'must_change_password' => true,
                'permissions' => [],
            ]);

            if ($data['role'] === 'representative') {
                $district = District::findOrFail($data['primary_district_id']);
                $count = Representative::where('primary_district_id', $district->id)->count() + 1;
                $profilePicturePath = $request->hasFile('profile_picture')
                    ? $request->file('profile_picture')->store('representatives/profile-pictures', 'public')
                    : null;
                $nicCopyPath = $request->hasFile('nic_copy')
                    ? $request->file('nic_copy')->store('representatives/documents', 'public')
                    : null;
                $signedAgreementPath = $request->hasFile('signed_agreement')
                    ? $request->file('signed_agreement')->store('representatives/documents', 'public')
                    : null;

                $representative = Representative::create([
                    'user_id' => $user->id,
                    'representative_id' => sprintf('REP-%s-%03d', $district->code, $count),
                    'primary_district_id' => $district->id,
                    'city' => $data['city'],
                    'profile_picture_path' => $profilePicturePath,
                    'nic_passport' => $data['nic_passport'] ?? null,
                    'nic_copy_path' => $nicCopyPath,
                    'signed_agreement_path' => $signedAgreementPath,
                    'bank_name' => $data['bank_name'] ?? null,
                    'bank_branch' => $data['bank_branch'] ?? null,
                    'account_name' => $data['account_name'] ?? null,
                    'account_number' => $data['account_number'] ?? null,
                    'status' => 'active',
                    'quality_score' => 100.00,
                ]);

                $firstName = strtoupper(Str::slug(explode(' ', $data['name'])[0]));
                $refCode = sprintf('ZV-%s-%s', $district->code, $firstName);
                if (ReferralCode::where('code', $refCode)->exists()) {
                    $refCode .= '-' . rand(10, 99);
                }
                ReferralCode::create([
                    'representative_id' => $representative->id,
                    'code' => $refCode,
                    'slug' => Str::slug($refCode),
                    'is_active' => true,
                ]);
            }

            return $user;
        });

        AuditLog::record(
            $request->user(),
            'create',
            'User',
            (string) $user->id,
            null,
            ['name' => $user->name, 'email' => $user->email, 'role' => $user->role],
            'New campus user account created'
        );

        return response()->json(['message' => 'User account created successfully.', 'user' => $user], 201);
    }

    public function updatePermissions(Request $request, User $user)
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        $data = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string|in:manage_user_accounts',
        ]);

        $user->update(['permissions' => array_values(array_unique($data['permissions']))]);

        AuditLog::record(
            $request->user(),
            'update',
            'User',
            (string) $user->id,
            null,
            ['permissions' => $user->permissions],
            'User page access permissions updated'
        );

        return response()->json(['user' => $user->fresh()]);
    }

    public function updateRoleAccess(Request $request)
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        $data = $request->validate([
            'role' => 'required|in:campus_admin,finance_officer,counsellor,auditor,representative',
            'enabled' => 'required|boolean',
        ]);

        $access = SystemSetting::getVal('user_registration_role_access', []);
        $access[$data['role']] = $data['enabled'];
        SystemSetting::setVal('user_registration_role_access', $access, 'admin_configured', 'Roles allowed to access user registration');

        AuditLog::record(
            $request->user(),
            'update',
            'SystemSetting',
            null,
            null,
            ['user_registration_role_access' => $access],
            'User registration page role access updated'
        );

        return response()->json(['role_access' => $access]);
    }

    private function canManageUsers(?User $user): bool
    {
        $roleAccess = SystemSetting::getVal('user_registration_role_access', []);
        return $user?->isSuperAdmin()
            || (bool) ($roleAccess[$user?->role] ?? false)
            || in_array(self::MANAGE_USERS, $user?->permissions ?? [], true);
    }
}
