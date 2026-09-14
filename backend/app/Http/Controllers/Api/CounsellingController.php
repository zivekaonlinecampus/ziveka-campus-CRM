<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Lead;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class CounsellingController extends Controller
{
    public function index(Request $request)
    {
        $query = Activity::with(['lead.district', 'lead.course', 'user', 'representative.user'])
            ->latest('created_at');

        if ($request->filled('lead_id')) {
            $query->where('lead_id', $request->lead_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $activities = $query->limit(100)->get();

        return response()->json([
            'activities' => $activities,
        ]);
    }

    public function storeActivity(Request $request)
    {
        $request->validate([
            'lead_id' => 'required|exists:leads,id',
            'type' => 'required|in:call,counselling,note,status_change,document_upload',
            'outcome' => 'nullable|string',
            'next_follow_up_date' => 'nullable|date',
            'notes' => 'required|string',
        ]);

        $lead = Lead::findOrFail($request->lead_id);
        $user = $request->user();

        $activity = Activity::create([
            'lead_id' => $lead->id,
            'representative_id' => $lead->representative_id,
            'user_id' => $user->id,
            'type' => $request->type,
            'outcome' => $request->outcome,
            'next_follow_up_date' => $request->next_follow_up_date,
            'notes' => $request->notes,
        ]);

        AuditLog::record(
            $user,
            'create',
            'Activity',
            (string)$activity->id,
            null,
            ['type' => $request->type, 'lead_id' => $lead->lead_id],
            "Logged {$request->type} interaction"
        );

        return response()->json([
            'message' => 'Activity logged successfully',
            'activity' => $activity->load('user'),
        ], 201);
    }
}

