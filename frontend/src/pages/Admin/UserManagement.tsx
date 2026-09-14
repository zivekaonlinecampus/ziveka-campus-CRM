import React, { useEffect, useState } from 'react';
import { Check, Copy, Eye, EyeOff, ImagePlus, KeyRound, Plus, ShieldCheck, UserPlus, X } from 'lucide-react';
import { District, User } from '../../types';
import { api, getProfilePictureUrl } from '../../services/api';
import { citiesByDistrictCode } from '../../data/citiesByDistrict';

const roleOptions: { value: Exclude<User['role'], 'super_admin'>; label: string }[] = [
  { value: 'campus_admin', label: 'Campus Admin' },
  { value: 'finance_officer', label: 'Finance Officer' },
  { value: 'counsellor', label: 'Admissions Counsellor' },
  { value: 'auditor', label: 'Compliance Auditor' },
  { value: 'representative', label: 'Representative' },
];

const generatePassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const values = new Uint32Array(12);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
};

const profilePictureUrl = getProfilePictureUrl;

interface UserManagementProps {
  districts: District[];
}

export const UserManagement: React.FC<UserManagementProps> = ({ districts }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [representativeFiles, setRepresentativeFiles] = useState({ nic_copy: null as File | null, signed_agreement: null as File | null });
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'campus_admin' as User['role'], mobile: '', primary_district_id: districts[0]?.id || 1, city: '', nic_passport: '', bank_name: 'Commercial Bank of Ceylon', bank_branch: 'Main Branch', account_name: '', account_number: '' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.getManagedUsers();
      setUsers(response.users);
    } catch (error: any) {
      alert(error.message || 'Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleGeneratePassword = () => {
    setForm((current) => ({ ...current, password: generatePassword() }));
    setShowPassword(true);
    setCopied(false);
  };

  const copyPassword = async () => {
    if (!form.password) return;
    await navigator.clipboard.writeText(form.password);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    setProfilePicture(file);
    setProfilePicturePreview(URL.createObjectURL(file));
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('email', form.email);
      data.append('password', form.password);
      data.append('role', form.role);
      if (form.role === 'representative') {
        data.append('mobile', form.mobile);
        data.append('primary_district_id', String(form.primary_district_id));
        data.append('city', form.city);
        data.append('nic_passport', form.nic_passport);
        data.append('bank_name', form.bank_name);
        data.append('bank_branch', form.bank_branch);
        data.append('account_name', form.account_name);
        data.append('account_number', form.account_number);
        if (representativeFiles.nic_copy) data.append('nic_copy', representativeFiles.nic_copy);
        if (representativeFiles.signed_agreement) data.append('signed_agreement', representativeFiles.signed_agreement);
      }
      if (profilePicture) data.append('profile_picture', profilePicture);
      const response = await api.createManagedUser(data);
      setMessage(`${response.user.name} was created successfully.`);
      setForm({ name: '', email: '', password: '', role: 'campus_admin', mobile: '', primary_district_id: districts[0]?.id || 1, city: '', nic_passport: '', bank_name: 'Commercial Bank of Ceylon', bank_branch: 'Main Branch', account_name: '', account_number: '' });
      setRepresentativeFiles({ nic_copy: null, signed_agreement: null });
      removeProfilePicture();
      setShowPassword(false);
      await loadUsers();
    } catch (error: any) {
      alert(error.message || 'Failed to create user account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold text-indigo-600"><UserPlus className="h-4 w-4" /> Account Administration</div>
          <h2 className="text-xl font-bold text-slate-900">Register New User</h2>
          <p className="mt-0.5 text-xs text-slate-500">Create secure access for campus teams and representatives.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800"><ShieldCheck className="h-3.5 w-3.5" /> Protected account creation</div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><KeyRound className="h-5 w-5" /></div><div><h3 className="text-sm font-bold text-slate-900">Account details</h3><p className="text-xs text-slate-500">New users must change this password at first sign-in.</p></div></div>
          <label className="block text-xs font-bold text-slate-700">Full Name *<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
          <label className="block text-xs font-bold text-slate-700">Email Address *<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
          <label className="block text-xs font-bold text-slate-700">Account Role *<select required value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as User['role'], city: '' })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">{roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
          {form.role === 'representative' && (
            <div className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div><h3 className="text-sm font-bold text-slate-900">Representative details</h3><p className="mt-1 text-[11px] text-slate-500">These details create the representative profile and referral code.</p></div>
              <label className="block text-xs font-bold text-slate-700">Mobile Number *<input required value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal" /></label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-700">Primary District *<select required value={form.primary_district_id} onChange={(event) => setForm({ ...form, primary_district_id: Number(event.target.value), city: '' })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal">{districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}</select></label>
                <label className="block text-xs font-bold text-slate-700">City *<select required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal"><option value="">Select City</option>{(citiesByDistrictCode[districts.find((district) => district.id === form.primary_district_id)?.code || ''] || []).map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}</select></label>
              </div>
              <label className="block text-xs font-bold text-slate-700">NIC / Passport<input value={form.nic_passport} onChange={(event) => setForm({ ...form, nic_passport: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal" /></label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(['nic_copy', 'signed_agreement'] as const).map((field) => <label key={field} className="block cursor-pointer text-xs font-bold text-slate-700">{field === 'nic_copy' ? 'NIC / Passport Copy' : 'Signed Agreement'}<input type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.pdf" onChange={(event) => setRepresentativeFiles({ ...representativeFiles, [field]: event.target.files?.[0] || null })} className="mt-1.5 block w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-normal" /><span className="mt-1 block truncate text-[10px] font-normal text-slate-400">{representativeFiles[field]?.name || 'Optional, PDF or image up to 5 MB'}</span></label>)}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-700">Bank Name<input value={form.bank_name} onChange={(event) => setForm({ ...form, bank_name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal" /></label>
                <label className="block text-xs font-bold text-slate-700">Bank Branch<input value={form.bank_branch} onChange={(event) => setForm({ ...form, bank_branch: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal" /></label>
                <label className="block text-xs font-bold text-slate-700">Account Name<input value={form.account_name} onChange={(event) => setForm({ ...form, account_name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal" /></label>
                <label className="block text-xs font-bold text-slate-700">Account Number<input value={form.account_number} onChange={(event) => setForm({ ...form, account_number: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal" /></label>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-700">Profile Picture <span className="font-normal text-slate-400">(optional)</span></label>
            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-dashed border-slate-300 p-3">
              {profilePicturePreview ? <img src={profilePicturePreview} alt="Profile preview" className="h-14 w-14 rounded-xl object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><ImagePlus className="h-5 w-5" /></div>}
              <div className="min-w-0 flex-1">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"><ImagePlus className="h-3.5 w-3.5" /> Choose image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml" onChange={handleProfilePictureChange} className="hidden" /></label>
                <p className="mt-1 text-[10px] text-slate-400">JPG, JPEG, PNG, WebP, GIF or BMP up to 5 MB.</p>
              </div>
              {profilePicture && <button type="button" onClick={removeProfilePicture} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove profile picture"><X className="h-4 w-4" /></button>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">Temporary Password *</label>
            <div className="mt-1.5 flex gap-2"><div className="relative min-w-0 flex-1"><input required minLength={8} type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-20 text-sm font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><button type="button" onClick={handleGeneratePassword} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-100"><KeyRound className="h-3.5 w-3.5" /> Generate</button>{form.password && <button type="button" onClick={copyPassword} className="rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-600 hover:bg-slate-100" aria-label="Copy password">{copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button>}</div>
            <p className="mt-1.5 text-[11px] text-slate-400">Use Generate for a strong password or type one manually.</p>
          </div>
          {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">{message}</div>}
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"><Plus className="h-4 w-4" />{saving ? 'Creating account...' : 'Create User Account'}</button>
        </form>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 bg-slate-50 p-5"><h3 className="text-sm font-bold text-slate-900">Registered Accounts</h3><p className="mt-1 text-xs text-slate-500">Page access is managed by role in Permission Management.</p></div>
          {loading ? <div className="p-8 text-center text-xs text-slate-400">Loading accounts...</div> : <div className="divide-y divide-slate-100">{users.map((user) => <div key={user.id} className="flex items-center justify-between gap-4 p-4"><div className="flex min-w-0 items-center gap-3">{profilePictureUrl(user.profile_picture_path) ? <img src={profilePictureUrl(user.profile_picture_path) as string} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{user.name.charAt(0).toUpperCase()}</div>}<div className="min-w-0"><div className="truncate text-xs font-bold text-slate-800">{user.name}</div><div className="truncate text-[11px] text-slate-500">{user.email} · {user.role.replace('_', ' ')}</div></div></div><span className="shrink-0 rounded-xl bg-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-800">Active</span></div>)}</div>}
        </div>
      </div>
    </div>
  );
};
