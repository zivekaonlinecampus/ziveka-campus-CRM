import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Representative, User } from '../../types';
import { api } from '../../services/api';
import { getProfilePictureUrl } from '../../services/api';
import { User as UserIcon, Building2, FileText, Eye, X, Check } from 'lucide-react';

interface RepProfileProps {
  representative: Representative | null;
  currentUser: User | null;
}

export const RepProfile: React.FC<RepProfileProps> = ({ representative, currentUser }) => {
  const { t } = useLanguage();

  const [bankData, setBankData] = useState({
    bank_name: representative?.bank_name || 'Commercial Bank of Ceylon',
    bank_branch: representative?.bank_branch || 'Maharagama Branch',
    account_name: representative?.account_name || representative?.user?.name || '',
    account_number: representative?.account_number || '8004523910',
    reason: '',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{ label: string; url: string } | null>(null);

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!representative) return;
    setSaving(true);
    setSuccessMsg(null);
    try {
      await api.updateRepBank(representative.id, bankData);
      setSuccessMsg('Bank account update recorded with compliance audit log.');
    } catch (err: any) {
      alert(err.message || 'Failed to update bank details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Profile Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center space-x-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
          {getProfilePictureUrl(representative?.user?.profile_picture_path) || representative?.profile_picture_url ? (
            <img src={(getProfilePictureUrl(representative?.user?.profile_picture_path) || representative?.profile_picture_url) as string} alt="Profile" className="h-full w-full rounded-2xl object-cover" />
          ) : representative?.user?.name?.charAt(0) || 'R'}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">{representative?.user?.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
              {representative?.status || 'Active'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Representative ID: <span className="font-mono font-bold text-slate-900">{representative?.representative_id}</span> • Assigned District:{' '}
            <span className="font-semibold text-indigo-700">{representative?.primary_district?.name}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.05fr)_minmax(260px,0.9fr)] gap-6 items-start">
        {/* Contact & Assignment Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <UserIcon className="w-4 h-4 text-indigo-600" />
            <span>Personal & District Assignment</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Email Address</span>
              <div className="font-semibold text-slate-900">{currentUser?.email}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Primary Mobile (WhatsApp)</span>
              <div className="font-semibold text-slate-900">{currentUser?.mobile || representative?.user?.mobile}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">NIC / Passport</span>
              <div className="font-semibold text-slate-900 font-mono">{representative?.nic_passport || '199214502340'}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Residential / Regional Office Address</span>
              <div className="font-semibold text-slate-900">{representative?.residential_address || '45/2 High Level Road, Maharagama'}</div>
            </div>
          </div>
        </div>

        {/* Bank & Disbursement Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Direct Payout Bank Details</span>
          </h3>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleBankSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('bankName')}</label>
              <input
                type="text"
                required
                value={bankData.bank_name}
                onChange={(e) => setBankData({ ...bankData, bank_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('bankBranch')}</label>
              <input
                type="text"
                required
                value={bankData.bank_branch}
                onChange={(e) => setBankData({ ...bankData, bank_branch: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('accountName')}</label>
              <input
                type="text"
                required
                value={bankData.account_name}
                onChange={(e) => setBankData({ ...bankData, account_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('accountNumber')}</label>
              <input
                type="text"
                required
                value={bankData.account_number}
                onChange={(e) => setBankData({ ...bankData, account_number: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Change / Verification Note</label>
              <input
                type="text"
                value={bankData.reason}
                onChange={(e) => setBankData({ ...bankData, reason: e.target.value })}
                placeholder="Branch change / new disbursement account"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? t('loading') : 'Update Bank Account (Audit Logged)'}
            </button>
          </form>
        </div>

        {/* Verification Documents */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Verification Documents</span>
          </h3>

          <div className="space-y-3">
            {[
              { label: 'NIC / Passport Copy', url: representative?.nic_copy_url },
              { label: 'Signed Agreement Copy', url: representative?.signed_agreement_url },
            ].map((document) => (
              <div key={document.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-800">{document.label}</p>
                {document.url ? (
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewDocument({ label: document.label, url: document.url as string })}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
                    >
                      <Eye className="h-4 w-4" />
                      View copy
                    </button>
                    <span className="text-[10px] font-semibold text-emerald-600">Uploaded</span>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-400">Not uploaded</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {previewDocument && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setPreviewDocument(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h2 className="text-sm font-bold text-slate-900">{previewDocument.label}</h2>
              <button
                type="button"
                onClick={() => setPreviewDocument(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close document preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-h-[55vh] items-center justify-center overflow-auto bg-slate-100 p-4">
              {previewDocument.url.toLowerCase().includes('.pdf') ? (
                <iframe title={previewDocument.label} src={previewDocument.url} className="h-[70vh] w-full rounded-lg bg-white" />
              ) : (
                <img src={previewDocument.url} alt={previewDocument.label} className="max-h-[70vh] max-w-full rounded-lg object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
