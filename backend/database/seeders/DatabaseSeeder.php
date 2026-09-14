<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\District;
use App\Models\Course;
use App\Models\Representative;
use App\Models\ReferralCode;
use App\Models\Lead;
use App\Models\Student;
use App\Models\Enrolment;
use App\Models\Payment;
use App\Models\Commission;
use App\Models\PayoutBatch;
use App\Models\Scholarship;
use App\Models\Activity;
use App\Models\AuditLog;
use App\Models\SystemSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Districts (25 Sri Lankan Districts)
        $districtsData = [
            ['name' => 'Colombo', 'name_si' => 'කොළඹ', 'code' => 'CMB', 'province' => 'Western'],
            ['name' => 'Gampaha', 'name_si' => 'ගම්පහ', 'code' => 'GAM', 'province' => 'Western'],
            ['name' => 'Kalutara', 'name_si' => 'කළුතර', 'code' => 'KAL', 'province' => 'Western'],
            ['name' => 'Kandy', 'name_si' => 'මහනුවර', 'code' => 'KAN', 'province' => 'Central'],
            ['name' => 'Matale', 'name_si' => 'මාතලේ', 'code' => 'MTL', 'province' => 'Central'],
            ['name' => 'Nuwara Eliya', 'name_si' => 'නුවරඑළිය', 'code' => 'NEL', 'province' => 'Central'],
            ['name' => 'Galle', 'name_si' => 'ගාල්ල', 'code' => 'GAL', 'province' => 'Southern'],
            ['name' => 'Matara', 'name_si' => 'මාතර', 'code' => 'MAT', 'province' => 'Southern'],
            ['name' => 'Hambantota', 'name_si' => 'හම්බන්තොට', 'code' => 'HAM', 'province' => 'Southern'],
            ['name' => 'Jaffna', 'name_si' => 'යාපනය', 'code' => 'JAF', 'province' => 'Northern'],
            ['name' => 'Kilinochchi', 'name_si' => 'කිලිනොච්චි', 'code' => 'KIL', 'province' => 'Northern'],
            ['name' => 'Mannar', 'name_si' => 'මන්නාරම', 'code' => 'MAN', 'province' => 'Northern'],
            ['name' => 'Vavuniya', 'name_si' => 'වවුනියාව', 'code' => 'VAV', 'province' => 'Northern'],
            ['name' => 'Mullaitivu', 'name_si' => 'මුලතිව්', 'code' => 'MUL', 'province' => 'Northern'],
            ['name' => 'Batticaloa', 'name_si' => 'මඩකලපුව', 'code' => 'BAT', 'province' => 'Eastern'],
            ['name' => 'Ampara', 'name_si' => 'අම්පාර', 'code' => 'AMP', 'province' => 'Eastern'],
            ['name' => 'Trincomalee', 'name_si' => 'ත්‍රිකුණාමලය', 'code' => 'TRI', 'province' => 'Eastern'],
            ['name' => 'Kurunegala', 'name_si' => 'කුරුණෑගල', 'code' => 'KUR', 'province' => 'North Western'],
            ['name' => 'Puttalam', 'name_si' => 'පුත්තලම', 'code' => 'PUT', 'province' => 'North Western'],
            ['name' => 'Anuradhapura', 'name_si' => 'අනුරාධපුරය', 'code' => 'ANU', 'province' => 'North Central'],
            ['name' => 'Polonnaruwa', 'name_si' => 'පොළොන්නරුව', 'code' => 'POL', 'province' => 'North Central'],
            ['name' => 'Badulla', 'name_si' => 'බදුල්ල', 'code' => 'BAD', 'province' => 'Uva'],
            ['name' => 'Monaragala', 'name_si' => 'මොණරාගල', 'code' => 'MON', 'province' => 'Uva'],
            ['name' => 'Ratnapura', 'name_si' => 'රත්නපුර', 'code' => 'RAT', 'province' => 'Sabaragamuwa'],
            ['name' => 'Kegalle', 'name_si' => 'කෑගල්ල', 'code' => 'KEG', 'province' => 'Sabaragamuwa'],
        ];

        foreach ($districtsData as $d) {
            District::create($d);
        }

        $colombo = District::where('code', 'CMB')->first();
        $kandy = District::where('code', 'KAN')->first();
        $galle = District::where('code', 'GAL')->first();
        $gampaha = District::where('code', 'GAM')->first();
        $kurunegala = District::where('code', 'KUR')->first();

        // 2. Seed Courses
        $coursesData = [
            [
                'title' => 'Diploma in Business & IT Leadership',
                'title_si' => 'ව්‍යාපාර හා තොරතුරු තාක්ෂණ නායකත්ව ඩිප්ලෝමාව',
                'code' => 'DBIT-2026',
                'registration_fee' => 10000.00,
                'course_fee' => 30000.00,
                'total_fee' => 40000.00,
                'duration' => '6 Months',
                'delivery_mode' => 'Online Live',
                'description' => 'Comprehensive dual-qualification program blending enterprise IT strategy with modern business management.',
                'is_active' => true,
            ],
            [
                'title' => 'Professional English for Global Careers',
                'title_si' => 'ගෝලීය වෘත්තීන් සඳහා වෘත්තීය ඉංග්‍රීසි පාඨමාලාව',
                'code' => 'PEGC-2026',
                'registration_fee' => 10000.00,
                'course_fee' => 30000.00,
                'total_fee' => 40000.00,
                'duration' => '4 Months',
                'delivery_mode' => 'Online Live',
                'description' => 'Executive level communication, IELTS preparation, and presentation excellence for international opportunities.',
                'is_active' => true,
            ],
            [
                'title' => 'Digital Marketing & AI Growth Strategy',
                'title_si' => 'ඩිජිටල් අලෙවිකරණය සහ AI වර්ධන උපායමාර්ග',
                'code' => 'DMGS-2026',
                'registration_fee' => 10000.00,
                'course_fee' => 30000.00,
                'total_fee' => 40000.00,
                'duration' => '4 Months',
                'delivery_mode' => 'Hybrid',
                'description' => 'Master social media conversion funnels, AI content automation, PPC advertising, and ROI analytics.',
                'is_active' => true,
            ],
            [
                'title' => 'Hospitality & International Tourism Management',
                'title_si' => 'ආගන්තුක සත්කාර සහ ජාත්‍යන්තර සංචාරක කළමනාකරණය',
                'code' => 'HITM-2026',
                'registration_fee' => 10000.00,
                'course_fee' => 30000.00,
                'total_fee' => 40000.00,
                'duration' => '6 Months',
                'delivery_mode' => 'Online Live',
                'description' => 'Industry-tailored syllabus for careers in luxury resorts, cruise lines, and international tour operations.',
                'is_active' => true,
            ],
        ];

        foreach ($coursesData as $c) {
            Course::create($c);
        }

        $course1 = Course::first();
        $course2 = Course::skip(1)->first();

        // 3. Seed System Settings (All SRS Configurable Rules)
        SystemSetting::setVal('registration_fee', 10000.00, 'financial', 'Standard registration fee in LKR');
        SystemSetting::setVal('course_fee', 30000.00, 'financial', 'Standard course tuition fee in LKR');
        SystemSetting::setVal('total_student_fee', 40000.00, 'financial', 'Combined student fee in LKR');
        SystemSetting::setVal('base_commission', 3000.00, 'commission', 'Base commission per fully paid qualifying student in LKR');
        SystemSetting::setVal('target_bonus_5', 5000.00, 'bonus', 'Bonus for 5 qualifying students reached in active period in LKR');
        SystemSetting::setVal('target_bonus_10', 15000.00, 'bonus', 'Bonus for 10 qualifying students reached in active period in LKR');
        SystemSetting::setVal('target_bonus_20', 40000.00, 'bonus', 'Bonus for 20 qualifying students reached in active period in LKR');
        SystemSetting::setVal('scholarship_quota', 10, 'scholarship', 'Total full scholarship quota per intake period');
        SystemSetting::setVal('scholarship_waiver_value', 40000.00, 'scholarship', '100% tuition waiver value in LKR');
        SystemSetting::setVal('attribution_window_days', 60, 'attribution', 'Referral attribution lock window in days');
        SystemSetting::setVal('quality_score_weights', [
            'paid_enrolment_rate' => 30,
            'day_30_persistence' => 25,
            'net_revenue' => 20,
            'refund_rate' => 15,
            'compliance' => 10,
        ], 'kpi', 'Representative quality score calculation weightings (%)');

        // 4. Seed Users for All System Roles
        $commonPassword = Hash::make('password123');

        $superAdmin = User::create([
            'name' => 'Ziveka Super Admin',
            'email' => 'admin@zivekacampus.com',
            'mobile' => '+94771234560',
            'password' => $commonPassword,
            'role' => 'super_admin',
            'status' => 'active',
            'must_change_password' => false,
            'two_factor_enabled' => true,
        ]);

        $campusAdmin = User::create([
            'name' => 'Campus Admin Officer',
            'email' => 'campus@zivekacampus.com',
            'mobile' => '+94771234561',
            'password' => $commonPassword,
            'role' => 'campus_admin',
            'status' => 'active',
            'must_change_password' => false,
        ]);

        $financeOfficer = User::create([
            'name' => 'Finance Director',
            'email' => 'finance@zivekacampus.com',
            'mobile' => '+94771234562',
            'password' => $commonPassword,
            'role' => 'finance_officer',
            'status' => 'active',
            'must_change_password' => false,
        ]);

        $counsellor = User::create([
            'name' => 'Senior Admissions Counsellor',
            'email' => 'counsellor@zivekacampus.com',
            'mobile' => '+94771234563',
            'password' => $commonPassword,
            'role' => 'counsellor',
            'status' => 'active',
            'must_change_password' => false,
        ]);

        $auditor = User::create([
            'name' => 'Compliance & Audit Inspector',
            'email' => 'auditor@zivekacampus.com',
            'mobile' => '+94771234564',
            'password' => $commonPassword,
            'role' => 'auditor',
            'status' => 'active',
            'must_change_password' => false,
        ]);

        // 5. Seed District Representatives & Referral Codes
        // Rep 1: Colombo (High performer)
        $repUser1 = User::create([
            'name' => 'Kasun Perera',
            'email' => 'rep.colombo@zivekacampus.com',
            'mobile' => '0777123451',
            'password' => $commonPassword,
            'role' => 'representative',
            'status' => 'active',
            'must_change_password' => false,
        ]);
        $rep1 = Representative::create([
            'user_id' => $repUser1->id,
            'representative_id' => 'REP-CMB-001',
            'initials' => 'K. A.',
            'nic_passport' => '199214502340',
            'dob' => '1992-05-14',
            'residential_address' => '45/2 High Level Road, Maharagama, Colombo',
            'primary_district_id' => $colombo->id,
            'additional_district_ids' => [$gampaha->id],
            'bank_name' => 'Commercial Bank of Ceylon',
            'bank_branch' => 'Maharagama Branch',
            'account_name' => 'K A Kasun Perera',
            'account_number' => '8004523910',
            'agreement_version' => 'v1.0',
            'agreement_signed_at' => now()->subMonths(3),
            'document_verified' => true,
            'status' => 'active',
            'quality_score' => 96.50,
            'notes' => 'Top performing representative for Western Province.',
        ]);
        ReferralCode::create([
            'representative_id' => $rep1->id,
            'code' => 'ZV-CMB-KASUN',
            'slug' => 'zv-cmb-kasun',
            'campaign' => '2026-Q3-Western',
            'clicks_count' => 142,
            'is_active' => true,
        ]);

        // Rep 2: Kandy (Growing performer)
        $repUser2 = User::create([
            'name' => 'Nimal Bandara',
            'email' => 'rep.kandy@zivekacampus.com',
            'mobile' => '0714567892',
            'password' => $commonPassword,
            'role' => 'representative',
            'status' => 'active',
            'must_change_password' => false,
        ]);
        $rep2 = Representative::create([
            'user_id' => $repUser2->id,
            'representative_id' => 'REP-KAN-002',
            'initials' => 'M. G.',
            'nic_passport' => '198925401290',
            'dob' => '1989-08-22',
            'residential_address' => '12 Peradeniya Road, Kandy',
            'primary_district_id' => $kandy->id,
            'additional_district_ids' => [$kurunegala->id],
            'bank_name' => 'Bank of Ceylon',
            'bank_branch' => 'Kandy Main',
            'account_name' => 'M G Nimal Bandara',
            'account_number' => '0023419084',
            'agreement_version' => 'v1.0',
            'agreement_signed_at' => now()->subMonths(2),
            'document_verified' => true,
            'status' => 'active',
            'quality_score' => 88.00,
            'notes' => 'Active across Central and North-Western provinces.',
        ]);
        ReferralCode::create([
            'representative_id' => $rep2->id,
            'code' => 'ZV-KAN-NIMAL',
            'slug' => 'zv-kan-nimal',
            'campaign' => '2026-Q3-Central',
            'clicks_count' => 89,
            'is_active' => true,
        ]);

        // Rep 3: Galle (New / Onboarding)
        $repUser3 = User::create([
            'name' => 'Dilani Silva',
            'email' => 'rep.galle@zivekacampus.com',
            'mobile' => '0768901234',
            'password' => $commonPassword,
            'role' => 'representative',
            'status' => 'active',
            'must_change_password' => false,
        ]);
        $rep3 = Representative::create([
            'user_id' => $repUser3->id,
            'representative_id' => 'REP-GAL-003',
            'initials' => 'W. D.',
            'nic_passport' => '199578901240',
            'dob' => '1995-11-03',
            'residential_address' => '78 Galle Fort Road, Galle',
            'primary_district_id' => $galle->id,
            'additional_district_ids' => [],
            'bank_name' => 'Hatton National Bank',
            'bank_branch' => 'Galle Fort',
            'account_name' => 'W Dilani Silva',
            'account_number' => '1209348571',
            'agreement_version' => 'v1.0',
            'agreement_signed_at' => now()->subWeeks(3),
            'document_verified' => true,
            'status' => 'active',
            'quality_score' => 92.00,
            'notes' => 'Southern province lead coordinator.',
        ]);
        ReferralCode::create([
            'representative_id' => $rep3->id,
            'code' => 'ZV-GAL-DILAN',
            'slug' => 'zv-gal-dilan',
            'campaign' => '2026-Q3-Southern',
            'clicks_count' => 45,
            'is_active' => true,
        ]);

        // 6. Seed Sample Leads Across Pipeline Stages
        // 6.1 Paid Qualifying Students for Rep 1 (Kasun) to demonstrate 10-student bonus calculation
        for ($i = 1; $i <= 10; $i++) {
            $mobile = '07711000' . str_pad((string)$i, 2, '0', STR_PAD_LEFT);
            $nic = '2001' . str_pad((string)($i * 100 + 45), 8, '0', STR_PAD_LEFT);
            $lead = Lead::create([
                'lead_id' => 'LEAD-2026-' . str_pad((string)$i, 4, '0', STR_PAD_LEFT),
                'full_name' => "Student {$i} - Colombo Batch",
                'preferred_name' => "Student {$i}",
                'mobile' => $mobile,
                'normalized_mobile' => preg_replace('/[^0-9]/', '', $mobile),
                'email' => "student{$i}@example.com",
                'normalized_email' => "student{$i}@example.com",
                'nic_passport' => $nic,
                'normalized_nic' => $nic,
                'dob' => '2001-04-12',
                'district_id' => $colombo->id,
                'city' => 'Colombo',
                'course_id' => $course1->id,
                'intake' => '2026-Q3',
                'preferred_language' => 'en',
                'representative_id' => $rep1->id,
                'referral_code' => 'ZV-CMB-KASUN',
                'referral_timestamp' => now()->subDays(30 - $i),
                'counsellor_id' => $counsellor->id,
                'status' => 'paid',
                'consent_captured' => true,
            ]);

            $student = Student::create([
                'student_id' => 'STU-2026-' . str_pad((string)$i, 4, '0', STR_PAD_LEFT),
                'lead_id' => $lead->id,
                'full_name' => $lead->full_name,
                'email' => $lead->email,
                'mobile' => $lead->mobile,
                'nic_passport' => $lead->nic_passport,
                'district_id' => $colombo->id,
                'enrolment_date' => now()->subDays(25 - $i)->toDateString(),
                'day_30_active' => true,
                'is_completed' => false,
            ]);

            $enrolment = Enrolment::create([
                'student_id' => $student->id,
                'course_id' => $course1->id,
                'representative_id' => $rep1->id,
                'intake' => '2026-Q3',
                'batch_number' => 'DBIT-B1',
                'total_fee' => 40000.00,
                'discount_amount' => 0.00,
                'paid_amount' => 40000.00,
                'is_scholarship' => false,
                'status' => 'active',
                'enrolled_at' => now()->subDays(25 - $i),
            ]);

            Payment::create([
                'receipt_number' => 'REC-2026-' . str_pad((string)$i, 4, '0', STR_PAD_LEFT),
                'enrolment_id' => $enrolment->id,
                'amount' => 40000.00,
                'line_item' => 'full_payment',
                'payment_method' => 'bank_transfer',
                'bank_reference' => 'BOC-TXN-' . (900000 + $i),
                'payment_date' => now()->subDays(25 - $i)->toDateString(),
                'status' => 'verified',
                'idempotency_key' => 'IDEMP-REC-' . $i,
                'verified_by' => $financeOfficer->id,
                'verified_at' => now()->subDays(24 - $i),
                'notes' => 'Verified full tuition payment via Bank of Ceylon slip.',
            ]);

            // Base Commission for Rep 1
            Commission::create([
                'transaction_id' => 'COM-2026-' . str_pad((string)$i, 4, '0', STR_PAD_LEFT),
                'enrolment_id' => $enrolment->id,
                'representative_id' => $rep1->id,
                'amount' => 3000.00,
                'type' => 'base',
                'status' => 'approved',
                'approved_by' => $financeOfficer->id,
                'approved_at' => now()->subDays(20),
                'effective_date' => now()->subDays(25 - $i)->toDateString(),
            ]);
        }

        // Add 10-Student Target Bonus for Rep 1 (LKR 15,000)
        Commission::create([
            'transaction_id' => 'COM-BONUS-2026-001',
            'enrolment_id' => null,
            'representative_id' => $rep1->id,
            'amount' => 15000.00,
            'type' => 'bonus',
            'status' => 'approved',
            'hold_reason' => null,
            'adjustment_reason' => 'Target bonus achieved: 10 qualifying paid students reached in 2026-Q3 period.',
            'approved_by' => $financeOfficer->id,
            'approved_at' => now()->subDays(10),
            'effective_date' => now()->subDays(10)->toDateString(),
        ]);

        // 6.2 Leads in various active pipeline stages for Kandy and Galle
        // Lead in Contacted stage
        Lead::create([
            'lead_id' => 'LEAD-2026-0011',
            'full_name' => 'Saman Kumara',
            'preferred_name' => 'Saman',
            'mobile' => '0719876543',
            'normalized_mobile' => '0719876543',
            'email' => 'saman.k@gmail.com',
            'normalized_email' => 'saman.k@gmail.com',
            'nic_passport' => '199834509120',
            'normalized_nic' => '199834509120',
            'district_id' => $kandy->id,
            'city' => 'Kandy',
            'course_id' => $course2->id,
            'intake' => '2026-Q3',
            'preferred_language' => 'si',
            'representative_id' => $rep2->id,
            'referral_code' => 'ZV-KAN-NIMAL',
            'referral_timestamp' => now()->subDays(5),
            'counsellor_id' => $counsellor->id,
            'status' => 'contacted',
            'notes' => 'Inquired regarding English diploma weekend batches. Follow-up scheduled.',
        ]);

        // Lead in Application stage
        Lead::create([
            'lead_id' => 'LEAD-2026-0012',
            'full_name' => 'Rashmi Tharuka',
            'preferred_name' => 'Rashmi',
            'mobile' => '0778899112',
            'normalized_mobile' => '0778899112',
            'email' => 'rashmi.t@gmail.com',
            'normalized_email' => 'rashmi.t@gmail.com',
            'nic_passport' => '200256708910',
            'normalized_nic' => '200256708910',
            'district_id' => $kandy->id,
            'city' => 'Gampola',
            'course_id' => $course1->id,
            'intake' => '2026-Q3',
            'preferred_language' => 'en',
            'representative_id' => $rep2->id,
            'referral_code' => 'ZV-KAN-NIMAL',
            'referral_timestamp' => now()->subDays(3),
            'counsellor_id' => $counsellor->id,
            'status' => 'application',
            'notes' => 'Documents received. Application submitted for review.',
        ]);

        // Lead with Payment Pending (Slip uploaded, pending finance verification)
        $leadPending = Lead::create([
            'lead_id' => 'LEAD-2026-0013',
            'full_name' => 'Kamal Wijesinghe',
            'preferred_name' => 'Kamal',
            'mobile' => '0761122334',
            'normalized_mobile' => '0761122334',
            'email' => 'kamal.w@gmail.com',
            'normalized_email' => 'kamal.w@gmail.com',
            'nic_passport' => '199612309870',
            'normalized_nic' => '199612309870',
            'district_id' => $galle->id,
            'city' => 'Galle',
            'course_id' => $course1->id,
            'intake' => '2026-Q3',
            'preferred_language' => 'si',
            'representative_id' => $rep3->id,
            'referral_code' => 'ZV-GAL-DILAN',
            'referral_timestamp' => now()->subDays(2),
            'counsellor_id' => $counsellor->id,
            'status' => 'payment_pending',
            'notes' => 'Bank transfer slip uploaded for LKR 40,000. Pending finance team verification.',
        ]);

        $stuPending = Student::create([
            'student_id' => 'STU-2026-0013',
            'lead_id' => $leadPending->id,
            'full_name' => $leadPending->full_name,
            'email' => $leadPending->email,
            'mobile' => $leadPending->mobile,
            'nic_passport' => $leadPending->nic_passport,
            'district_id' => $galle->id,
            'enrolment_date' => now()->subDays(1)->toDateString(),
            'day_30_active' => true,
        ]);

        $enrolPending = Enrolment::create([
            'student_id' => $stuPending->id,
            'course_id' => $course1->id,
            'representative_id' => $rep3->id,
            'intake' => '2026-Q3',
            'batch_number' => 'DBIT-B2',
            'total_fee' => 40000.00,
            'discount_amount' => 0.00,
            'paid_amount' => 0.00,
            'is_scholarship' => false,
            'status' => 'active',
            'enrolled_at' => now()->subDays(1),
        ]);

        Payment::create([
            'receipt_number' => 'REC-2026-0013',
            'enrolment_id' => $enrolPending->id,
            'amount' => 40000.00,
            'line_item' => 'full_payment',
            'payment_method' => 'bank_transfer',
            'bank_reference' => 'HNB-TXN-884920',
            'payment_date' => now()->subDays(1)->toDateString(),
            'status' => 'pending',
            'idempotency_key' => 'IDEMP-REC-0013',
            'notes' => 'Awaiting Finance Officer verification.',
        ]);

        // 7. Seed Scholarship Application (SRS Section 8.5 & 5.7)
        Scholarship::create([
            'application_id' => 'SCH-2026-0001',
            'applicant_name' => 'Achini Jayawardena',
            'nic_passport' => '200389004510',
            'district_id' => $kandy->id,
            'course_id' => $course1->id,
            'representative_id' => $rep2->id,
            'financial_need_summary' => 'Father retired with medical disability; student is high achiever in G.C.E. Advanced Level mathematics with passion for IT leadership.',
            'academic_motivation' => 'Aspirations to become a cloud solutions architect and support community digitalization.',
            'score' => 94.00,
            'quota_period' => '2026-Q3',
            'waiver_amount' => 40000.00,
            'status' => 'approved',
            'reviewed_by' => $superAdmin->id,
            'reviewed_at' => now()->subDays(4),
            'review_notes' => 'Approved by scholarship committee under 2026-Q3 quota (100% tuition waiver). LKR 0 commission recorded.',
        ]);

        Scholarship::create([
            'application_id' => 'SCH-2026-0002',
            'applicant_name' => 'Tharindu Madusanka',
            'nic_passport' => '200178009230',
            'district_id' => $galle->id,
            'course_id' => $course2->id,
            'representative_id' => $rep3->id,
            'financial_need_summary' => 'Rural youth pursuing English proficiency for BPO job placement.',
            'academic_motivation' => 'Committed to completing career advancement diploma.',
            'score' => 86.50,
            'quota_period' => '2026-Q3',
            'waiver_amount' => 40000.00,
            'status' => 'under_review',
            'review_notes' => 'Income documentation verified. Committee decision scheduled.',
        ]);

        // 8. Seed Sample Audit Logs
        AuditLog::create([
            'user_id' => $superAdmin->id,
            'user_name' => $superAdmin->name,
            'role' => 'super_admin',
            'action' => 'login',
            'entity_type' => 'User',
            'entity_id' => (string)$superAdmin->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'reason' => 'Successful administrator console authentication.',
            'created_at' => now()->subMinutes(15),
        ]);

        AuditLog::create([
            'user_id' => $financeOfficer->id,
            'user_name' => $financeOfficer->name,
            'role' => 'finance_officer',
            'action' => 'approve',
            'entity_type' => 'Payment',
            'entity_id' => 'REC-2026-0010',
            'old_values' => ['status' => 'pending'],
            'new_values' => ['status' => 'verified', 'amount' => 40000.00],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'reason' => 'Bank transfer verified against official statement.',
            'created_at' => now()->subHours(2),
        ]);
    }
}

