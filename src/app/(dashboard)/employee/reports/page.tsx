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
  adminNotes?: string;
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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'APPROVED': return { label: 'معتمد', icon: '✅', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' };
      case 'ON_TIME': return { label: 'ملتزم', icon: '✓', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' };
      case 'PENDING': return { label: 'قيد المراجعة', icon: '⏳', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' };
      case 'REJECTED': return { label: 'مرفوض', icon: '❌', color: 'text-error', bg: 'bg-error/10', border: 'border-error/20' };
      case 'MISSED': return { label: 'متأخر', icon: '✗', color: 'text-error', bg: 'bg-error/10', border: 'border-error/20' };
      default: return { label: status, icon: '🔘', color: 'text-onSurfaceVariant', bg: 'bg-surfaceContainerHigh', border: 'border-outlineVariant/20' };
    }
  };

  const approvedCount = reports.filter(r => r.status === 'APPROVED' || r.status === 'ON_TIME').length;
  const pendingCount = reports.filter(r => r.status === 'PENDING').length;
  const rejectedCount = reports.filter(r => r.status === 'REJECTED').length;
  const missedCount = reports.filter(r => r.status === 'MISSED').length;

  const total = Math.max(reports.length, 1); // prevent division by zero
  const approvedPct = Math.round((approvedCount / total) * 100);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="w-12 h-12 border-4 border-outlineVariant/20 border-t-primary rounded-full animate-spin"></div>
      <p className="font-bold text-onSurfaceVariant animate-pulse">جاري سحب التقارير...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-700 pb-10 min-h-screen">
      
      {/* ══════════ HEADER ══════════ */}
      <header className="relative bg-gradient-to-br from-surfaceContainerLowest via-surface to-surfaceContainer p-8 rounded-[2rem] border border-outlineVariant/20 shadow-2xl overflow-hidden text-center sm:text-right">
        {/* Decorative Orbs */}
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-secondary/10 rounded-full blur-[90px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-display font-black text-3xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-l from-primary to-secondary">
              أرشيف تقاريري 📂
            </h1>
            <p className="text-onSurfaceVariant text-sm sm:text-base font-bold max-w-md leading-relaxed">
              تصفح الروابط التي ارسلتها وحالتها، وتابع مسيرتك نحو تحقيق الأهداف بنجاح وتألق.
            </p>
          </div>
          
          {/* Circular Progress (Total Approval) */}
          <div className="relative w-32 h-32 shrink-0 glass-card rounded-full flex items-center justify-center border-4 border-surface shadow-inner">
            <svg className="w-full h-full transform -rotate-90 absolute inset-0 text-success duration-1000">
               <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="8" fill="transparent" className="opacity-10" />
               <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={`${approvedPct * 3.39} 339`} strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(var(--success),0.5)] transition-all duration-1000 ease-out" />
            </svg>
            <div className="flex flex-col items-center z-10">
              <span className="text-2xl font-black text-success">{approvedPct}%</span>
              <span className="text-[9px] font-bold text-onSurfaceVariant uppercase">معدل القبول</span>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════ STATS ROW ══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatWidget title="إجمالي الروابط" value={reports.length} icon="🔗" color="text-primary" bg="bg-primary/5" />
        <StatWidget title="معتمد" value={approvedCount} icon="✅" color="text-success" bg="bg-success/5" />
        <StatWidget title="قيد المراجعة" value={pendingCount} icon="⏳" color="text-warning" bg="bg-warning/5" />
        <StatWidget title="مرفوض/مفقود" value={rejectedCount + missedCount} icon="⚠️" color="text-error" bg="bg-error/5" />
      </div>

      {/* ══════════ REPORTS LIST ══════════ */}
      <div className="flex flex-col gap-6 relative z-10 w-full pb-10">
        <h2 className="text-xl font-black text-onSurface flex items-center gap-2 mb-2 px-2">
          <span>📜</span> السجل اليومي للتقارير
        </h2>
        
        {reports.length === 0 ? (
          <div className="glass-card text-center p-20 flex flex-col items-center gap-4 border-dashed border-2 border-outlineVariant/20">
            <span className="text-7xl opacity-30 drop-shadow-lg">📭</span>
            <p className="font-bold text-onSurfaceVariant text-lg">لم تقم بإرسال أي تقارير بعد.</p>
            <p className="text-xs text-onSurfaceVariant/60 max-w-xs leading-relaxed">بمجرد بدئك بمشاركة إنجازاتك اليومية، سيظهر السجل الخاص بك هنا بتفصيل أنيق.</p>
          </div>
        ) : (
          (() => {
            // Group by Date
            const groupedReports: { [key: string]: Report[] } = {};
            [...reports]
              .sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
              .forEach(r => {
                const d = r.dateString || 'غير محدد';
                if (!groupedReports[d]) groupedReports[d] = [];
                groupedReports[d].push(r);
              });

            return Object.keys(groupedReports).map(date => {
              const dReports = groupedReports[date];
              const accepted = dReports.filter(r => r.status === 'APPROVED' || r.status === 'ON_TIME').length;
              const rejected = dReports.filter(r => r.status === 'REJECTED').length;
              const pending = dReports.filter(r => r.status === 'PENDING').length;

              return (
                <div key={date} className="glass-card mb-4 border border-outlineVariant/20 overflow-hidden rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                  {/* Day Header */}
                  <div className="bg-surfaceContainerLowest p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outlineVariant/10 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-2 h-full gradient-bg"></div>
                    <h3 className="text-xl font-black flex items-center gap-2 pr-4 text-onSurface">
                      <span className="text-2xl opacity-80">📅</span> {date}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <span className="bg-surfaceContainer px-3 py-1.5 rounded-full text-onSurfaceVariant shadow-inner">المجموع: {dReports.length}</span>
                      {accepted > 0 && <span className="bg-success/15 text-success px-3 py-1.5 rounded-full shadow-inner flex items-center gap-1"><span>✅</span> مقبول: {accepted}</span>}
                      {pending > 0 && <span className="bg-warning/15 text-warning px-3 py-1.5 rounded-full shadow-inner flex items-center gap-1"><span>⏳</span> معلق: {pending}</span>}
                      {rejected > 0 && <span className="bg-error/15 text-error px-3 py-1.5 rounded-full shadow-inner flex items-center gap-1 animate-pulse"><span>❌</span> مرفوض: {rejected}</span>}
                    </div>
                  </div>
                  
                  {/* Day Videos */}
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface/30">
                    {dReports.map(report => {
                      const sInfo = getStatusInfo(report.status);
                      const isRejected = report.status === 'REJECTED';
                      
                      return (
                        <div key={report.id} className={`relative overflow-hidden bg-surfaceContainerLowest p-5 rounded-2xl border ${isRejected ? 'border-error/30 shadow-[0_0_15px_rgba(var(--error-rgb),0.1)]' : 'border-outlineVariant/10 hover:border-outlineVariant/30'} hover:-translate-y-1 transition-all duration-300 group`}>
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0 pr-1">
                              <div className="flex items-center gap-2 mb-3">
                                <span className={`inline-flex items-center gap-1.5 ${sInfo.bg} ${sInfo.color} px-3 py-1.5 rounded-lg text-xs font-black tracking-wider shadow-sm`}>
                                  <span>{sInfo.icon}</span> {sInfo.label}
                                </span>
                                <span className="text-[10px] text-onSurfaceVariant font-bold bg-surfaceContainerLow px-2 py-1.5 rounded-lg border border-outlineVariant/5">
                                  {new Date(report.submittedAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                              
                              {report.tiktokUrl && report.status !== 'MISSED' ? (
                                <a 
                                  href={report.tiktokUrl.startsWith('http') ? report.tiktokUrl : `https://${report.tiktokUrl}`} 
                                  target="_blank" rel="noreferrer" 
                                  className="block text-primary text-sm font-bold truncate max-w-[280px] hover:text-secondary transition-colors dir-ltr text-left bg-surfaceContainerHigh px-3 py-2 rounded-xl border border-outlineVariant/5 mt-1" 
                                  dir="ltr"
                                >
                                  {report.tiktokUrl}
                                </a>
                              ) : (
                                <span className="block text-onSurfaceVariant/50 text-sm font-bold italic w-full text-right mt-1">لا يوجد رابط (لم يُرسل شيء)</span>
                              )}
                              
                              {/* 🔴 Reject Reason Banner */}
                              {isRejected && report.adminNotes && (
                                <div className="mt-4 p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3 relative overflow-hidden">
                                  <div className="absolute rtl:left-2 ltr:right-2 top-2 text-4xl opacity-10 blur-[1px]">❌</div>
                                  <div className="relative z-10 w-full">
                                    <p className="text-[10px] text-error font-black uppercase mb-1 flex items-center gap-1"><span>💬</span> سبب الرفض من الإدارة</p>
                                    <p className="text-sm text-error font-bold leading-relaxed bg-surfaceContainerLowest/50 p-2 rounded-lg">{report.adminNotes}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>
    </div>
  );
}

// Helper Widget
function StatWidget({ title, value, icon, color, bg }: { title: string, value: number, icon: string, color: string, bg: string }) {
  return (
    <div className={`glass-card p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow ${bg} border border-outlineVariant/5`}>
      <span className="absolute -left-4 -bottom-4 text-6xl opacity-[0.03] rotate-12 pointer-events-none">{icon}</span>
      <h3 className="text-xs sm:text-sm font-bold text-onSurfaceVariant mb-2">{title}</h3>
      <div className="flex items-baseline justify-between">
        <span className={`text-3xl sm:text-4xl font-black font-display ${color}`}>{value}</span>
        <span className="text-xl sm:text-2xl drop-shadow-sm">{icon}</span>
      </div>
    </div>
  );
}
