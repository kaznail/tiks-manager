"use client"
import React, { useState, useEffect, useMemo } from 'react';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ───
interface Report {
  id: string;
  tiktokUrl?: string;
  dateString?: string;
  status: string;
  submittedAt: string;
}

export default function EmployeeReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  
  const getUserId = useMemo(() => {
    return (): string | null => {
      try {
        const token = getToken();
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload?.sub || payload?.id || null;
      } catch (err) {
        console.error('فشل فك تشفير التوكن:', err);
        return null;
      }
    };
  }, []);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) { setLoading(false); return; }
    fetch(API_URL + '/users/' + userId, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setReports(Array.isArray(data.reports) ? data.reports : []);
        setLoading(false);
      })
      .catch((err) => { console.error('فشل جلب التقارير:', err); setLoading(false); });
  }, [getUserId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="bg-success/10 text-success px-3 py-1.5 rounded-full text-xs font-bold border border-success/20">معتمد ✅</span>;
      case 'ON_TIME': return <span className="bg-success/10 text-success px-3 py-1.5 rounded-full text-xs font-bold border border-success/20">ملتزم ✓</span>;
      case 'PENDING': return <span className="bg-warning/10 text-warning px-3 py-1.5 rounded-full text-xs font-bold border border-warning/20 animate-pulse">بانتظار المراجعة ⏳</span>;
      case 'REJECTED': return <span className="bg-error/10 text-error px-3 py-1.5 rounded-full text-xs font-bold border border-error/20">مرفوض ❌</span>;
      case 'MISSED': return <span className="bg-error/10 text-error px-3 py-1.5 rounded-full text-xs font-bold border border-error/20">متأخر ✗</span>;
      default: return <span className="bg-surfaceContainerHigh text-onSurfaceVariant px-3 py-1.5 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const approvedCount = reports.filter(r => r.status === 'APPROVED' || r.status === 'ON_TIME').length;
  const pendingCount = reports.filter(r => r.status === 'PENDING').length;
  const rejectedCount = reports.filter(r => r.status === 'REJECTED').length;

  if (loading) return <div className="p-8 text-onSurfaceVariant">جاري تحميل التقارير...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in duration-500 pb-10">
      <header>
        <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">تقاريري</h1>
        <p className="text-onSurfaceVariant text-sm">سجل جميع التقارير التي أرسلتها وحالتها الحالية</p>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4 border-none text-center">
          <span className="text-2xl font-black text-primary block">{reports.length}</span>
          <span className="text-[10px] text-onSurfaceVariant font-bold">إجمالي</span>
        </div>
        <div className="glass-card p-4 border-none text-center">
          <span className="text-2xl font-black text-success block">{approvedCount}</span>
          <span className="text-[10px] text-onSurfaceVariant font-bold">معتمد</span>
        </div>
        <div className="glass-card p-4 border-none text-center">
          <span className="text-2xl font-black text-warning block">{pendingCount}</span>
          <span className="text-[10px] text-onSurfaceVariant font-bold">بانتظار المراجعة</span>
        </div>
        <div className="glass-card p-4 border-none text-center">
          <span className="text-2xl font-black text-error block">{rejectedCount}</span>
          <span className="text-[10px] text-onSurfaceVariant font-bold">مرفوض</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {reports.length === 0 ? (
          <div className="text-center p-16 text-onSurfaceVariant flex flex-col items-center gap-3">
            <span className="text-5xl opacity-40">📊</span>
            <p>لم تقم بإرسال أي تقارير بعد.</p>
          </div>
        ) : reports.map((report) => (
          <div key={report.id} className="glass-card p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusBadge(report.status)}
              <div>
                {report.tiktokUrl ? (
                  <a href={report.tiktokUrl.startsWith('http') ? report.tiktokUrl : `https://${report.tiktokUrl}`} target="_blank" rel="noreferrer" className="text-primary text-sm font-bold hover:underline dir-ltr" dir="ltr">{report.tiktokUrl.substring(0, 50)}...</a>
                ) : (
                  <span className="text-onSurfaceVariant text-sm">بدون رابط</span>
                )}
                <p className="text-[11px] text-onSurfaceVariant mt-1">{report.dateString}</p>
              </div>
            </div>
            <span className="text-[10px] text-onSurfaceVariant">{new Date(report.submittedAt).toLocaleString('ar-EG')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
