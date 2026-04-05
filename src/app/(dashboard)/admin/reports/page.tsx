"use client"
import React, { useState, useEffect } from 'react';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ───
interface ReportEmployee {
  id: string;
  name: string;
  fullName?: string;
  platform?: string;
}

interface Report {
  id: string;
  tiktokUrl?: string;
  dateString?: string;
  status: string;
  submittedAt: string;
  employee?: ReportEmployee;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(API_URL + '/reports', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => { setReports(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { console.error('فشل جلب التقارير:', err); setLoading(false); });
  }, []);

  const filtered = reports.filter(r => {
    const dateMatch = filterDate ? r.dateString === filterDate : true;
    const statusMatch = filterStatus === 'ALL' ? true : r.status === filterStatus;
    return dateMatch && statusMatch;
  });

  const approvedCount = filtered.filter(r => r.status === 'APPROVED' || r.status === 'ON_TIME').length;
  const pendingCount = filtered.filter(r => r.status === 'PENDING').length;
  const rejectedCount = filtered.filter(r => r.status === 'REJECTED').length;
  const missedCount = filtered.filter(r => r.status === 'MISSED').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="bg-success/10 text-success px-3 py-1 rounded-full text-xs font-bold">معتمد ✅</span>;
      case 'ON_TIME': return <span className="bg-success/10 text-success px-3 py-1 rounded-full text-xs font-bold">ملتزم ✓</span>;
      case 'PENDING': return <span className="bg-warning/10 text-warning px-3 py-1 rounded-full text-xs font-bold">بانتظار المراجعة ⏳</span>;
      case 'REJECTED': return <span className="bg-error/10 text-error px-3 py-1 rounded-full text-xs font-bold">مرفوض ❌</span>;
      case 'MISSED': return <span className="bg-error/10 text-error px-3 py-1 rounded-full text-xs font-bold">مفقود ✗</span>;
      default: return <span className="bg-surfaceContainerHigh text-onSurfaceVariant px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">سجل التقارير والإحصائيات</h1>
          <p className="text-onSurfaceVariant text-sm">متابعة جميع الروابط المرفوعة يومياً ومعرفة مستوى التزام كل موظف</p>
        </div>
        <button onClick={() => window.print()} className="no-print gradient-bg text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all hover:-translate-y-1">
          <span>🖨️</span> تصدير PDF
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-5 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-primary"></div>
          <span className="text-xs text-onSurfaceVariant block mb-2">إجمالي التقارير</span>
          <span className="text-3xl font-bold text-primary">{filtered.length}</span>
        </div>
        <div className="glass-card p-5 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-success"></div>
          <span className="text-xs text-onSurfaceVariant block mb-2">معتمد / ملتزم</span>
          <span className="text-3xl font-bold text-success">{approvedCount}</span>
        </div>
        <div className="glass-card p-5 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-warning"></div>
          <span className="text-xs text-onSurfaceVariant block mb-2">بانتظار المراجعة</span>
          <span className="text-3xl font-bold text-warning">{pendingCount}</span>
        </div>
        <div className="glass-card p-5 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-error"></div>
          <span className="text-xs text-onSurfaceVariant block mb-2">مرفوض</span>
          <span className="text-3xl font-bold text-error">{rejectedCount}</span>
        </div>
        <div className="glass-card p-5 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-tertiary"></div>
          <span className="text-xs text-onSurfaceVariant block mb-2">مفقود</span>
          <span className="text-3xl font-bold text-tertiary">{missedCount}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4">
        <span className="text-sm font-bold text-onSurfaceVariant">تصفية:</span>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-surfaceContainerLow p-2 rounded-xl border border-outlineVariant/20 outline-none text-sm" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-surfaceContainerLow p-2 rounded-xl border border-outlineVariant/20 outline-none text-sm font-bold cursor-pointer">
          <option value="ALL">كل الحالات</option>
          <option value="APPROVED">معتمد ✅</option>
          <option value="ON_TIME">ملتزم ✓</option>
          <option value="PENDING">بانتظار المراجعة ⏳</option>
          <option value="REJECTED">مرفوض ❌</option>
          <option value="MISSED">مفقود ✗</option>
        </select>
        {(filterDate || filterStatus !== 'ALL') && <button onClick={() => { setFilterDate(''); setFilterStatus('ALL'); }} className="text-xs text-primary font-bold hover:underline">إظهار الكل</button>}
      </div>

      {/* Table */}
      <div className="glass-card p-6 min-h-[400px]">
        {loading ? <p className="text-onSurfaceVariant text-center p-10">جاري التحميل...</p> : filtered.length === 0 ? (
          <div className="text-center p-20 text-onSurfaceVariant flex flex-col items-center">
            <span className="text-5xl mb-4 opacity-40">📊</span>
            <p>لا توجد تقارير.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-outlineVariant/20 text-onSurfaceVariant text-sm">
                  <th className="p-4 font-medium">#</th>
                  <th className="p-4 font-medium">التاريخ</th>
                  <th className="p-4 font-medium">الموظف</th>
                  <th className="p-4 font-medium">المنصة</th>
                  <th className="p-4 font-medium">الحالة</th>
                  <th className="p-4 font-medium">الرابط</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((report, idx) => (
                  <tr key={report.id || idx} className="border-b border-outlineVariant/10 hover:bg-surfaceContainerLow transition-colors">
                    <td className="p-4 text-xs text-onSurfaceVariant">{idx + 1}</td>
                    <td className="p-4 text-sm">{new Date(report.submittedAt).toLocaleString('ar-EG')}</td>
                    <td className="p-4 font-bold text-sm">{report.employee?.fullName || report.employee?.name || 'غير معروف'}</td>
                    <td className="p-4"><span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded font-bold">{report.employee?.platform || '-'}</span></td>
                    <td className="p-4">{getStatusBadge(report.status)}</td>
                    <td className="p-4">
                      {report.tiktokUrl ? (
                        <a href={report.tiktokUrl.startsWith('http') ? report.tiktokUrl : `https://${report.tiktokUrl}`} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs dir-ltr inline-block truncate max-w-[180px] font-bold" dir="ltr">{report.tiktokUrl}</a>
                      ) : <span className="text-onSurfaceVariant text-sm">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
