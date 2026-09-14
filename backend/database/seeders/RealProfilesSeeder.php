<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Representative;
use App\Models\ReferralCode;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RealProfilesSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. SUPER ADMIN ──────────────────────────────────────────────
        $superAdmin = User::updateOrCreate(
            ['email' => 'director@zivekacampus.lk'],
            [
                'name'                  => 'Ziveka Campus Director',
                'mobile'                => '0112345678',
                'role'                  => 'super_admin',
                'status'                => 'active',
                'password'              => Hash::make('Ziveka@Admin2026!'),
                'must_change_password'  => false,
                'two_factor_enabled'    => false,
                'email_verified_at'     => now(),
            ]
        );

        // ── 2. CAMPUS ADMIN ─────────────────────────────────────────────
        $campusAdmin = User::updateOrCreate(
            ['email' => 'admissions@zivekacampus.lk'],
            [
                'name'                  => 'Samanthi Perera',
                'mobile'                => '0112345679',
                'role'                  => 'campus_admin',
                'status'                => 'active',
                'password'              => Hash::make('Campus@2026!'),
                'must_change_password'  => false,
                'two_factor_enabled'    => false,
                'email_verified_at'     => now(),
            ]
        );

        // ── 3. FINANCE OFFICER ──────────────────────────────────────────
        $financeOfficer = User::updateOrCreate(
            ['email' => 'finance@zivekacampus.lk'],
            [
                'name'                  => 'Roshan Fernando',
                'mobile'                => '0112345680',
                'role'                  => 'finance_officer',
                'status'                => 'active',
                'password'              => Hash::make('Finance@2026!'),
                'must_change_password'  => false,
                'two_factor_enabled'    => false,
                'email_verified_at'     => now(),
            ]
        );

        // ── 4. ADMISSIONS COUNSELLOR ────────────────────────────────────
        $counsellor = User::updateOrCreate(
            ['email' => 'counsellor@zivekacampus.lk'],
            [
                'name'                  => 'Nimasha Wickramasinghe',
                'mobile'                => '0112345681',
                'role'                  => 'counsellor',
                'status'                => 'active',
                'password'              => Hash::make('Counsel@2026!'),
                'must_change_password'  => false,
                'two_factor_enabled'    => false,
                'email_verified_at'     => now(),
            ]
        );

        // ── 5. COMPLIANCE AUDITOR ───────────────────────────────────────
        $auditor = User::updateOrCreate(
            ['email' => 'audit@zivekacampus.lk'],
            [
                'name'                  => 'Pradeep Jayasinghe',
                'mobile'                => '0112345682',
                'role'                  => 'auditor',
                'status'                => 'active',
                'password'              => Hash::make('Audit@2026!'),
                'must_change_password'  => false,
                'two_factor_enabled'    => false,
                'email_verified_at'     => now(),
            ]
        );

        // ── 6. DISTRICT REP – COLOMBO ───────────────────────────────────
        $repColUser = User::updateOrCreate(
            ['email' => 'rep.colombo@ziveka.lk'],
            [
                'name'                  => 'Asanka Kumara Perera',
                'mobile'                => '0771000001',
                'role'                  => 'representative',
                'status'                => 'active',
                'password'              => Hash::make('Rep@Colombo2026!'),
                'must_change_password'  => false,
                'two_factor_enabled'    => false,
                'email_verified_at'     => now(),
            ]
        );
        $repCol = Representative::updateOrCreate(
            ['user_id' => $repColUser->id],
            [
                'representative_id'     => 'REP-CMB-101',
                'initials'              => 'A. K.',
                'nic_passport'          => '199001500310',
                'dob'                   => '1990-06-05',
                'residential_address'   => '12/A Galle Road, Dehiwala, Colombo 10',
                'primary_district_id'   => 1, // Colombo
                'additional_district_ids' => [2], // Gampaha
                'bank_name'             => 'Bank of Ceylon',
                'bank_branch'           => 'Kollupitiya Branch',
                'account_name'          => 'A K Perera',
                'account_number'        => '12345678901',
                'agreement_version'     => 'v1.0',
                'agreement_signed_at'   => now(),
                'document_verified'     => true,
                'status'                => 'active',
                'quality_score'         => 0,
                'notes'                 => 'Real Colombo district representative – active from 2026.',
            ]
        );
        ReferralCode::updateOrCreate(
            ['representative_id' => $repCol->id, 'code' => 'ZV-CMB-AKP'],
            [
                'slug'       => 'zv-cmb-akp',
                'campaign'   => '2026-Q3-Western',
                'is_active'  => true,
            ]
        );

        // ── 7. DISTRICT REP – KANDY ─────────────────────────────────────
        $repKndUser = User::updateOrCreate(
            ['email' => 'rep.kandy@ziveka.lk'],
            [
                'name'                  => 'Chaminda Bandara Rathnayake',
                'mobile'                => '0812000002',
                'role'                  => 'representative',
                'status'                => 'active',
                'password'              => Hash::make('Rep@Kandy2026!'),
                'must_change_password'  => false,
                'two_factor_enabled'    => false,
                'email_verified_at'     => now(),
            ]
        );
        $repKnd = Representative::updateOrCreate(
            ['user_id' => $repKndUser->id],
            [
                'representative_id'     => 'REP-KAN-102',
                'initials'              => 'C. B.',
                'nic_passport'          => '198512300440',
                'dob'                   => '1985-05-12',
                'residential_address'   => '78 Peradeniya Road, Kandy',
                'primary_district_id'   => 4, // Kandy
                'additional_district_ids' => [5], // Matale
                'bank_name'             => 'Commercial Bank of Ceylon',
                'bank_branch'           => 'Kandy City Branch',
                'account_name'          => 'C B Rathnayake',
                'account_number'        => '98765432100',
                'agreement_version'     => 'v1.0',
                'agreement_signed_at'   => now(),
                'document_verified'     => true,
                'status'                => 'active',
                'quality_score'         => 0,
                'notes'                 => 'Real Kandy district representative.',
            ]
        );
        ReferralCode::updateOrCreate(
            ['representative_id' => $repKnd->id, 'code' => 'ZV-KAN-CBR'],
            [
                'slug'       => 'zv-kan-cbr',
                'campaign'   => '2026-Q3-Central',
                'is_active'  => true,
            ]
        );

        // ── 8. DISTRICT REP – GALLE ─────────────────────────────────────
        $repGalUser = User::updateOrCreate(
            ['email' => 'rep.galle@ziveka.lk'],
            [
                'name'                  => 'Dilini Madhushani Silva',
                'mobile'                => '0912000003',
                'role'                  => 'representative',
                'status'                => 'active',
                'password'              => Hash::make('Rep@Galle2026!'),
                'must_change_password'  => false,
                'two_factor_enabled'    => false,
                'email_verified_at'     => now(),
            ]
        );
        $repGal = Representative::updateOrCreate(
            ['user_id' => $repGalUser->id],
            [
                'representative_id'     => 'REP-GAL-103',
                'initials'              => 'D. M.',
                'nic_passport'          => '199305802260',
                'dob'                   => '1993-03-05',
                'residential_address'   => '33 Light House Street, Galle Fort',
                'primary_district_id'   => 8, // Galle
                'additional_district_ids' => [9], // Matara
                'bank_name'             => 'Sampath Bank',
                'bank_branch'           => 'Galle Branch',
                'account_name'          => 'D M Silva',
                'account_number'        => '11223344556',
                'agreement_version'     => 'v1.0',
                'agreement_signed_at'   => now(),
                'document_verified'     => true,
                'status'                => 'active',
                'quality_score'         => 0,
                'notes'                 => 'Real Galle district representative.',
            ]
        );
        ReferralCode::updateOrCreate(
            ['representative_id' => $repGal->id, 'code' => 'ZV-GAL-DMS'],
            [
                'slug'       => 'zv-gal-dms',
                'campaign'   => '2026-Q3-Southern',
                'is_active'  => true,
            ]
        );

        // ── 9. DISTRICT REP – KURUNEGALA ────────────────────────────────
        $repKurUser = User::updateOrCreate(
            ['email' => 'rep.kurunegala@ziveka.lk'],
            [
                'name'                  => 'Thilina Madusanka Weerasekara',
                'mobile'                => '0372000004',
                'role'                  => 'representative',
                'status'                => 'active',
                'password'              => Hash::make('Rep@Kurunegala2026!'),
                'must_change_password'  => false,
                'two_factor_enabled'    => false,
                'email_verified_at'     => now(),
            ]
        );
        $repKur = Representative::updateOrCreate(
            ['user_id' => $repKurUser->id],
            [
                'representative_id'     => 'REP-KUR-104',
                'initials'              => 'T. M.',
                'nic_passport'          => '199715400780',
                'dob'                   => '1997-06-03',
                'residential_address'   => '56 Colombo Road, Kurunegala',
                'primary_district_id'   => 11, // Kurunegala
                'additional_district_ids' => [12], // Puttalam
                'bank_name'             => 'National Savings Bank',
                'bank_branch'           => 'Kurunegala Branch',
                'account_name'          => 'T M Weerasekara',
                'account_number'        => '44556677889',
                'agreement_version'     => 'v1.0',
                'agreement_signed_at'   => now(),
                'document_verified'     => true,
                'status'                => 'active',
                'quality_score'         => 0,
                'notes'                 => 'Real Kurunegala / North Western district representative.',
            ]
        );
        ReferralCode::updateOrCreate(
            ['representative_id' => $repKur->id, 'code' => 'ZV-KUR-TMW'],
            [
                'slug'       => 'zv-kur-tmw',
                'campaign'   => '2026-Q3-NorthWest',
                'is_active'  => true,
            ]
        );

        // ── 10. DISTRICT REP – JAFFNA ───────────────────────────────────
        $repJafUser = User::updateOrCreate(
            ['email' => 'rep.jaffna@ziveka.lk'],
            [
                'name'                  => 'Sathiyaseelan Arumugam',
                'mobile'                => '0212000005',
                'role'                  => 'representative',
                'status'                => 'active',
                'password'              => Hash::make('Rep@Jaffna2026!'),
                'must_change_password'  => false,
                'two_factor_enabled'    => false,
                'email_verified_at'     => now(),
            ]
        );
        $repJaf = Representative::updateOrCreate(
            ['user_id' => $repJafUser->id],
            [
                'representative_id'     => 'REP-JAF-105',
                'initials'              => 'S. A.',
                'nic_passport'          => '198603501120',
                'dob'                   => '1986-02-03',
                'residential_address'   => '14 Hospital Road, Jaffna',
                'primary_district_id'   => 21, // Jaffna
                'additional_district_ids' => [22], // Kilinochchi
                'bank_name'             => 'Bank of Ceylon',
                'bank_branch'           => 'Jaffna Branch',
                'account_name'          => 'S Arumugam',
                'account_number'        => '77889900112',
                'agreement_version'     => 'v1.0',
                'agreement_signed_at'   => now(),
                'document_verified'     => true,
                'status'                => 'active',
                'quality_score'         => 0,
                'notes'                 => 'Real Jaffna / Northern district representative.',
            ]
        );
        ReferralCode::updateOrCreate(
            ['representative_id' => $repJaf->id, 'code' => 'ZV-JAF-SAR'],
            [
                'slug'       => 'zv-jaf-sar',
                'campaign'   => '2026-Q3-Northern',
                'is_active'  => true,
            ]
        );

        $this->command->info('✅ Real production profiles created successfully!');
        $this->command->table(
            ['Role', 'Name', 'Email', 'Password', 'Rep ID / Ref Code'],
            [
                ['Super Admin',     'Ziveka Campus Director',     'director@zivekacampus.lk',      'Ziveka@Admin2026!',      '—'],
                ['Campus Admin',    'Samanthi Perera',            'admissions@zivekacampus.lk',    'Campus@2026!',           '—'],
                ['Finance Officer', 'Roshan Fernando',            'finance@zivekacampus.lk',       'Finance@2026!',          '—'],
                ['Counsellor',      'Nimasha Wickramasinghe',     'counsellor@zivekacampus.lk',    'Counsel@2026!',          '—'],
                ['Auditor',         'Pradeep Jayasinghe',         'audit@zivekacampus.lk',         'Audit@2026!',            '—'],
                ['Rep – Colombo',   'Asanka Kumara Perera',       'rep.colombo@ziveka.lk',         'Rep@Colombo2026!',       'REP-CMB-101 / ZV-CMB-AKP'],
                ['Rep – Kandy',     'Chaminda Bandara Rathnayake','rep.kandy@ziveka.lk',           'Rep@Kandy2026!',         'REP-KAN-102 / ZV-KAN-CBR'],
                ['Rep – Galle',     'Dilini Madhushani Silva',    'rep.galle@ziveka.lk',           'Rep@Galle2026!',         'REP-GAL-103 / ZV-GAL-DMS'],
                ['Rep – Kurunegala','Thilina Madusanka Weerasekara','rep.kurunegala@ziveka.lk',  'Rep@Kurunegala2026!',    'REP-KUR-104 / ZV-KUR-TMW'],
                ['Rep – Jaffna',    'Sathiyaseelan Arumugam',     'rep.jaffna@ziveka.lk',          'Rep@Jaffna2026!',        'REP-JAF-105 / ZV-JAF-SAR'],
            ]
        );
    }
}
