<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Extend Users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('mobile')->nullable()->after('email');
            $table->enum('role', [
                'super_admin',
                'campus_admin',
                'finance_officer',
                'counsellor',
                'representative',
                'auditor'
            ])->default('representative')->after('mobile');
            $table->enum('status', ['active', 'suspended', 'terminated', 'pending'])->default('active')->after('role');
            $table->boolean('must_change_password')->default(false)->after('status');
            $table->boolean('two_factor_enabled')->default(false)->after('must_change_password');
            $table->timestamp('last_login_at')->nullable()->after('two_factor_enabled');
            $table->string('last_login_ip')->nullable()->after('last_login_at');
        });

        // 2. Districts Master
        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_si')->nullable();
            $table->string('code', 10)->unique();
            $table->string('province');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. Courses Master
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('title_si')->nullable();
            $table->string('code', 30)->unique();
            $table->decimal('registration_fee', 10, 2)->default(10000.00);
            $table->decimal('course_fee', 10, 2)->default(30000.00);
            $table->decimal('total_fee', 10, 2)->default(40000.00);
            $table->string('duration')->default('6 Months');
            $table->string('delivery_mode')->default('Online Live');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 4. Representatives
        Schema::create('representatives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('representative_id', 30)->unique(); // e.g. REP-CMB-001
            $table->string('initials')->nullable();
            $table->string('nic_passport', 30)->nullable();
            $table->date('dob')->nullable();
            $table->text('residential_address')->nullable();
            $table->foreignId('primary_district_id')->constrained('districts');
            $table->json('additional_district_ids')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_branch')->nullable();
            $table->string('account_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('agreement_version', 20)->default('v1.0');
            $table->timestamp('agreement_signed_at')->nullable();
            $table->boolean('document_verified')->default(false);
            $table->enum('status', [
                'draft', 'submitted', 'under_review', 'approved', 'active', 'suspended', 'terminated'
            ])->default('active');
            $table->decimal('quality_score', 5, 2)->default(100.00);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 5. Referral Codes
        Schema::create('referral_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('representative_id')->constrained('representatives')->cascadeOnDelete();
            $table->string('code', 30)->unique(); // e.g. ZV-CMB-001
            $table->string('slug', 60)->unique();
            $table->string('campaign')->nullable();
            $table->unsignedBigInteger('clicks_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 6. Leads
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('lead_id', 30)->unique(); // e.g. LEAD-2026-0001
            $table->string('full_name');
            $table->string('preferred_name')->nullable();
            $table->string('mobile');
            $table->string('normalized_mobile')->index();
            $table->string('whatsapp')->nullable();
            $table->string('email')->nullable();
            $table->string('normalized_email')->nullable()->index();
            $table->string('nic_passport', 30)->nullable();
            $table->string('normalized_nic', 30)->nullable()->index();
            $table->date('dob')->nullable();
            $table->string('age_group', 20)->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_relationship')->nullable();
            $table->string('guardian_contact')->nullable();
            $table->foreignId('district_id')->nullable()->constrained('districts')->nullOnDelete();
            $table->string('city')->nullable();
            $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->string('intake')->nullable();
            $table->string('preferred_language', 10)->default('en');
            $table->string('delivery_mode')->default('Online');
            $table->foreignId('representative_id')->nullable()->constrained('representatives')->nullOnDelete();
            $table->string('referral_code', 30)->nullable();
            $table->timestamp('referral_timestamp')->nullable();
            $table->foreignId('counsellor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', [
                'new', 'contacted', 'qualified', 'application', 'payment_pending', 'paid', 'lost', 'scholarship'
            ])->default('new');
            $table->boolean('is_duplicate')->default(false);
            $table->foreignId('duplicate_of_lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->string('duplicate_confidence')->nullable();
            $table->string('lost_reason')->nullable();
            $table->boolean('consent_captured')->default(true);
            $table->string('privacy_notice_version', 20)->default('v1.0');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 7. Students (Enrolled Identities)
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('student_id', 30)->unique(); // e.g. STU-2026-0001
            $table->foreignId('lead_id')->unique()->constrained('leads')->cascadeOnDelete();
            $table->string('full_name');
            $table->string('email')->nullable();
            $table->string('mobile');
            $table->string('nic_passport', 30)->nullable();
            $table->foreignId('district_id')->nullable()->constrained('districts')->nullOnDelete();
            $table->date('enrolment_date');
            $table->boolean('day_30_active')->default(true);
            $table->boolean('is_completed')->default(false);
            $table->timestamps();
        });

        // 8. Enrolments
        Schema::create('enrolments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses');
            $table->foreignId('representative_id')->nullable()->constrained('representatives')->nullOnDelete();
            $table->string('intake');
            $table->string('batch_number')->nullable();
            $table->decimal('total_fee', 10, 2)->default(40000.00);
            $table->decimal('discount_amount', 10, 2)->default(0.00);
            $table->decimal('paid_amount', 10, 2)->default(0.00);
            $table->boolean('is_scholarship')->default(false);
            $table->enum('status', ['active', 'completed', 'refunded', 'cancelled', 'waived'])->default('active');
            $table->timestamp('enrolled_at')->nullable();
            $table->timestamps();
        });

        // 9. Payments
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number', 30)->unique(); // e.g. REC-2026-0001
            $table->foreignId('enrolment_id')->constrained('enrolments')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->enum('line_item', ['registration_fee', 'course_fee', 'full_payment', 'instalment', 'refund'])->default('full_payment');
            $table->enum('payment_method', ['bank_transfer', 'cash', 'gateway', 'cheque'])->default('bank_transfer');
            $table->string('bank_reference')->nullable();
            $table->string('slip_path')->nullable();
            $table->date('payment_date');
            $table->enum('status', ['pending', 'verified', 'rejected', 'refunded', 'waived'])->default('pending');
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('parent_payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 10. Payout Batches
        Schema::create('payout_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number', 30)->unique(); // e.g. PAY-2026-M08-01
            $table->string('period', 40); // e.g. "August 2026"
            $table->decimal('total_amount', 12, 2)->default(0.00);
            $table->unsignedInteger('representative_count')->default(0);
            $table->string('bank_transfer_reference')->nullable();
            $table->enum('status', ['draft', 'approved', 'completed', 'cancelled'])->default('draft');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 11. Commissions
        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id', 30)->unique(); // e.g. COM-2026-0001
            $table->foreignId('enrolment_id')->nullable()->constrained('enrolments')->nullOnDelete();
            $table->foreignId('representative_id')->constrained('representatives')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->enum('type', ['base', 'bonus', 'reversal', 'adjustment'])->default('base');
            $table->enum('status', ['pending', 'eligible', 'on_hold', 'approved', 'reversed', 'paid'])->default('eligible');
            $table->text('hold_reason')->nullable();
            $table->text('adjustment_reason')->nullable();
            $table->foreignId('payout_batch_id')->nullable()->constrained('payout_batches')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->date('effective_date');
            $table->timestamps();
        });

        // 12. Scholarships
        Schema::create('scholarships', function (Blueprint $table) {
            $table->id();
            $table->string('application_id', 30)->unique(); // e.g. SCH-2026-0001
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->foreignId('representative_id')->nullable()->constrained('representatives')->nullOnDelete();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->string('applicant_name');
            $table->string('nic_passport', 30)->nullable();
            $table->foreignId('district_id')->constrained('districts');
            $table->foreignId('course_id')->constrained('courses');
            $table->text('financial_need_summary');
            $table->string('income_evidence_doc')->nullable();
            $table->text('academic_motivation')->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->string('quota_period', 20)->default('2026-Q3');
            $table->decimal('waiver_amount', 10, 2)->default(40000.00);
            $table->enum('status', [
                'submitted', 'documents_pending', 'under_review', 'approved', 'waitlisted', 'rejected'
            ])->default('submitted');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();
        });

        // 13. Activities
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->cascadeOnDelete();
            $table->foreignId('representative_id')->nullable()->constrained('representatives')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['call', 'counselling', 'note', 'status_change', 'document_upload', 'duplicate_check', 'merge'])->default('note');
            $table->string('outcome')->nullable();
            $table->dateTime('next_follow_up_date')->nullable();
            $table->text('notes');
            $table->timestamps();
        });

        // 14. Complaints Register
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('representative_id')->nullable()->constrained('representatives')->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->string('subject');
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['open', 'investigating', 'resolved', 'dismissed'])->default('open');
            $table->text('description');
            $table->text('resolution')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 15. Audit Logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name')->nullable();
            $table->string('role')->nullable();
            $table->string('action'); // create, update, delete, approve, reject, export, login, merge, refund
            $table->string('entity_type');
            $table->string('entity_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->text('reason')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // 16. System Settings
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 50)->unique();
            $table->text('value');
            $table->string('category', 30)->default('general');
            $table->string('description')->nullable();
            $table->date('effective_from')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('complaints');
        Schema::dropIfExists('activities');
        Schema::dropIfExists('scholarships');
        Schema::dropIfExists('commissions');
        Schema::dropIfExists('payout_batches');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('enrolments');
        Schema::dropIfExists('students');
        Schema::dropIfExists('leads');
        Schema::dropIfExists('referral_codes');
        Schema::dropIfExists('representatives');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('districts');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'mobile', 'role', 'status', 'must_change_password',
                'two_factor_enabled', 'last_login_at', 'last_login_ip'
            ]);
        });
    }
};

