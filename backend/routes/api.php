<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RepresentativeController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\CommissionController;
use App\Http\Controllers\Api\PayoutBatchController;
use App\Http\Controllers\Api\ScholarshipController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\CounsellingController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\UserManagementController;
use App\Models\District;
use App\Models\Course;
use App\Models\ReferralCode;

// --- Public Endpoints ---
Route::post('/auth/login', [AuthController::class, 'login']);

// Master Data
Route::get('/districts', function () {
    return response()->json(['districts' => District::where('is_active', true)->get()]);
});

Route::get('/courses', function () {
    return response()->json(['courses' => Course::where('is_active', true)->get()]);
});

// Public Referral Attribution Verification
Route::get('/referral-check/{code}', function ($code) {
    $ref = ReferralCode::where('code', $code)
        ->orWhere('slug', $code)
        ->with('representative.user', 'representative.primaryDistrict')
        ->first();

    if (!$ref) {
        return response()->json(['valid' => false, 'message' => 'Invalid referral link'], 404);
    }

    return response()->json([
        'valid' => true,
        'referral' => $ref,
        'representative' => $ref->representative,
    ]);
});

// Public Lead Submission (Direct or via Referral QR/Link)
Route::post('/public/leads', [LeadController::class, 'store']);
Route::post('/public/leads/check-duplicate', [LeadController::class, 'checkDuplicate']);

// --- Protected Endpoints (Auth Sanctum) ---
Route::middleware('auth:sanctum')->group(function () {
    // Current User
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::patch('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Representative Portal & Admin Reps Management
    Route::get('/representatives/my-dashboard', [RepresentativeController::class, 'myDashboard']);
    Route::get('/representatives', [RepresentativeController::class, 'index']);
    Route::get('/representatives/{id}', [RepresentativeController::class, 'show']);
    Route::get('/representatives/{id}/documents/{document}/download', [RepresentativeController::class, 'downloadDocument']);
    Route::post('/representatives', [RepresentativeController::class, 'store']);
    Route::patch('/representatives/{id}/status', [RepresentativeController::class, 'updateStatus']);
    Route::delete('/representatives/{id}', [RepresentativeController::class, 'destroy']);
    Route::post('/representatives/{id}/documents', [RepresentativeController::class, 'uploadDocuments']);
    Route::post('/representatives/{id}/profile-picture', [RepresentativeController::class, 'uploadProfilePicture']);
    Route::patch('/representatives/{id}/bank', [RepresentativeController::class, 'updateBank']);

    // Leads & Duplicate Engine
    Route::get('/leads', [LeadController::class, 'index']);
    Route::post('/leads', [LeadController::class, 'store']);
    Route::get('/leads/{id}', [LeadController::class, 'show']);
    Route::post('/leads/check-duplicate', [LeadController::class, 'checkDuplicate']);
    Route::patch('/leads/{id}/status', [LeadController::class, 'updateStatus']);
    Route::post('/leads/{id}/merge', [LeadController::class, 'merge']);
    Route::post('/leads/bulk-import', [LeadController::class, 'bulkImport']);

    // Counselling & Admissions Checklist
    Route::get('/activities', [CounsellingController::class, 'index']);
    Route::post('/activities', [CounsellingController::class, 'storeActivity']);

    // Payments & Verification
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/payments/{id}/document', [PaymentController::class, 'downloadDocument']);
    Route::patch('/payments/{id}/verify', [PaymentController::class, 'verify']);
    Route::post('/payments/{id}/refund', [PaymentController::class, 'refund']);

    // Commissions & Bonus Engine
    Route::get('/commissions', [CommissionController::class, 'index']);
    Route::patch('/commissions/{id}/approve', [CommissionController::class, 'approve']);
    Route::post('/commissions/adjust', [CommissionController::class, 'adjust']);

    // Payout Batches, Direct Bank Deposits & Statements
    Route::get('/payout-batches', [PayoutBatchController::class, 'index']);
    Route::get('/payout-batches/payable-reps', [PayoutBatchController::class, 'payableRepresentatives']);
    Route::get('/payout-batches/{id}', [PayoutBatchController::class, 'show']);
    Route::post('/payout-batches', [PayoutBatchController::class, 'store']);
    Route::post('/payout-batches/deposit-rep', [PayoutBatchController::class, 'depositRepresentative']);
    Route::patch('/payout-batches/{id}/complete', [PayoutBatchController::class, 'complete']);
    Route::get('/representatives/{id}/statement', [PayoutBatchController::class, 'statement']);

    // Scholarships
    Route::get('/scholarships', [ScholarshipController::class, 'index']);
    Route::post('/scholarships', [ScholarshipController::class, 'store']);
    Route::patch('/scholarships/{id}/decision', [ScholarshipController::class, 'decision']);

    Route::get('/reports/dashboard', [ReportController::class, 'globalDashboard']);
    Route::get('/reports/representatives', [ReportController::class, 'repPerformance']);
    Route::get('/reports/rep-performance', [ReportController::class, 'repPerformance']);

    // Settings & Audit Logs
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::post('/settings', [SettingsController::class, 'update']);
    Route::get('/courses/all', function (Request $request) {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        return response()->json(['courses' => Course::orderBy('title')->get()]);
    });
    Route::post('/courses', [CourseController::class, 'store']);
    Route::patch('/courses/{course}/status', [CourseController::class, 'updateStatus']);
    Route::get('/user-management', [UserManagementController::class, 'index']);
    Route::post('/user-management', [UserManagementController::class, 'store']);
    Route::patch('/user-management/{user}/permissions', [UserManagementController::class, 'updatePermissions']);
    Route::patch('/user-management/role-access', [UserManagementController::class, 'updateRoleAccess']);
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
});

