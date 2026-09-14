import React, { useState } from 'react';
import { Check, ImagePlus, KeyRound, Mail, User as UserIcon, X } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { getProfilePictureUrl } from '../services/api';

interface AccountProfileProps {
  currentUser: User;
  onProfileUpdated: (user: User) => void;
}

export const AccountProfile: React.FC<AccountProfileProps> = ({ currentUser, onProfileUpdated }) => {
  const [name, setName] = useState(currentUser.name);
  const [mobile, setMobile] = useState(currentUser.mobile || '');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const profilePictureUrl = getProfilePictureUrl(currentUser.profile_picture_path);

  const handlePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfilePicture(file);
    setPreview(URL.createObjectURL(file));
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage(null);
    if (newPassword.length < 8) {
      setPasswordMessage('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      onProfileUpdated({ ...currentUser, must_change_password: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password changed successfully.');
    } catch (error: any) {
      setPasswordMessage(error.message || 'Could not change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const data = new FormData();
      data.append('name', name);
      data.append('mobile', mobile);
      if (profilePicture) data.append('profile_picture', profilePicture);
      const response = await api.updateProfile(data);
      onProfileUpdated(response.user);
      setProfilePicture(null);
      setPreview(null);
      setMessage('Profile updated successfully.');
    } catch (error: any) {
      setMessage(error.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {preview || profilePictureUrl ? (
              <img src={preview || profilePictureUrl || ''} alt="Profile" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-3xl font-black text-white">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Account Profile</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">{currentUser.name}</h1>
              <p className="mt-1 text-xs font-semibold capitalize text-slate-500">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold capitalize text-emerald-800">
            {currentUser.status}
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
      <form onSubmit={saveProfile} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-sm font-black text-slate-900">Customize Profile</h2>
        <label className="block text-xs font-bold text-slate-700">Full Name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
        <label className="block text-xs font-bold text-slate-700">Mobile Number<input value={mobile} onChange={(event) => setMobile(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
        <div>
          <label className="block text-xs font-bold text-slate-700">Profile Picture <span className="font-normal text-slate-400">(optional)</span></label>
          <div className="mt-1.5 flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"><ImagePlus className="h-4 w-4" /> Choose image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp" onChange={handlePictureChange} className="hidden" /></label>
            {profilePicture && <button type="button" onClick={() => { setProfilePicture(null); setPreview(null); }} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove selected picture"><X className="h-4 w-4" /></button>}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">JPG, JPEG, PNG, WebP, GIF or BMP up to 5 MB.</p>
        </div>
        {message && <p className="text-xs font-semibold text-emerald-700">{message}</p>}
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"><Check className="h-4 w-4" />{saving ? 'Saving...' : 'Save Profile'}</button>
      </form>

      <section className="grid grid-cols-1 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <Mail className="h-5 w-5 text-indigo-600" />
          <p className="mt-3 text-xs font-semibold text-slate-400">Email Address</p>
          <p className="mt-1 text-sm font-bold text-slate-900 break-all">{currentUser.email}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:col-span-2">
          <UserIcon className="h-5 w-5 text-indigo-600" />
          <p className="mt-3 text-xs font-semibold text-slate-400">Mobile Number</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{currentUser.mobile || 'Not provided'}</p>
        </div>
        <form onSubmit={changePassword} className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-xs sm:col-span-2">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900"><KeyRound className="h-5 w-5 text-amber-600" /> Change Password</div>
          {currentUser.must_change_password && <p className="mt-2 text-xs font-semibold text-amber-800">Change your temporary password before using the portal.</p>}
          <div className="mt-4 grid grid-cols-1 gap-3">
            <input required type="password" autoComplete="current-password" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            <input required minLength={8} type="password" autoComplete="new-password" placeholder="New password (8+ characters)" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            <input required minLength={8} type="password" autoComplete="new-password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
          </div>
          {passwordMessage && <p className="mt-3 text-xs font-semibold text-amber-900">{passwordMessage}</p>}
          <button disabled={changingPassword} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"><KeyRound className="h-4 w-4" />{changingPassword ? 'Changing...' : 'Change Password'}</button>
        </form>
      </section>
      </div>
    </div>
  );
};
