<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function store(Request $request)
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'title_si' => 'nullable|string|max:255',
            'code' => 'required|string|max:30|unique:courses,code',
            'registration_fee' => 'required|numeric|min:0',
            'course_fee' => 'required|numeric|min:0',
            'duration' => 'required|string|max:100',
            'delivery_mode' => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        $data['total_fee'] = $data['registration_fee'] + $data['course_fee'];
        $data['is_active'] = true;

        return response()->json(['course' => Course::create($data)], 201);
    }

    public function updateStatus(Request $request, Course $course)
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);
        $course->update($request->validate(['is_active' => 'required|boolean']));

        return response()->json(['course' => $course->fresh()]);
    }
}
