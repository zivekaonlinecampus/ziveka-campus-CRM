import React, { useEffect, useState } from 'react';
import { Check, LockKeyhole, RotateCcw, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

type Role = 'super_admin' | 'campus_admin' | 'finance_officer' | 'counsellor' | 'auditor' | 'representative';

type Permission = {
  id: string;
  label: string;
  description: string;
};

const roles: { id: Role; label: string; description: string }[] = [
  { id: 'super_admin', label: 'Super Admin', description: 'Full system administration and configuration' },
  { id: 'campus_admin', label: 'Campus Admin', description: 'Student, representative, and scholarship operations' },
  { id: 'finance_officer', label: 'Finance Officer', description: 'Payments, commissions, and payout processing' },
  { id: 'counsellor', label: 'Counsellor', description: 'Lead follow-up, admissions, and counselling activities' },
  { id: 'auditor', label: 'Auditor', description: 'Read-only operational and compliance access' },
  { id: 'representative', label: 'Representative', description: 'Personal leads, commissions, and profile access' },
];

const permissions: Permission[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'View operational dashboard and KPIs' },
  { id: 'representatives', label: 'Representative Directory', description: 'View and manage representative records' },
  { id: 'students', label: 'Student Records', description: 'Manage leads, students, and admissions' },
  { id: 'payments', label: 'Payment Verification', description: 'Verify payment receipts and refunds' },
  { id: 'commissions', label: 'Commission & Bonuses', description: 'Approve commissions and create adjustments' },
  { id: 'payouts', label: 'Payout Batches', description: 'Disburse approved commissions to bank accounts' },
  { id: 'scholarships', label: 'Scholarship Board', description: 'Review and decide scholarship applications' },
  { id: 'reports', label: 'Reports & Analytics', description: 'View and export business reports' },
  { id: 'courses', label: 'Course Management', description: 'Create, update, and deactivate courses' },
  { id: 'settings', label: 'System Settings', description: 'Update campus-wide system parameters' },
  { id: 'audit_logs', label: 'Audit Logs', description: 'Review immutable compliance activity' },
  { id: 'manage_user_accounts', label: 'Register Users', description: 'Create accounts for campus teams and representatives' },
];

const defaultPermissions: Record<Role, string[]> = {
  super_admin: permissions.map((permission) => permission.id),
  campus_admin: ['dashboard', 'representatives', 'students', 'scholarships', 'reports'],
  finance_officer: ['dashboard', 'representatives', 'payments', 'commissions', 'payouts', 'reports'],
  counsellor: ['dashboard', 'students', 'representatives', 'scholarships'],
  auditor: ['dashboard', 'representatives', 'students', 'payments', 'commissions', 'payouts', 'scholarships', 'reports', 'audit_logs'],
  representative: ['dashboard', 'students', 'commissions', 'scholarships'],
};

const storageKey = 'ziveka-role-permissions';

export const PermissionManagement: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role>('campus_admin');
  const [rolePermissions, setRolePermissions] = useState<Record<Role, string[]>>(defaultPermissions);
  const [rolePageAccess, setRolePageAccess] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedPermissions = window.localStorage.getItem(storageKey);
    if (savedPermissions) {
      try {
        setRolePermissions({ ...defaultPermissions, ...JSON.parse(savedPermissions) });
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
  }, []);

  useEffect(() => {
    api.getSettings().then((response) => setRolePageAccess(response.settings.user_registration_role_access || {})).catch(() => undefined);
  }, []);

  const selectedRoleDetails = roles.find((role) => role.id === selectedRole);
  const selectedPermissions = rolePermissions[selectedRole];
  const enabledPermissionCount = selectedPermissions.filter((permission) => permission !== 'manage_user_accounts').length
    + (selectedRole === 'super_admin' || rolePageAccess[selectedRole] ? 1 : 0);

  const togglePermission = async (permissionId: string) => {
    if (selectedRole === 'super_admin') return;
    if (permissionId === 'manage_user_accounts') {
      const enabled = !(rolePageAccess[selectedRole] ?? false);
      try {
        const response = await api.updateUserRegistrationRoleAccess(selectedRole, enabled);
        setRolePageAccess(response.role_access);
      } catch (error: any) {
        alert(error.message || 'Failed to update Register Users access.');
      }
      return;
    }
    const nextPermissions = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter((id) => id !== permissionId)
      : [...selectedPermissions, permissionId];
    const nextRolePermissions = { ...rolePermissions, [selectedRole]: nextPermissions };
    setRolePermissions(nextRolePermissions);
    window.localStorage.setItem(storageKey, JSON.stringify(nextRolePermissions));
  };

  const resetRole = async () => {
    const nextRolePermissions = { ...rolePermissions, [selectedRole]: defaultPermissions[selectedRole] };
    setRolePermissions(nextRolePermissions);
    window.localStorage.setItem(storageKey, JSON.stringify(nextRolePermissions));
    if (selectedRole !== 'super_admin' && rolePageAccess[selectedRole]) {
      try {
        const response = await api.updateUserRegistrationRoleAccess(selectedRole, false);
        setRolePageAccess(response.role_access);
      } catch (error: any) {
        alert(error.message || 'Failed to reset Register Users access.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold text-indigo-600">
            <ShieldCheck className="h-4 w-4" /> Access Control
          </div>
          <h2 className="text-xl font-bold text-slate-900">Permission Management</h2>
          <p className="mt-0.5 text-xs text-slate-500">Manage the capabilities assigned to each campus role.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
          <LockKeyhole className="h-3.5 w-3.5" /> Super Admin only
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Roles</div>
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              className={`w-full rounded-2xl p-3 text-left transition-colors ${selectedRole === role.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <div className="text-xs font-bold">{role.label}</div>
              <div className={`mt-1 text-[11px] leading-4 ${selectedRole === role.id ? 'text-indigo-100' : 'text-slate-500'}`}>{role.description}</div>
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{selectedRoleDetails?.label} permissions</h3>
              <p className="mt-1 text-xs text-slate-500">{enabledPermissionCount} of {permissions.length} capabilities enabled</p>
            </div>
            <button
              type="button"
              onClick={resetRole}
              disabled={selectedRole === 'super_admin'}
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset defaults
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {permissions.map((permission) => {
              const enabled = permission.id === 'manage_user_accounts'
                ? selectedRole === 'super_admin' || Boolean(rolePageAccess[selectedRole])
                : selectedPermissions.includes(permission.id);
              return (
                <button
                  key={permission.id}
                  type="button"
                  onClick={() => togglePermission(permission.id)}
                  disabled={selectedRole === 'super_admin'}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-slate-50 disabled:cursor-default"
                >
                  <span>
                    <span className="block text-xs font-bold text-slate-800">{permission.label}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">{permission.description}</span>
                  </span>
                  <span className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors ${enabled ? 'justify-end bg-indigo-600' : 'justify-start bg-slate-200'}`}>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
                      {enabled && <Check className="h-3 w-3 text-indigo-600" />}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {selectedRole === 'super_admin' && (
            <div className="border-t border-slate-100 bg-amber-50 px-5 py-3 text-xs font-medium text-amber-800">
              Super Admin retains every capability and cannot be restricted from this screen.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
