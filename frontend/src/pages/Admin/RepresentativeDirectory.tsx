import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import logoImg from '../../assets/logo.jpeg';
import { createBrandedPdf, brandedTable, finishBrandedPdf } from '../../services/brandedPdf';
import { Representative, District } from '../../types';
import { api } from '../../services/api';
import { getProfilePictureUrl } from '../../services/api';
import { Representative360Modal } from './Representative360Modal';
import { citiesByDistrictCode } from '../../data/citiesByDistrict';
import { Search, UserCheck, Plus, Eye, Filter, ShieldCheck, MapPin, Award, Percent, Upload, X, Download, FileText } from 'lucide-react';

interface RepresentativeDirectoryProps {
  representatives: Representative[];
  districts: District[];
  onRefresh: () => void;
}

export const RepresentativeDirectory: React.FC<RepresentativeDirectoryProps> = ({
  representatives,
  districts,
  onRefresh,
}) => {
  const { t, formatCurrency } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboarding, setOnboarding] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    primary_district_id: districts[0]?.id || 1,
    city: '',
    profile_picture: null as File | null,
    nic_passport: '',
    nic_copy: null as File | null,
    signed_agreement: null as File | null,
    bank_name: 'Commercial Bank of Ceylon',
    bank_branch: 'Main Branch',
    account_name: '',
    account_number: '',
  });

  const selectedDistrict = districts.find((district) => district.id === formData.primary_district_id);
  const cityOptions = selectedDistrict
    ? citiesByDistrictCode[selectedDistrict.code] || [{ name: selectedDistrict.name, name_si: selectedDistrict.name_si || '' }]
    : [];

  const filtered = representatives.filter((rep) => {
    const matchesSearch =
      rep.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.representative_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.user?.mobile?.includes(searchTerm);

    const matchesDistrict = districtFilter === 'all' || String(rep.primary_district_id) === districtFilter;
    return matchesSearch && matchesDistrict;
  });

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
    setFormData({ ...formData, profile_picture: file });
  };

  const handleDocumentChange = (field: 'nic_copy' | 'signed_agreement', file: File | undefined) => {
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a PDF or image file (JPG, JPEG, PNG, WebP, GIF or BMP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Document must be 5 MB or smaller.');
      return;
    }
    setFormData({ ...formData, [field]: file });
  };

  const exportRows = filtered.map((rep) => [
    rep.representative_id,
    rep.user?.name || '',
    rep.user?.email || '',
    rep.user?.mobile || '',
    rep.primary_district?.name || '',
    rep.city || '',
    rep.status,
    rep.paid_students_count || 0,
    rep.active_referral_code?.code || '',
  ]);

  const escapeCSV = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const handleExportCSV = () => {
    const headers = ['Representative ID', 'Name', 'Email', 'Mobile', 'District', 'City', 'Status', 'Paid Students', 'Referral Code'];
    const csv = [headers, ...exportRows].map((row) => row.map((value) => escapeCSV(String(value))).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'ziveka-representatives.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportPDF = async () => {
    const { pdf, drawHeader, drawFooter } = await createBrandedPdf({ title: 'Ziveka Representative Directory', subtitle: `Filtered representatives: ${filtered.length}`, logoUrl: logoImg });
    brandedTable(pdf, {
      head: [['Representative ID', 'Name', 'Email', 'Mobile', 'District', 'City', 'Status', 'Paid Students', 'Referral Code']],
      body: exportRows,
    });
    finishBrandedPdf(pdf, drawHeader, drawFooter, 'ziveka-representatives.pdf');
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboarding(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) payload.append(key, value);
        else if (value !== null && value !== undefined) payload.append(key, String(value));
      });
      await api.createRepresentative(payload);
      setShowOnboardModal(false);
      onRefresh();
      setFormData({
        name: '',
        email: '',
        mobile: '',
        primary_district_id: districts[0]?.id || 1,
        city: '',
        profile_picture: null,
        nic_passport: '',
        nic_copy: null,
        signed_agreement: null,
        bank_name: 'Commercial Bank of Ceylon',
        bank_branch: 'Main Branch',
        account_name: '',
        account_number: '',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to onboard representative');
    } finally {
      setOnboarding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('navRepresentatives')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Regional representative network, 360° student funnel view, quality scoring, and payout statuses
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50 px-3.5 py-2.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative grow">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search representative by name, ID, email, mobile..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
        >
          <option value="all">All 25 Districts</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>
      </div>

      {/* Representatives Cards Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map((rep) => (
          <div
            key={rep.id}
            className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-sm text-indigo-700 overflow-hidden">
                    {getProfilePictureUrl(rep.user?.profile_picture_path) || rep.profile_picture_url ? (
                      <img src={(getProfilePictureUrl(rep.user?.profile_picture_path) || rep.profile_picture_url) as string} alt="" className="h-full w-full object-cover" />
                    ) : rep.user?.name?.charAt(0) || 'R'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{rep.user?.name}</h3>
                    <span className="text-[10px] font-mono text-indigo-600 font-semibold">
                      {rep.representative_id}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    rep.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : rep.status === 'under_review'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {rep.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    District: <strong className="text-slate-900">{rep.primary_district?.name}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Quality Score: <strong className="text-emerald-700">{rep.quality_score}%</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-500">
                  <span>Ref: {rep.active_referral_code?.code || 'ZV-CMB-DEMO'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px]">Paid Students</span>
                <span className="font-bold text-slate-900">{rep.paid_students_count || 0} enrolled</span>
              </div>
              <button
                onClick={() => setSelectedRepId(rep.id)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t('view360')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 360-degree Modal */}
      {selectedRepId && (
        <Representative360Modal
          isOpen={!!selectedRepId}
          onClose={() => setSelectedRepId(null)}
          representativeId={selectedRepId}
          onStatusChange={onRefresh}
        />
      )}

      {/* Onboard Representative Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">{t('onboardRep')}</h3>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleOnboardSubmit} className="p-6 overflow-y-auto space-y-4 grow">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('fullName')} *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kasun Chamara"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Profile Picture</label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 hover:border-indigo-400 hover:bg-indigo-50/40">
                  {formData.profile_picture ? (
                    <img src={URL.createObjectURL(formData.profile_picture)} alt="Profile preview" className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Upload className="h-5 w-5" /></span>
                  )}
                  <span className="min-w-0 text-xs text-slate-600">
                    <span className="block font-semibold text-slate-700">Choose profile picture</span>
                    <span className="block truncate text-[11px] text-slate-400">JPG, JPEG, PNG, WebP, GIF or BMP up to 5 MB</span>
                  </span>
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleProfilePictureChange(e.target.files?.[0])} />
                </label>
                {formData.profile_picture && (
                  <button type="button" onClick={() => setFormData({ ...formData, profile_picture: null })} className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700">
                    <X className="h-3 w-3" /> Remove picture
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('emailAddress')} *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rep@zivekacampus.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('mobileNumber')} *</label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="0771234567"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('selectDistrict')} *</label>
                  <select
                    value={formData.primary_district_id}
                    onChange={(e) => setFormData({ ...formData, primary_district_id: Number(e.target.value), city: '' })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.name_si ? `(${d.name_si})` : ''} - {d.province}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('selectCity')} *</label>
                  <select
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="">{t('selectCity')}</option>
                    {cityOptions.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name} {city.name_si ? `(${city.name_si})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('nicNumber')}</label>
                <input
                  type="text"
                  value={formData.nic_passport}
                  onChange={(e) => setFormData({ ...formData, nic_passport: e.target.value })}
                  placeholder="199214502340"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {([
                  ['nic_copy', 'NIC / Passport Copy'],
                  ['signed_agreement', 'Signed Agreement'],
                ] as const).map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{label} <span className="font-normal text-slate-400">(optional)</span></label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 hover:border-indigo-400 hover:bg-indigo-50/40">
                      <Upload className="h-4 w-4 shrink-0 text-indigo-600" />
                      <span className="min-w-0 truncate text-xs text-slate-600">{formData[field]?.name || 'Choose document'}</span>
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.pdf,image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={(e) => handleDocumentChange(field, e.target.files?.[0])} />
                    </label>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">PDF or image, max 5 MB</span>
                      {formData[field] && <button type="button" onClick={() => setFormData({ ...formData, [field]: null })} className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 hover:text-rose-700"><X className="h-3 w-3" /> Remove</button>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('bankName')}</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('accountNumber')}</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="8004523910"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={onboarding}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                >
                  {onboarding ? t('loading') : 'Complete Onboarding & Generate Codes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
