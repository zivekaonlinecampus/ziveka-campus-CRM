import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Representative, Lead, Commission, AuditLog } from '../../types';
import { api, downloadRepresentativeDocument, getProfilePictureUrl } from '../../services/api';
import { requestPrompt } from '../../components/ThemedAlertHost';
import { X, User, Phone, Mail, Building2, Award, Percent, Users, ShieldAlert, CheckCircle, Clock, Download, ExternalLink, Trash2, FileText, Upload } from 'lucide-react';

interface Representative360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  representativeId: number | null;
  onStatusChange?: () => void;
}

export const Representative360Modal: React.FC<Representative360ModalProps> = ({
  isOpen,
  onClose,
  representativeId,
  onStatusChange,
}) => {
  const { t, formatCurrency } = useLanguage();
  const [rep360Data, setRep360Data] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'leads' | 'commissions' | 'audit' | 'bank'>('leads');
  const [previewDocument, setPreviewDocument] = useState<{ label: string; url: string } | null>(null);
  const [documentFiles, setDocumentFiles] = useState<{ nic_copy: File | null; signed_agreement: File | null }>({ nic_copy: null, signed_agreement: null });
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (isOpen && representativeId) {
      setLoading(true);
      api.getRepresentative360(representativeId)
        .then((res) => setRep360Data(res))
        .catch((err) => alert(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, representativeId]);

  if (!isOpen || !representativeId) return null;

  const handleUpdateStatus = async (newStatus: string) => {
    const reason = await requestPrompt(`Enter reason for updating status to ${newStatus}:`);
    if (!reason) return;
    try {
      await api.updateRepStatus(representativeId, newStatus, reason);
      if (onStatusChange) onStatusChange();
      // Reload 360 data
      const updated = await api.getRepresentative360(representativeId);
      setRep360Data(updated);
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    }
  };

  const handleRemoveRepresentative = async () => {
    setIsRemoving(true);
    try {
      await api.deleteRepresentative(representativeId);
      setIsRemoveConfirmOpen(false);
      onClose();
      onStatusChange?.();
    } catch (err: any) {
      alert(err.message || 'Failed to remove representative.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleDownloadDocument = async (url: string, label: string) => {
    try {
      const documentType = label === 'NIC / Passport Copy' ? 'nic-copy' : 'signed-agreement';
      const response = await downloadRepresentativeDocument(representativeId, documentType);
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = blobUrl;
      const extension = new URL(url).pathname.split('.').pop() || 'file';
      link.download = `${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      alert(error.message || 'Document download failed.');
    }
  };

  const handleUploadDocuments = async () => {
    if (!representativeId || (!documentFiles.nic_copy && !documentFiles.signed_agreement)) return;
    setUploadingDocuments(true);
    try {
      const formData = new FormData();
      if (documentFiles.nic_copy) formData.append('nic_copy', documentFiles.nic_copy);
      if (documentFiles.signed_agreement) formData.append('signed_agreement', documentFiles.signed_agreement);
      const response = await api.uploadRepDocuments(representativeId, formData);
      setRep360Data((current: any) => ({ ...current, representative: response.representative }));
      setDocumentFiles({ nic_copy: null, signed_agreement: null });
      onStatusChange?.();
    } catch (error: any) {
      alert(error.message || 'Document upload failed.');
    } finally {
      setUploadingDocuments(false);
    }
  };

  const handleProfilePictureChange = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Profile picture must be 5 MB or smaller.');
      return;
    }
    setProfilePictureFile(file);
  };

  const handleUploadProfilePicture = async () => {
    if (!representativeId || !profilePictureFile) return;
    setUploadingProfilePicture(true);
    try {
      const formData = new FormData();
      formData.append('profile_picture', profilePictureFile);
      const response = await api.uploadRepProfilePicture(representativeId, formData);
      setRep360Data((current: any) => ({ ...current, representative: response.representative }));
      setProfilePictureFile(null);
      onStatusChange?.();
    } catch (error: any) {
      alert(error.message || 'Profile picture upload failed.');
    } finally {
      setUploadingProfilePicture(false);
    }
  };

  const rep = rep360Data?.representative;
  const stats = rep360Data?.stats;
  const auditLogs = rep360Data?.audit_logs || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-900 text-white flex justify-between items-start gap-3 shrink-0">
          <div className="flex min-w-0 items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-sm overflow-hidden">
              {getProfilePictureUrl(rep?.user?.profile_picture_path) || rep?.profile_picture_url ? (
                <img src={(getProfilePictureUrl(rep?.user?.profile_picture_path) || rep?.profile_picture_url) as string} alt="Profile" className="h-full w-full rounded-xl object-cover" />
              ) : rep?.user?.name?.charAt(0) || 'R'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="font-bold text-base break-words">{rep?.user?.name || 'Representative Profile'}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                  {rep?.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 break-words">
                {rep?.representative_id} • {rep?.primary_district?.name} District
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/20 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:bg-white/10">
                  <Upload className="h-3 w-3" />
                  {profilePictureFile?.name || 'Upload photo'}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp" className="hidden" onChange={(event) => handleProfilePictureChange(event.target.files?.[0])} />
                </label>
                {profilePictureFile && (
                  <button type="button" onClick={handleUploadProfilePicture} disabled={uploadingProfilePicture} className="rounded-lg bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-indigo-500 disabled:opacity-50">
                    {uploadingProfilePicture ? 'Uploading...' : 'Save photo'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="modal-scrollbar p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 grow">
          {loading || !rep ? (
            <div className="text-center py-12 text-slate-400">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-xs">Loading 360° Data View...</p>
            </div>
          ) : (
            <>
              {/* 4 Overview Mini-Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Students</span>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.total_leads}</div>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase">Paid Students</span>
                  <div className="text-xl font-bold text-emerald-900 mt-0.5">{stats.paid_students}</div>
                </div>
                <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                  <span className="text-[10px] text-indigo-700 font-bold uppercase">Total Earnings</span>
                  <div className="text-xl font-bold text-indigo-900 mt-0.5">{formatCurrency(stats.total_earnings)}</div>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                  <span className="text-[10px] text-amber-700 font-bold uppercase">Quality Score</span>
                  <div className="text-xl font-bold text-amber-900 mt-0.5">{rep.quality_score}%</div>
                </div>
              </div>

              {/* Status Action Bar */}
              <div className="flex flex-col items-stretch gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold text-slate-700">Account Lifecycle Management:</span>
                <div className="flex flex-wrap gap-2 sm:items-center">
                  {rep.status !== 'active' && (
                    <button
                      onClick={() => handleUpdateStatus('active')}
                      className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg sm:flex-none"
                    >
                      Activate
                    </button>
                  )}
                  {rep.status === 'active' && (
                    <button
                      onClick={() => handleUpdateStatus('suspended')}
                      className="flex-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg sm:flex-none"
                    >
                      Suspend
                    </button>
                  )}
                  {rep.status !== 'terminated' && (
                    <button
                      onClick={() => handleUpdateStatus('terminated')}
                      className="flex-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg sm:flex-none"
                    >
                      Terminate
                    </button>
                  )}
                  <button
                    onClick={() => setIsRemoveConfirmOpen(true)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-rose-700 px-3 py-1.5 font-bold text-white hover:bg-rose-800 sm:flex-none"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove Representative
                  </button>
                </div>
              </div>

              {/* Sub-tab Switcher */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-b border-slate-200 text-center text-xs font-bold sm:flex sm:space-x-6 sm:text-left">
                <button
                  onClick={() => setActiveSubTab('leads')}
                  className={`min-w-0 pb-2 border-b-2 transition-colors ${
                    activeSubTab === 'leads' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
                  }`}
                >
                  Attributed Students ({rep.leads?.length || 0})
                </button>
                <button
                  onClick={() => setActiveSubTab('commissions')}
                  className={`min-w-0 pb-2 border-b-2 transition-colors ${
                    activeSubTab === 'commissions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
                  }`}
                >
                  Commission Ledger ({rep.commissions?.length || 0})
                </button>
                <button
                  onClick={() => setActiveSubTab('bank')}
                  className={`min-w-0 pb-2 border-b-2 transition-colors ${
                    activeSubTab === 'bank' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
                  }`}
                >
                  Bank & Agreement Details
                </button>
                <button
                  onClick={() => setActiveSubTab('audit')}
                  className={`min-w-0 pb-2 border-b-2 transition-colors ${
                    activeSubTab === 'audit' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
                  }`}
                >
                  Compliance Audit Trail ({auditLogs.length})
                </button>
              </div>

              {/* Sub-tab content */}
              {activeSubTab === 'leads' && (
                <div className="mobile-modal-scrollbar divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {rep.leads?.map((l: Lead) => (
                    <div key={l.id} className="flex items-start justify-between gap-2 py-2 text-xs">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900">{l.full_name}</span>
                        <div className="break-words text-[11px] text-slate-400 font-mono">
                          {l.lead_id} • {l.mobile} • {l.course?.title}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          l.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeSubTab === 'commissions' && (
                <div className="mobile-modal-scrollbar divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {rep.commissions?.map((c: Commission) => (
                    <div key={c.id} className="flex items-start justify-between gap-2 py-2 text-xs">
                      <div className="min-w-0">
                        <span className="font-bold font-mono text-slate-900">{c.transaction_id}</span>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {c.type} • {c.effective_date?.split('T')[0]}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-bold text-slate-900">{formatCurrency(c.amount)}</span>
                        <span className="block text-[10px] text-slate-400 uppercase">{c.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSubTab === 'bank' && (
                <div className="space-y-5 rounded-2xl bg-slate-50 p-4 text-xs">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-slate-400 font-medium">Bank Name</span>
                    <p className="font-bold text-slate-900">{rep.bank_name || 'Commercial Bank'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Branch</span>
                    <p className="font-bold text-slate-900">{rep.bank_branch || 'Maharagama'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Account Name</span>
                    <p className="font-bold text-slate-900">{rep.account_name || rep.user?.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Account Number</span>
                    <p className="font-bold font-mono text-indigo-700">{rep.account_number || '8004523910'}</p>
                  </div>
                  </div>
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="mb-3 font-bold text-slate-700">Verification Documents</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        ['NIC / Passport Copy', 'nic_copy', rep.nic_copy_url],
                        ['Signed Agreement', 'signed_agreement', rep.signed_agreement_url],
                      ].map(([label, field, url]) => (
                        <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="mb-2 font-semibold text-slate-700">{label}</p>
                          {url ? (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setPreviewDocument({ label: label as string, url: url as string })} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700">
                                <ExternalLink className="h-3 w-3" /> View
                              </button>
                              <button type="button" onClick={() => handleDownloadDocument(url as string, label as string)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50">
                                <Download className="h-3 w-3" /> Download
                              </button>
                            </div>
                          ) : <span className="text-[11px] text-slate-400">Not uploaded</span>}
                          <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100">
                            <Upload className="h-3 w-3" />
                            <span className="truncate">{documentFiles[field as 'nic_copy' | 'signed_agreement']?.name || (url ? 'Replace document' : 'Choose document')}</span>
                            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,application/pdf" className="hidden" onChange={(event) => setDocumentFiles({ ...documentFiles, [field as 'nic_copy' | 'signed_agreement']: event.target.files?.[0] || null })} />
                          </label>
                        </div>
                      ))}
                    </div>
                    {(documentFiles.nic_copy || documentFiles.signed_agreement) && (
                      <button type="button" onClick={handleUploadDocuments} disabled={uploadingDocuments} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                        <FileText className="h-3.5 w-3.5" />
                        {uploadingDocuments ? 'Uploading...' : 'Upload selected documents'}
                      </button>
                    )}

                    {previewDocument && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={() => setPreviewDocument(null)}>
                        <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                            <h2 className="text-sm font-bold text-slate-900">{previewDocument.label}</h2>
                            <button type="button" onClick={() => setPreviewDocument(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close document preview"><X className="h-5 w-5" /></button>
                          </div>
                          <div className="flex min-h-[55vh] items-center justify-center overflow-auto bg-slate-100 p-4">
                            {previewDocument.url.toLowerCase().endsWith('.pdf') ? (
                              <iframe title={previewDocument.label} src={previewDocument.url} className="h-[70vh] w-full rounded-lg bg-white" />
                            ) : (
                              <img src={previewDocument.url} alt={previewDocument.label} className="max-h-[70vh] max-w-full rounded-lg object-contain" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSubTab === 'audit' && (
                <div className="mobile-modal-scrollbar space-y-2 max-h-60 overflow-y-auto">
                  {auditLogs.map((log: AuditLog) => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-indigo-700 capitalize">{log.action}</span>
                        <span className="text-[10px] text-slate-400">{log.created_at?.split('T')[0]}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{log.reason || 'System action logged'}</p>
                      <div className="text-[10px] text-slate-400 mt-1">Actor: {log.user_name} ({log.role})</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-3 sm:px-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl shadow-xs"
          >
            {t('close')}
          </button>
        </div>
      </div>

      {isRemoveConfirmOpen && rep && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md">
          <div role="alertdialog" aria-modal="true" className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-4 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300"><Trash2 className="h-5 w-5" /></div>
              <div className="flex-1"><h2 className="text-sm font-bold">Remove Representative</h2><p className="text-[11px] text-slate-300">Ziveka Online Campus</p></div>
              <button type="button" onClick={() => setIsRemoveConfirmOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 px-5 py-6 text-sm text-slate-700">
              <p>Are you sure you want to remove this representative?</p>
              <p className="font-bold text-slate-900">{rep.user?.name}</p>
              <p className="text-xs text-rose-700">This removes the representative account, referral codes, and directory record.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
              <button type="button" onClick={() => setIsRemoveConfirmOpen(false)} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200">Cancel</button>
              <button type="button" disabled={isRemoving} onClick={handleRemoveRepresentative} className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" /> {isRemoving ? 'Removing...' : 'Yes, Remove Representative'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
