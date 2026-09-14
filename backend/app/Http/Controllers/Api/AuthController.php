<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        $loginInput = $request->email;
        $user = User::where('email', $loginInput)
            ->orWhere('mobile', $loginInput)
            ->with(['representative.primaryDistrict', 'representative.activeReferralCode'])
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Account is currently ' . $user->status . '. Please contact administration.',
            ], 403);
        }

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        AuditLog::record(
            $user,
            'login',
            'User',
            (string)$user->id,
            null,
            ['last_login_at' => now()->toIso8601String()],
            'User logged into CRM portal'
        );

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'requires_password_change' => (bool)$user->must_change_password,
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['representative.primaryDistrict', 'representative.activeReferralCode']);
        return response()->json([
            'user' => $user,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'nullable|string|max:30',
            'profile_picture' => 'nullable|file|extensions:jpg,jpeg,png,webp,gif,bmp|max:5120',
        ]);

        if ($request->hasFile('profile_picture')) {
            if ($user->profile_picture_path) {
                Storage::disk('public')->delete($user->profile_picture_path);
            }
            $data['profile_picture_path'] = $request->file('profile_picture')->store('profile-pictures', 'public');
        }

        unset($data['profile_picture']);
        $user->update($data);

        return response()->json(['user' => $user->fresh()->load(['representative.primaryDistrict', 'representative.activeReferralCode'])]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
            'must_change_password' => false,
        ]);

        AuditLog::record(
            $user,
            'update',
            'User',
            (string)$user->id,
            null,
            ['password_changed' => true],
            'User updated account password'
        );

        return response()->json(['message' => 'Password updated successfully']);
    }

    public function demoAccounts()
    {
        $users = User::select('id', 'name', 'email', 'mobile', 'role', 'status')
            ->with(['representative' => function ($q) {
                $q->select('id', 'user_id', 'representative_id', 'quality_score');
            }])
            ->get();

        return response()->json([
            'accounts' => $users,
        ]);
    }
}

