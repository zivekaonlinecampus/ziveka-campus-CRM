import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { District, Course, Lead } from '../types';
import { api } from '../services/api';
import { citiesByDistrictCode } from '../data/citiesByDistrict';
import { X, AlertTriangle, CheckCircle2, UserPlus, Sparkles, ChevronDown, Check } from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: (lead: Lead) => void;
  districts: District[];
  courses: Course[];
  defaultReferralCode?: string;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated,
  districts,
  courses,
  defaultReferralCode,
}) => {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    full_name: '',
    preferred_name: '',
    mobile: '',
    email: '',
    nic_passport: '',
    district_id: districts[0]?.id || 1,
    city: '',
    course_ids: courses[0]?.id ? [courses[0].id] : [],
    course_id: courses[0]?.id || 1,
    intake: '2026-Q3',
    preferred_language: 'en',
    notes: '',
    referral_code: defaultReferralCode || '',
  });

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false);
  const selectedDistrict = districts.find((district) => district.id === formData.district_id);
  const cityOptions = selectedDistrict
    ? citiesByDistrictCode[selectedDistrict.code] || [{ name: selectedDistrict.name, name_si: selectedDistrict.name_si || '' }]
    : [];

  useEffect(() => {
    if (defaultReferralCode) {
      setFormData((prev) => ({ ...prev, referral_code: defaultReferralCode }));
    }
  }, [defaultReferralCode]);

  // Real-time duplicate check with debounce
  useEffect(() => {
    if (formData.mobile.length >= 9 || (formData.nic_passport && formData.nic_passport.length >= 9)) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.checkDuplicate({
            mobile: formData.mobile,
            nic_passport: formData.nic_passport,
            email: formData.email,
            full_name: formData.full_name,
            district_id: formData.district_id,
          });

          if (res.is_duplicate) {
            setDuplicateWarning(
              `Duplicate detected: A lead with this ${res.match_type?.replace('_', ' ')} already exists (${res.existing_lead?.lead_id} - ${res.existing_lead?.full_name}).`
            );
          } else {
            setDuplicateWarning(null);
          }
        } catch (_) {}
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setDuplicateWarning(null);
    }
  }, [formData.mobile, formData.nic_passport, formData.email, formData.full_name, formData.district_id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    const mobile = formData.mobile.replace(/[\s-]/g, '');
    const email = formData.email.trim();
    const nic = formData.nic_passport.trim();

    if (!formData.full_name.trim()) errors.push('First Name is required.');
    if (!formData.preferred_name.trim()) errors.push('Last Name is required.');
    if (!/^(?:0\d{9}|\+94\d{9})$/.test(mobile)) errors.push('Enter a valid Sri Lankan mobile number.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Enter a valid email address.');
    if (nic && !/^(?:\d{12}|\d{9}[VXvx])$/.test(nic)) errors.push('Enter a valid NIC or passport number.');
    if (!districts.some((district) => district.id === formData.district_id)) errors.push('Select a valid district.');
    if (!formData.city || !cityOptions.some((city) => city.name === formData.city)) errors.push('Select a city for the selected district.');
    if (formData.course_ids.length === 0) errors.push('Select at least one course.');
    if (formData.notes.length > 1000) errors.push('Notes must be 1000 characters or fewer.');

    setValidationErrors(errors);
    if (errors.length > 0) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.createLead({
        ...formData,
        full_name: formData.full_name.trim(),
        preferred_name: formData.preferred_name.trim(),
        mobile,
        email: email || undefined,
        nic_passport: nic || undefined,
        notes: formData.notes.trim() || undefined,
      });
      onLeadCreated(res.lead);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to submit lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/50 flex items-center justify-center text-amber-300">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">{t('addLead')}</h3>
              <p className="text-xs text-slate-300">Quick Mobile Enrolment Form</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 grow">
          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">{t('dupAlertTitle')}</div>
                <div>{duplicateWarning}</div>
              </div>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800" role="alert">
              <div className="font-bold">Please correct the following:</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {validationErrors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('firstName')} *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. Kasun"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('lastName')} *
              </label>
              <input
                type="text"
                required
                value={formData.preferred_name}
                onChange={(e) => setFormData({ ...formData, preferred_name: e.target.value })}
                placeholder="e.g. Perera"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('mobileNumber')} *
              </label>
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="0771234567"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('emailAddress')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@gmail.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('selectDistrict')} *
              </label>
              <select
                value={formData.district_id}
                onChange={(e) => setFormData({ ...formData, district_id: Number(e.target.value), city: '' })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.name_si ? `(${d.name_si})` : ''} - {d.province}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('selectCity')} *
              </label>
              <select
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('nicNumber')}
              </label>
              <input
                type="text"
                value={formData.nic_passport}
                onChange={(e) => setFormData({ ...formData, nic_passport: e.target.value })}
                placeholder="200112345678 or 981234567V"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('selectCourse')} *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCourseMenuOpen(!isCourseMenuOpen)}
                  className="w-full px-3 py-2 text-xs text-left border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white flex items-center justify-between"
                >
                  <span className={formData.course_ids.length ? 'text-slate-700 truncate' : 'text-slate-400'}>
                    {formData.course_ids.length
                      ? `${formData.course_ids.length} course${formData.course_ids.length === 1 ? '' : 's'} selected`
                      : 'Select courses'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
                {isCourseMenuOpen && (
                  <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                    {courses.map((course) => {
                      const isSelected = formData.course_ids.includes(course.id);
                      return (
                        <label
                          key={course.id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-700 hover:bg-indigo-50"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              const courseIds = isSelected
                                ? formData.course_ids.filter((id) => id !== course.id)
                                : [...formData.course_ids, course.id];
                              setFormData({ ...formData, course_ids: courseIds, course_id: courseIds[0] || 0 });
                            }}
                            className="sr-only"
                          />
                          <span className={`flex h-4 w-4 items-center justify-center rounded border ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </span>
                          <span className="truncate">{course.title}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('notesRemarks')}
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Career goals, preferred batch timings, special requirements..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? t('loading') : t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
