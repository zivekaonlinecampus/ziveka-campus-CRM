import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Scholarship, District, Course } from '../../types';
import { api } from '../../services/api';
import { Award, Plus, CheckCircle, Clock, AlertCircle, Sparkles } from 'lucide-react';

interface RepScholarshipsProps {
  scholarships: Scholarship[];
  districts: District[];
  courses: Course[];
  onScholarshipSubmitted: (scholarship: Scholarship) => void;
}

export const RepScholarships: React.FC<RepScholarshipsProps> = ({
  scholarships,
  districts,
  courses,
  onScholarshipSubmitted,
}) => {
  const { t, formatCurrency } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    applicant_name: '',
    nic_passport: '',
    district_id: districts[0]?.id || 1,
    course_id: courses[0]?.id || 1,
    financial_need_summary: '',
    academic_motivation: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.submitScholarship(formData);
      onScholarshipSubmitted(res.scholarship);
      setShowModal(false);
      setFormData({
        applicant_name: '',
        nic_passport: '',
        district_id: districts[0]?.id || 1,
        course_id: courses[0]?.id || 1,
        financial_need_summary: '',
        academic_motivation: '',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to submit nomination');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold mb-1">
            <Award className="w-4 h-4" />
            <span>Social Impact & Community Empowerment</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">{t('navMyScholarships')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Nominate deserving students from your district for 100% full tuition fee waivers
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nominate Candidate</span>
        </button>
      </div>

      {/* Quota Policy Reminder */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs text-indigo-900 space-y-1">
        <div className="font-bold flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Scholarship Policy</span>
        </div>
        <p className="text-[11px] text-indigo-800 leading-relaxed">
          Approved scholarships receive a 100% fee waiver (LKR 10,000 Registration + LKR 30,000 Course Fee). Scholarship students contribute +1 to your Social Impact KPI and are excluded from paid commission calculations.
        </p>
      </div>

      {/* Scholarships List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {scholarships.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No scholarship nominations submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Applicant Name</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4 text-right">Fee Waiver Value</th>
                  <th className="py-3 px-4 text-center">Committee Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scholarships.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{s.application_id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.applicant_name}</div>
                      {s.nic_passport && (
                        <div className="text-[10px] text-slate-400 font-mono">NIC: {s.nic_passport}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{s.course?.title}</td>
                    <td className="py-3 px-4 text-slate-600">{s.district?.name}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(s.waiver_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          s.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'under_review' || s.status === 'submitted'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nomination Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Nominate Scholarship Candidate</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 grow">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('fullName')} *</label>
                <input
                  type="text"
                  required
                  value={formData.applicant_name}
                  onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                  placeholder="e.g. Achini Jayawardena"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('nicNumber')}</label>
                  <input
                    type="text"
                    value={formData.nic_passport}
                    onChange={(e) => setFormData({ ...formData, nic_passport: e.target.value })}
                    placeholder="200389004510"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('selectDistrict')}</label>
                  <select
                    value={formData.district_id}
                    onChange={(e) => setFormData({ ...formData, district_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('selectCourse')}</label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('financialNeedReason')} *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.financial_need_summary}
                  onChange={(e) => setFormData({ ...formData, financial_need_summary: e.target.value })}
                  placeholder="Explain household income status and financial hardships..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('academicAspiration')}</label>
                <textarea
                  rows={2}
                  value={formData.academic_motivation}
                  onChange={(e) => setFormData({ ...formData, academic_motivation: e.target.value })}
                  placeholder="Educational background, GCE A/L achievements, career goals..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                >
                  {submitting ? t('loading') : 'Submit for Committee Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
