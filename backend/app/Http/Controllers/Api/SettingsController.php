<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = SystemSetting::all();
        $formatted = [];
        foreach ($settings as $s) {
            $formatted[$s->key] = SystemSetting::getVal($s->key);
        }

        return response()->json([
            'settings' => $formatted,
            'raw' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Super Admin access required.'], 403);
        }

        $request->validate([
            'settings' => 'required|array',
        ]);

        $oldValues = [];
        $newValues = $request->settings;

        foreach ($newValues as $k => $v) {
            $oldValues[$k] = SystemSetting::getVal($k);
            SystemSetting::setVal($k, $v, 'admin_configured', "Updated by {$user->name}");
        }

        AuditLog::record(
            $user,
            'update',
            'SystemSetting',
            null,
            $oldValues,
            $newValues,
            'System financial configuration updated'
        );

        return response()->json([
            'message' => 'System settings updated successfully',
            'settings' => $newValues,
        ]);
    }
}

