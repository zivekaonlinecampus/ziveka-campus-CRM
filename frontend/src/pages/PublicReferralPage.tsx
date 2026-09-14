import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { District, Course, Representative } from '../types';
import { api } from '../services/api';
import { citiesByDistrictCode } from '../data/citiesByDistrict';
import { ShieldCheck, CheckCircle, ArrowLeft, Award, Sparkles, Send } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';
import confetti from 'canvas-confetti';

interface PublicReferralPageProps {
  referralCodeFromUrl?: string;
  onBackToPortal: () => void;
  districts: District[];
  courses: Course[];
}

export const PublicReferralPage: React.FC<PublicReferralPageProps> = ({
  referralCodeFromUrl = 'ZV-CMB-KASUN',
  onBackToPortal,
  districts,
  courses,
}) => {
  const { t, language, setLanguage, formatCurrency } = useLanguage();
  const [refCode, setRefCode] = useState(referralCodeFromUrl);
  const [representative, setRepresentative] = useState<Representative | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    email: '',
    district_id: districts[0]?.id || 1,
    city: '',
    course_id: courses[0]?.id || 1,
    preferred_language: 'en',
    notes: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (refCode) {
      api.checkReferral(refCode)
        .then((res) => {
          if (res.valid) {
            setRepresentative(res.representative);
          }
        })
        .catch(() => {});
    }
  }, [refCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitPublicLead({
        ...formData,
        referral_code: refCode,
      });

      setSubmitted(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      alert(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden font-sans">
      {/* Top Banner & Language */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={logoImg} alt="Ziveka Campus" className="h-10 w-auto rounded-md object-contain" />
            <div>
              <h1 className="font-bold text-sm text-white tracking-tight">{t('appName')}</h1>
              <p className="text-[11px] text-slate-400">Official Programme Admissions</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 text-xs font-bold rounded-md ${language === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('si')}
                className={`px-2 py-0.5 text-xs font-bold rounded-md ${language === 'si' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                සිං
              </button>
            </div>
            <button
              onClick={onBackToPortal}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Staff CRM</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero & Form Container */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Info Column */}
          <div className="md:col-span-5 space-y-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-3">
                Intake 2026-Q3 Open
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Empowering Regional Leaders with Global Qualifications
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Join Ziveka Online Campus for accredited dual-qualification diplomas in Business, IT, English, and Tourism with verified representative guidance and scholarship opportunities.
              </p>
            </div>

            {/* Representative Attribution Badge */}
            {representative && (
              <div className="p-4 rounded-2xl bg-indigo-950/70 border border-indigo-500/40 backdrop-blur-md">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Representative Attribution</span>
                </div>
                <div className="font-bold text-sm text-white">{representative.user?.name}</div>
                <div className="text-xs text-indigo-200">District: {representative.primary_district?.name}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">Code: {refCode}</div>
              </div>
            )}

            {/* Program Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-2 text-xs text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Standard tuition: LKR 40,000 (Reg LKR 10,000 + Course LKR 30,000)</span>
              </div>
              <div className="flex items-start space-x-2 text-xs text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Full scholarship quotas available for eligible students</span>
              </div>
              <div className="flex items-start space-x-2 text-xs text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Live online interactive classes with LMS video recording access</span>
              </div>
            </div>
          </div>

          {/* Right Lead Intake Form */}
          <div className="md:col-span-7">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              {submitted ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Application Received!</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    Thank you, <span className="font-bold text-white">{formData.full_name}</span>. Your details have been linked with your regional representative. Our Admissions Counsellor will contact you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        full_name: '',
                        mobile: '',
                        email: '',
                        district_id: districts[0]?.id || 1,
                        city: '',
                        course_id: courses[0]?.id || 1,
                        preferred_language: 'en',
                        notes: '',
                      });
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-lg"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="border-b border-slate-800 pb-3 mb-2">
                    <h3 className="font-bold text-base text-white">Prospective Student Enrolment Form</h3>
                    <p className="text-xs text-slate-400">Fill in your contact details for counselling</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t('fullName')} *</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="e.g. Kasun Chamara"
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">{t('mobileNumber')} *</label>
                      <input
                        type="tel"
                        required
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="0771234567"
                        className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">{t('emailAddress')}</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="student@gmail.com"
                        className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">{t('selectDistrict')} *</label>
                      <select
                        value={formData.district_id}
                        onChange={(e) => setFormData({ ...formData, district_id: Number(e.target.value), city: '' })}
                        className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} {d.name_si ? `(${d.name_si})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">{t('selectCity')} *</label>
                      <select
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">{t('selectCity')}</option>
                        {(citiesByDistrictCode[districts.find((district) => district.id === formData.district_id)?.code || ''] || []).map((city) => (
                          <option key={city.name} value={city.name}>{city.name} {city.name_si ? `(${city.name_si})` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">{t('selectCourse')} *</label>
                      <select
                        value={formData.course_id}
                        onChange={(e) => setFormData({ ...formData, course_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t('notesRemarks')}</label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Interested in weekend batch, scholarship inquiry, or career change goals..."
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <span>Submit Registration & Inquire</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
