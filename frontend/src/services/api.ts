import {
  User,
  District,
  Course,
  Representative,
  Lead,
  Payment,
  Commission,
  PayoutBatch,
  Scholarship,
  Activity,
  AuditLog,
  SystemSettingsMap,
} from '../types';

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? window.location.origin
    : 'http://localhost:8000');

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? `${window.location.origin}/api`
    : 'http://localhost:8000/api');

export const getStorageUrl = (path?: string | null): string | null => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${BACKEND_URL}/storage/${path.replace(/^\/+/, '')}`;
};

export const getProfilePictureUrl = (path?: string | null): string | null => {
  return getStorageUrl(path);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('ziveka_auth_token');
};

export const downloadRepresentativeDocument = async (id: number, document: 'nic-copy' | 'signed-agreement') => {
  const response = await fetch(`${API_BASE_URL}/representatives/${id}/documents/${document}/download`, {
    headers: { Accept: 'application/octet-stream', Authorization: `Bearer ${getAuthToken() || ''}` },
  });
  if (!response.ok) throw new Error('Document download failed.');
  return response;
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('ziveka_auth_token', token);
  } else {
    localStorage.removeItem('ziveka_auth_token');
  }
};

const getHeaders = (body?: BodyInit | null) => {
  const token = getAuthToken();
  return {
    Accept: 'application/json',
    ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(options.body),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMsg = `Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.message) errorMsg = errJson.message;
      if (errJson.errors) {
        const errorList = Object.values(errJson.errors).flat().join(', ');
        errorMsg += ` (${errorList})`;
      }
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ user: User; token: string; requires_password_change: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request<{ user: User }>('/auth/me'),
  updateProfile: (data: FormData) => request<{ user: User }>('/auth/profile', { method: 'PATCH', body: data }),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),


  changePassword: (current_password: string, new_password: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    }),

  // Master Data
  getDistricts: () => request<{ districts: District[] }>('/districts'),
  getCourses: (includeInactive = false) => request<{ courses: Course[] }>(includeInactive ? '/courses/all' : '/courses'),
  getManagedUsers: () => request<{ users: User[] }>('/user-management'),
  createManagedUser: (data: FormData) =>
    request<{ user: User; message: string }>('/user-management', { method: 'POST', body: data }),
  updateUserPermissions: (id: number, permissions: string[]) =>
    request<{ user: User }>(`/user-management/${id}/permissions`, { method: 'PATCH', body: JSON.stringify({ permissions }) }),
  updateUserRegistrationRoleAccess: (role: User['role'], enabled: boolean) =>
    request<{ role_access: Record<string, boolean> }>('/user-management/role-access', { method: 'PATCH', body: JSON.stringify({ role, enabled }) }),
  createCourse: (data: any) => request<{ course: Course }>('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourseStatus: (id: number, is_active: boolean) => request<{ course: Course }>(`/courses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ is_active }) }),
  checkReferral: (code: string) =>
    request<{ valid: boolean; referral: any; representative: Representative }>(`/referral-check/${code}`),

  // Public Lead Form
  submitPublicLead: (data: Partial<Lead>) =>
    request<{ message: string; lead: Lead; is_duplicate: boolean }>('/public/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Representative Portal
  getMyRepDashboard: () =>
    request<{
      representative: Representative;
      kpis: any;
      bonus_progress: any;
      recent_leads: Lead[];
      recent_commissions: Commission[];
    }>('/representatives/my-dashboard'),

  getRepresentatives: (params?: { district_id?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ representatives: Representative[] }>(`/representatives?${query}`);
  },

  getRepresentative360: (id: number) =>
    request<{ representative: Representative; stats: any; audit_logs: AuditLog[] }>(`/representatives/${id}`),

  createRepresentative: (data: any) =>
    request<{ message: string; representative: Representative }>('/representatives', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  updateRepStatus: (id: number, status: string, reason?: string) =>
    request<{ message: string; representative: Representative }>(`/representatives/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),
  deleteRepresentative: (id: number) =>
    request<{ message: string }>(`/representatives/${id}`, { method: 'DELETE' }),

  updateRepBank: (id: number, data: any) =>
    request<{ message: string; representative: Representative }>(`/representatives/${id}/bank`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  uploadRepDocuments: (id: number, data: FormData) =>
    request<{ message: string; representative: Representative }>(`/representatives/${id}/documents`, {
      method: 'POST',
      body: data,
    }),
  uploadRepProfilePicture: (id: number, data: FormData) =>
    request<{ message: string; representative: Representative }>(`/representatives/${id}/profile-picture`, {
      method: 'POST',
      body: data,
    }),

  // Leads
  getLeads: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request<{ leads: Lead[] }>(`/leads?${query}`);
  },

  getLeadDetail: (id: number) => request<{ lead: Lead }>(`/leads/${id}`),

  createLead: (data: Partial<Lead>) =>
    request<{ message: string; lead: Lead; is_duplicate: boolean }>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  checkDuplicate: (data: { mobile?: string; nic_passport?: string; email?: string; full_name?: string; district_id?: number }) =>
    request<{ is_duplicate: boolean; match_type: string | null; existing_lead: Lead | null }>('/leads/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateLeadStatus: (id: number, status: string, lost_reason?: string, notes?: string, counsellor_id?: number) =>
    request<{ message: string; lead: Lead }>(`/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, lost_reason, notes, counsellor_id }),
    }),

  mergeLead: (id: number, master_lead_id: number, reason: string) =>
    request<{ message: string; master_lead: Lead }>(`/leads/${id}/merge`, {
      method: 'POST',
      body: JSON.stringify({ master_lead_id, reason }),
    }),

  bulkImportLeads: (leads: any[]) =>
    request<{ message: string; imported: number; duplicates: number }>('/leads/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ leads }),
    }),

  // Payments & Finance
  getPayments: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request<{ payments: Payment[] }>(`/payments?${query}`);
  },

  recordPayment: (data: any) =>
    request<{ message: string; payment: Payment }>('/payments', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  downloadPaymentDocument: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}/document`, {
      headers: {
        Accept: '*/*',
        ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      },
    });
    if (!response.ok) throw new Error('Payment document download failed.');
    return response.blob();
  },

  verifyPayment: (id: number, notes?: string) =>
    request<{ message: string; payment: Payment }>(`/payments/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    }),

  refundPayment: (id: number, amount: number, reason: string) =>
    request<{ message: string; refund_payment: Payment }>(`/payments/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    }),

  // Commissions
  getCommissions: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request<{ commissions: Commission[]; summary: any }>(`/commissions?${query}`);
  },

  approveCommission: (id: number) =>
    request<{ message: string; commission: Commission }>(`/commissions/${id}/approve`, {
      method: 'PATCH',
    }),

  adjustCommission: (representative_id: number, amount: number, reason: string) =>
    request<{ message: string; commission: Commission }>('/commissions/adjust', {
      method: 'POST',
      body: JSON.stringify({ representative_id, amount, reason }),
    }),

  // Payout Batches & Bank Deposits
  getPayoutBatches: () => request<{ batches: PayoutBatch[] }>('/payout-batches'),

  getPayableRepresentatives: () => request<{ payable_representatives: any[] }>('/payout-batches/payable-reps'),

  depositRepresentativeCommission: (data: {
    representative_id: number;
    amount: number;
    bank_transfer_reference: string;
    deposit_date?: string;
    notes?: string;
    commission_ids?: number[];
  }) =>
    request<{ message: string; payout_batch: any; summary: any }>('/payout-batches/deposit-rep', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPayoutBatchDetail: (id: number) => request<{ batch: PayoutBatch }>(`/payout-batches/${id}`),

  createPayoutBatch: (period: string, commission_ids: number[], notes?: string) =>
    request<{ message: string; batch: PayoutBatch }>('/payout-batches', {
      method: 'POST',
      body: JSON.stringify({ period, commission_ids, notes }),
    }),

  completePayoutBatch: (id: number, bank_transfer_reference: string, notes?: string) =>
    request<{ message: string; batch: PayoutBatch }>(`/payout-batches/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ bank_transfer_reference, notes }),
    }),

  getRepStatement: (repId: number) => request<any>(`/representatives/${repId}/statement`),

  // Scholarships
  getScholarships: () => request<{ scholarships: Scholarship[]; quota: any }>('/scholarships'),

  submitScholarship: (data: any) =>
    request<{ message: string; scholarship: Scholarship }>('/scholarships', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  decisionScholarship: (id: number, status: string, score?: number, review_notes?: string) =>
    request<{ message: string; scholarship: Scholarship }>(`/scholarships/${id}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ status, score, review_notes }),
    }),

  // Reports
  getGlobalDashboard: () =>
    request<{
      summary: any;
      funnel: Record<string, number>;
      districts: any[];
      exceptions: Record<string, number>;
    }>('/reports/dashboard'),

  getRepPerformance: () =>
    request<{ performance: any[]; weights: any }>('/reports/representatives'),

  // Settings & Audit Logs
  getSettings: () => request<{ settings: SystemSettingsMap; raw: any[] }>('/settings'),

  updateSettings: (settings: Partial<SystemSettingsMap>) =>
    request<{ message: string; settings: any }>('/settings', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    }),

  getAuditLogs: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request<{ logs: AuditLog[] }>(`/audit-logs?${query}`);
  },

  // Counselling
  getActivities: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request<{ activities: Activity[] }>(`/activities?${query}`);
  },

  logActivity: (data: any) =>
    request<{ message: string; activity: Activity }>('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
