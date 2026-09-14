export type UserRole =
  | 'super_admin'
  | 'campus_admin'
  | 'finance_officer'
  | 'counsellor'
  | 'representative'
  | 'auditor';

export type UserStatus = 'active' | 'suspended' | 'terminated' | 'pending';

export interface User {
  id: number;
  name: string;
  profile_picture_path?: string | null;
  email: string;
  mobile?: string;
  role: UserRole;
  status: UserStatus;
  must_change_password?: boolean;
  two_factor_enabled?: boolean;
  permissions?: string[];
  last_login_at?: string;
  representative?: Representative;
}

export interface District {
  id: number;
  name: string;
  name_si?: string;
  code: string;
  province: string;
  is_active: boolean;
  leads_count?: number;
  reps_count?: number;
  paid_students_count?: number;
  revenue?: number;
}

export interface Course {
  id: number;
  title: string;
  title_si?: string;
  code: string;
  registration_fee: number;
  course_fee: number;
  total_fee: number;
  duration: string;
  delivery_mode: string;
  description?: string;
  is_active: boolean;
}

export interface ReferralCode {
  id: number;
  representative_id: number;
  code: string;
  slug: string;
  campaign?: string;
  clicks_count: number;
  is_active: boolean;
}

export interface Representative {
  id: number;
  user_id: number;
  representative_id: string;
  initials?: string;
  nic_passport?: string;
  nic_copy_url?: string | null;
  signed_agreement_url?: string | null;
  dob?: string;
  residential_address?: string;
  primary_district_id: number;
  city?: string;
  profile_picture_url?: string;
  additional_district_ids?: number[];
  bank_name?: string;
  bank_branch?: string;
  account_name?: string;
  account_number?: string;
  agreement_version: string;
  agreement_signed_at?: string;
  document_verified: boolean;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'active' | 'suspended' | 'terminated';
  quality_score: number;
  notes?: string;
  user?: User;
  primary_district?: District;
  active_referral_code?: ReferralCode;
  referral_codes?: ReferralCode[];
  leads_count?: number;
  paid_students_count?: number;
  total_commission?: number;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'application'
  | 'payment_pending'
  | 'paid'
  | 'lost'
  | 'scholarship';

export interface Lead {
  id: number;
  lead_id: string;
  full_name: string;
  preferred_name?: string;
  mobile: string;
  normalized_mobile?: string;
  whatsapp?: string;
  email?: string;
  nic_passport?: string;
  dob?: string;
  age_group?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_contact?: string;
  district_id?: number;
  city?: string;
  course_id?: number;
  course_ids?: number[];
  intake?: string;
  preferred_language?: string;
  delivery_mode?: string;
  representative_id?: number;
  referral_code?: string;
  referral_timestamp?: string;
  counsellor_id?: number;
  status: LeadStatus;
  is_duplicate: boolean;
  duplicate_of_lead_id?: number;
  duplicate_confidence?: string;
  lost_reason?: string;
  notes?: string;
  created_at: string;
  district?: District;
  course?: Course;
  representative?: Representative;
  counsellor?: User;
  student?: Student;
  activities?: Activity[];
}

export interface Student {
  id: number;
  student_id: string;
  lead_id: number;
  full_name: string;
  email?: string;
  mobile: string;
  nic_passport?: string;
  district_id?: number;
  enrolment_date: string;
  day_30_active: boolean;
  is_completed: boolean;
  lead?: Lead;
  enrolments?: Enrolment[];
}

export interface Enrolment {
  id: number;
  student_id: number;
  course_id: number;
  representative_id?: number;
  intake: string;
  batch_number?: string;
  total_fee: number;
  discount_amount: number;
  paid_amount: number;
  is_scholarship: boolean;
  status: 'active' | 'completed' | 'refunded' | 'cancelled' | 'waived';
  enrolled_at?: string;
  student?: Student;
  course?: Course;
  representative?: Representative;
  payments?: Payment[];
  commission?: Commission;
}

export interface Payment {
  id: number;
  receipt_number: string;
  enrolment_id: number;
  amount: number;
  line_item: 'registration_fee' | 'course_fee' | 'full_payment' | 'instalment' | 'refund';
  payment_method: 'bank_transfer' | 'cash' | 'gateway' | 'cheque';
  bank_reference?: string;
  slip_path?: string;
  slip_url?: string;
  payment_date: string;
  status: 'pending' | 'verified' | 'rejected' | 'refunded' | 'waived';
  idempotency_key?: string;
  verified_by?: number;
  verified_at?: string;
  notes?: string;
  enrolment?: Enrolment;
  verifier?: User;
}

export interface Commission {
  id: number;
  transaction_id: string;
  enrolment_id?: number;
  representative_id: number;
  amount: number;
  type: 'base' | 'bonus' | 'reversal' | 'adjustment';
  status: 'pending' | 'eligible' | 'on_hold' | 'approved' | 'reversed' | 'paid';
  hold_reason?: string;
  adjustment_reason?: string;
  payout_batch_id?: number;
  approved_by?: number;
  approved_at?: string;
  effective_date: string;
  representative?: Representative;
  enrolment?: Enrolment;
  payout_batch?: PayoutBatch;
  approver?: User;
}

export interface PayoutBatch {
  id: number;
  batch_number: string;
  period: string;
  total_amount: number;
  representative_count: number;
  bank_transfer_reference?: string;
  status: 'draft' | 'approved' | 'completed' | 'cancelled';
  created_by: number;
  approved_by?: number;
  completed_at?: string;
  notes?: string;
  created_at: string;
  creator?: User;
  approver?: User;
  commissions?: Commission[];
}

export interface Scholarship {
  id: number;
  application_id: string;
  lead_id?: number;
  representative_id?: number;
  student_id?: number;
  applicant_name: string;
  nic_passport?: string;
  district_id: number;
  course_id: number;
  financial_need_summary: string;
  income_evidence_doc?: string;
  academic_motivation?: string;
  score?: number;
  quota_period: string;
  waiver_amount: number;
  status: 'submitted' | 'documents_pending' | 'under_review' | 'approved' | 'waitlisted' | 'rejected';
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  district?: District;
  course?: Course;
  representative?: Representative;
  lead?: Lead;
  student?: Student;
  reviewer?: User;
}

export interface Activity {
  id: number;
  lead_id?: number;
  representative_id?: number;
  user_id: number;
  type: 'call' | 'counselling' | 'note' | 'status_change' | 'document_upload' | 'duplicate_check' | 'merge';
  outcome?: string;
  next_follow_up_date?: string;
  notes: string;
  created_at: string;
  user?: User;
  lead?: Lead;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  reason?: string;
  created_at: string;
  user?: User;
}

export interface SystemSettingsMap {
  user_registration_role_access?: Partial<Record<UserRole, boolean>>;
  registration_fee: number;
  course_fee: number;
  total_student_fee: number;
  base_commission: number;
  target_bonus_5: number;
  target_bonus_10: number;
  target_bonus_20: number;
  scholarship_quota: number;
  scholarship_waiver_value: number;
  attribution_window_days: number;
  quality_score_weights: {
    paid_enrolment_rate: number;
    day_30_persistence: number;
    net_revenue: number;
    refund_rate: number;
    compliance: number;
  };
}
