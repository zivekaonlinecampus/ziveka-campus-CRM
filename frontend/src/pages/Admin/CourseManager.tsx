import React, { useState } from 'react';
import logoImg from '../../assets/logo.jpeg';
import { createBrandedPdf, brandedTable, finishBrandedPdf } from '../../services/brandedPdf';
import { Course } from '../../types';
import { api } from '../../services/api';
import { BookOpen, Download, FileText, Plus, Power } from 'lucide-react';

interface CourseManagerProps {
  courses: Course[];
  onRefresh: () => void;
}

export const CourseManager: React.FC<CourseManagerProps> = ({ courses, onRefresh }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [form, setForm] = useState({
    title: '', title_si: '', code: '', registration_fee: 10000, course_fee: 30000,
    duration: '6 Months', delivery_mode: 'Online Live', description: '',
  });

  const createCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await api.createCourse(form);
      setForm({ title: '', title_si: '', code: '', registration_fee: 10000, course_fee: 30000, duration: '6 Months', delivery_mode: 'Online Live', description: '' });
      setIsAdding(false);
      onRefresh();
    } catch (error: any) {
      alert(error.message || 'Failed to add course.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCourse = async (course: Course) => {
    try {
      await api.updateCourseStatus(course.id, !course.is_active);
      onRefresh();
    } catch (error: any) {
      alert(error.message || 'Failed to update course.');
    }
  };

  const filteredCourses = courses.filter((course) => statusFilter === 'all' || (statusFilter === 'active' ? course.is_active : !course.is_active));

  const exportRows = filteredCourses.map((course) => [
    course.code,
    course.title,
    course.title_si || '',
    course.duration,
    course.delivery_mode,
    course.registration_fee,
    course.course_fee,
    course.total_fee,
    course.is_active ? 'Active' : 'Inactive',
  ]);

  const escapeCSV = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const handleExportCSV = () => {
    const headers = ['Course Code', 'Course Title', 'Sinhala Title', 'Duration', 'Delivery Mode', 'Registration Fee', 'Course Fee', 'Total Fee', 'Status'];
    const csv = [headers, ...exportRows]
      .map((row) => row.map((value) => escapeCSV(String(value))).join(','))
      .join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'ziveka-courses.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportPDF = async () => {
    const { pdf, drawHeader, drawFooter } = await createBrandedPdf({ title: 'Ziveka Course Management', subtitle: `Courses: ${courses.length}`, logoUrl: logoImg });
    brandedTable(pdf, {
      head: [['Code', 'Course Title', 'Sinhala Title', 'Duration', 'Delivery', 'Registration Fee', 'Course Fee', 'Total Fee', 'Status']],
      body: exportRows,
    });
    finishBrandedPdf(pdf, drawHeader, drawFooter, 'ziveka-courses.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Course Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Add and manage courses available in student enrolment forms.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
            aria-label="Filter courses by status"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={handleExportCSV} className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl">
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>
          <button onClick={handleExportPDF} className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 text-xs font-bold rounded-xl">
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button onClick={() => setIsAdding(!isAdding)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl">
            <Plus className="w-4 h-4" /> Add Course
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={createCourse} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['title', 'Course Title', 'text'], ['title_si', 'Sinhala Title', 'text'], ['code', 'Course Code', 'text'],
              ['duration', 'Duration', 'text'], ['delivery_mode', 'Delivery Mode', 'text'],
            ].map(([key, label, type]) => (
              <label key={key} className="text-xs font-semibold text-slate-700">
                {label}{['title', 'title_si', 'code'].includes(key) && <span className="text-rose-500"> *</span>}
                <input required type={type} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl font-normal" />
              </label>
            ))}
            <label className="text-xs font-semibold text-slate-700">Registration Fee (LKR) <span className="text-rose-500">*</span><input required type="number" min="0" value={form.registration_fee} onChange={(e) => setForm({ ...form, registration_fee: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl font-normal" /></label>
            <label className="text-xs font-semibold text-slate-700">Course Fee (LKR) <span className="text-rose-500">*</span><input required type="number" min="0" value={form.course_fee} onChange={(e) => setForm({ ...form, course_fee: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl font-normal" /></label>
          </div>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs" rows={2} />
          <button disabled={isSaving} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Course'}</button>
        </form>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100">
        {filteredCourses.map((course) => (
          <div key={course.id} className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3"><BookOpen className="w-5 h-5 text-indigo-600 mt-0.5" /><div><div className="font-bold text-sm text-slate-900">{course.title} {course.title_si && <span className="font-normal text-slate-400">({course.title_si})</span>}</div><div className="text-xs text-slate-500">{course.code} · LKR {Number(course.total_fee).toLocaleString()} · {course.duration}</div></div></div>
            <button onClick={() => toggleCourse(course)} className={`course-status-toggle inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${course.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}><Power className="w-3.5 h-3.5" />{course.is_active ? 'Active' : 'Inactive'}</button>
          </div>
        ))}
        {filteredCourses.length === 0 && (
          <div className="py-10 text-center text-xs text-slate-400">No courses found for this status.</div>
        )}
      </div>
    </div>
  );
};
