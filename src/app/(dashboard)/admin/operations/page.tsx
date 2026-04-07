"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { resolveFileUrl } from '../../../../utils/resolveFileUrl';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const POLL_INTERVAL_MS = 30000;

// ─── Types ───
interface OperationsEmployee {
  id: string;
  name: string;
  fullName?: string;
  photo1?: string;
  platform?: string;
  attendanceStatus?: string;
  videoCountToday?: number;
  todayLinks?: string[];
  originalTarget?: number;
  achievedTarget?: number;
}

interface ReportEmployee {
  id: string;
  name: string;
  fullName?: string;
  photo1?: string;
  platform?: string;
}

interface PendingReport {
  id: string;
  employeeId?: string;
  employee?: ReportEmployee;
  tiktokUrl?: string;
  dateString?: string;
}

interface SelectedEmpLinks {
  name: string;
  links: string[];
}

export default function OperationsDashboard() {
  const [data, setData] = useState<OperationsEmployee[]>([]);
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedEmpLinks, setSelectedEmpLinks] = useState<SelectedEmpLinks | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'review'|'tracking'>('review');

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const token = getToken();
    try {
      const [opsRes, pendingRes] = await Promise.all([
        fetch(API_URL + '/users/admin/operations', { headers: { 'Authorization': 'Bearer ' + token } }),
        fetch(API_URL + '/reports/pending', { headers: { 'Authorization': 'Bearer ' + token } })
      ]);
      if (!opsRes.ok || !pendingRes.ok) throw new Error('Failed');
      const opsJson = await opsRes.json();
      const pendingJson = await pendingRes.json();
      setData(Array.isArray(opsJson) ? opsJson : []);
      setPendingReports(Array.isArray(pendingJson) ? pendingJson : []);
    } catch (e) {
      console.error('Operations fetch error:', e);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    let bodyData: any = {};
    if (action === 'reject') {
      const reason = prompt('يرجى تحديد سبب الرفض (ليعرف الموظف سبب رفض تقريره):', 'مثلاً: جودة ضعيفة');
      if (reason === null) return; // User cancelled
      bodyData.reason = reason;
    }
    
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await fetch(`${API_URL}/reports/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
        body: JSON.stringify(bodyData)
      });
    } catch (e) { console.error(e); }
    setProcessingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const handleBulkAction = async (ids: string[], action: 'approve' | 'reject') => {
    let bodyData: any = {};
    if (action === 'reject') {
      const reason = prompt(`يرجى تحديد سبب الرفض الجماعي لـ ${ids.length} رابط:`, 'مثلاً: راجع القوانين المتبعة');
      if (reason === null) return; // User cancelled
      bodyData.reason = reason;
    }
    
    ids.forEach(id => setProcessingIds(prev => new Set(prev).add(id)));
    await Promise.all(ids.map(id =>
      fetch(`${API_URL}/reports/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
        body: JSON.stringify(bodyData)
      }).catch(console.error)
    ));
    fetchData(true);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Group pending reports by employee
  const groupedPending = pendingReports.reduce((acc: Record<string, { employee: ReportEmployee, reports: PendingReport[] }>, rep) => {
    const empId = rep.employeeId || rep.employee?.id || 'unknown';
    if (!acc[empId]) {
      acc[empId] = { employee: rep.employee || { id: 'unknown', name: 'غير معروف' }, reports: [] };
    }
    acc[empId].reports.push(rep);
    return acc;
  }, {});

  const filteredData = data.filter(emp => {
    const name = (emp.fullName || emp.name || '').toLowerCase();
    const mSearch = name.includes(search.toLowerCase());
    const mPlatform = filterPlatform === 'ALL' || (emp.platform || '').includes(filterPlatform);
    const mStatus = filterStatus === 'ALL' || emp.attendanceStatus === filterStatus || (filterStatus === 'NOT_SUBMITTED' && (!emp.attendanceStatus || emp.attendanceStatus === 'NOT_SUBMITTED'));
    return mSearch && mPlatform && mStatus;
  });

  const getStatusBadge = (status?: string) => {
    if (status === 'PRESENT') return <span className="bg-success/10 text-success px-3 py-1 rounded-full text-[11px] font-black border border-success/30 whitespace-nowrap">حاضر 🟢</span>;
    if (status === 'LATE') return <span className="bg-warning/10 text-warning px-3 py-1 rounded-full text-[11px] font-black border border-warning/30 whitespace-nowrap">متأخر 🟡</span>;
    if (status === 'ABSENT') return <span className="bg-error/10 text-error px-3 py-1 rounded-full text-[11px] font-black border border-error/30 whitespace-nowrap">غائب 🔴</span>;
    return <span className="bg-surfaceContainerHigh text-onSurfaceVariant px-3 py-1 rounded-full text-[11px] font-black border border-outlineVariant/30 whitespace-nowrap">لم يسجل ⚪</span>;
  };

  const presentCount = data.filter(d => d.attendanceStatus === 'PRESENT').length;
  const totalVideos = data.reduce((sum, d) => sum + (d.videoCountToday || 0), 0);
  const absentCount = data.filter(d => d.attendanceStatus === 'ABSENT').length;
  const groupedCount = Object.keys(groupedPending).length;

  return (
    <div className="flex flex-col gap-5 lg:gap-8 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-700 pb-10">
      
      {/* ═══════════ HEADER ═══════════ */}
      <header className="relative overflow-hidden bg-gradient-to-br from-surfaceContainerLowest via-surface to-surfaceContainer p-5 sm:p-8 rounded-2xl lg:rounded-[2rem] border border-outlineVariant/20 shadow-2xl">
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-primary/15 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col gap-5">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="font-black text-2xl sm:text-3xl lg:text-4xl text-transparent bg-clip-text bg-gradient-to-l from-primary to-secondary flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-3xl sm:text-5xl animate-pulse opacity-90">📡</span> غرفة العمليات
              </h1>
              <p className="text-onSurfaceVariant text-xs sm:text-sm font-bold mt-1">مراقبة الحضور • مراجعة الروابط • اعتماد الإنجازات</p>
            </div>
            <button onClick={() => fetchData(true)} className={`self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-surface/60 backdrop-blur border border-outlineVariant/20 text-sm font-bold text-onSurfaceVariant hover:text-primary transition-all ${refreshing ? 'animate-pulse' : ''}`}>
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span> تحديث
            </button>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-surface/70 backdrop-blur-xl p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 border border-success/10 shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-xl flex items-center justify-center text-lg sm:text-2xl shrink-0">✅</div>
              <div><p className="text-xl sm:text-2xl font-black text-success">{presentCount}</p><p className="text-[10px] sm:text-xs text-onSurfaceVariant font-bold">حاضرون</p></div>
            </div>
            <div className="bg-surface/70 backdrop-blur-xl p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 border border-error/10 shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-error/10 rounded-xl flex items-center justify-center text-lg sm:text-2xl shrink-0">🔴</div>
              <div><p className="text-xl sm:text-2xl font-black text-error">{absentCount}</p><p className="text-[10px] sm:text-xs text-onSurfaceVariant font-bold">غائبون</p></div>
            </div>
            <div className="bg-surface/70 backdrop-blur-xl p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 border border-primary/10 shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-lg sm:text-2xl shrink-0">🔥</div>
              <div><p className="text-xl sm:text-2xl font-black text-primary">{totalVideos}</p><p className="text-[10px] sm:text-xs text-onSurfaceVariant font-bold">فيديوهات اليوم</p></div>
            </div>
            <div className="bg-surface/70 backdrop-blur-xl p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 border border-warning/10 shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/10 rounded-xl flex items-center justify-center text-lg sm:text-2xl shrink-0">⏳</div>
              <div><p className="text-xl sm:text-2xl font-black text-warning">{pendingReports.length}</p><p className="text-[10px] sm:text-xs text-onSurfaceVariant font-bold">بانتظار المراجعة</p></div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════ TABS ═══════════ */}
      <div className="flex gap-1 bg-surfaceContainerLowest p-1.5 rounded-2xl border border-outlineVariant/10 shadow-sm">
        <button onClick={() => setTab('review')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${tab === 'review' ? 'bg-warning/10 text-warning shadow-sm border border-warning/20' : 'text-onSurfaceVariant hover:bg-surfaceContainerHigh'}`}>
          <span className="text-lg">⚠️</span> المراجعة <span className="bg-warning text-white text-[10px] px-2 py-0.5 rounded-full font-black">{pendingReports.length}</span>
        </button>
        <button onClick={() => setTab('tracking')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${tab === 'tracking' ? 'bg-primary/10 text-primary shadow-sm border border-primary/20' : 'text-onSurfaceVariant hover:bg-surfaceContainerHigh'}`}>
          <span className="text-lg">📊</span> متابعة الأداء
        </button>
      </div>

      {/* ═══════════ TAB: REVIEW ═══════════ */}
      {tab === 'review' && (
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-4 bg-surfaceContainerLowest rounded-2xl border border-outlineVariant/10">
              <div className="w-14 h-14 border-4 border-outlineVariant/20 border-t-warning rounded-full animate-spin"></div>
              <p className="font-bold text-onSurfaceVariant animate-pulse text-sm">جاري تحميل الروابط...</p>
            </div>
          ) : groupedCount === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 sm:p-24 gap-4 bg-surfaceContainerLowest rounded-2xl border border-outlineVariant/10">
              <span className="text-6xl sm:text-7xl opacity-30">🎉</span>
              <span className="font-black text-lg text-onSurfaceVariant">لا توجد روابط بانتظار المراجعة</span>
              <span className="text-sm text-onSurfaceVariant/60">جميع التقارير تم اعتمادها</span>
            </div>
          ) : (
            /* Employee Cards - Each card = one employee with all their links */
            <div className="flex flex-col gap-4">
              {Object.entries(groupedPending).map(([empId, group]) => {
                const emp = group.employee;
                const reports = group.reports;
                const allIds = reports.map(r => r.id);
                const isProcessing = reports.some(r => processingIds.has(r.id));

                return (
                  <div key={empId} className="bg-surface rounded-2xl sm:rounded-3xl border border-outlineVariant/10 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    {/* Employee Header */}
                    <div className="bg-gradient-to-l from-surfaceContainerLowest to-surface p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outlineVariant/10">
                      <div className="flex items-center gap-4">
                        {/* Photo */}
                        {emp.photo1 ? (
                          <img src={resolveFileUrl(emp.photo1)} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-primary/20 shadow-md shrink-0" alt={`صورة ${emp.fullName || emp.name || 'موظف'}`} />
                        ) : (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-2xl border-2 border-primary/20 shrink-0">
                            {(emp.fullName || emp.name || '؟')[0]}
                          </div>
                        )}
                        <div>
                          <h3 className="font-black text-lg sm:text-xl text-onSurface">{emp.fullName || emp.name || 'بدون اسم'}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[11px] text-onSurfaceVariant bg-surfaceContainerHigh px-2.5 py-0.5 rounded-lg font-bold">{emp.platform || 'غير محدد'}</span>
                            <span className="text-[11px] text-warning bg-warning/10 px-2.5 py-0.5 rounded-lg font-black">{reports.length} {reports.length === 1 ? 'رابط' : 'روابط'} بانتظار</span>
                          </div>
                        </div>
                      </div>

                      {/* Bulk Actions */}
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => handleBulkAction(allIds, 'approve')} 
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 bg-success hover:bg-success/90 text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
                        >
                          ✅ اعتماد الكل ({reports.length})
                        </button>
                        <button 
                          onClick={() => handleBulkAction(allIds, 'reject')} 
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 bg-surfaceContainerHighest text-error hover:bg-error hover:text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-error/20 hover:border-error active:scale-95 transition-all disabled:opacity-50"
                        >
                          ❌ رفض الكل
                        </button>
                      </div>
                    </div>

                    {/* Links List */}
                    <div className="p-3 sm:p-5 flex flex-col gap-2">
                      {reports.map((rep, idx) => (
                        <div key={rep.id} className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl transition-all ${processingIds.has(rep.id) ? 'opacity-40 pointer-events-none' : 'bg-surfaceContainerLowest hover:bg-surfaceContainerLow'}`}>
                          {/* Link Number */}
                          <span className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-black text-xs shrink-0">{idx + 1}</span>
                          
                          {/* Link URL */}
                          <a href={rep.tiktokUrl?.startsWith('http') ? rep.tiktokUrl : `https://${rep.tiktokUrl}`} target="_blank" rel="noreferrer" className="flex-1 truncate text-xs sm:text-sm font-bold text-primary hover:text-secondary hover:underline transition-colors" title={rep.tiktokUrl}>
                            {rep.tiktokUrl}
                          </a>
                          
                          {/* Date */}
                          <span className="text-[10px] text-onSurfaceVariant font-bold shrink-0 hidden sm:block">{rep.dateString}</span>
                          
                          {/* Individual Actions */}
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => { handleAction(rep.id, 'approve'); setTimeout(() => fetchData(true), 500); }} className="w-8 h-8 sm:w-9 sm:h-9 bg-success/10 hover:bg-success text-success hover:text-white rounded-lg flex items-center justify-center transition-all active:scale-90 text-sm" title="اعتماد">✓</button>
                            <button onClick={() => { handleAction(rep.id, 'reject'); setTimeout(() => fetchData(true), 500); }} className="w-8 h-8 sm:w-9 sm:h-9 bg-error/10 hover:bg-error text-error hover:text-white rounded-lg flex items-center justify-center transition-all active:scale-90 text-sm" title="رفض">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TAB: TRACKING ═══════════ */}
      {tab === 'tracking' && (
        <div className="flex flex-col gap-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 bg-surfaceContainerLowest p-2 rounded-xl sm:rounded-2xl shadow-sm border border-outlineVariant/10">
            <div className="flex-1 relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-onSurfaceVariant text-lg">🔍</span>
              <input 
                type="text" placeholder="البحث عن موظف..." 
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent pr-12 pl-4 py-3 rounded-xl outline-none text-onSurface font-bold placeholder-onSurfaceVariant/50 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
                className="bg-transparent px-3 py-3 rounded-xl outline-none text-primary font-black appearance-none cursor-pointer text-sm border border-outlineVariant/10">
                <option value="ALL">🌐 الكل</option>
                <option value="تيك توك">📱 تيك توك</option>
                <option value="انستقرام">📷 انستقرام</option>
                <option value="يوتيوب">🎬 يوتيوب</option>
                <option value="فيسبوك">📘 فيسبوك</option>
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="bg-transparent px-3 py-3 rounded-xl outline-none text-primary font-black appearance-none cursor-pointer text-sm border border-outlineVariant/10">
                <option value="ALL">📋 كل الحالات</option>
                <option value="PRESENT">🟢 حاضرون</option>
                <option value="ABSENT">🔴 غائبون</option>
                <option value="NOT_SUBMITTED">⚪ لم يسجلوا</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-4 bg-surfaceContainerLowest rounded-2xl border border-outlineVariant/10">
              <div className="w-14 h-14 border-4 border-outlineVariant/20 border-t-primary rounded-full animate-spin"></div>
              <p className="font-bold text-onSurfaceVariant animate-pulse text-sm">جاري تحميل البيانات...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block glass-card rounded-2xl overflow-hidden border border-outlineVariant/20 shadow-xl bg-surface">
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full text-right">
                    <thead className="bg-surfaceContainerLow text-onSurface font-black text-xs uppercase tracking-wider">
                      <tr>
                        <th className="p-5 rounded-tr-2xl">الموظف</th>
                        <th className="p-5">الحالة</th>
                        <th className="p-5 text-center">اليوم</th>
                        <th className="p-5">الهدف</th>
                        <th className="p-5 rounded-tl-2xl">الإنجاز</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium divide-y divide-outlineVariant/10">
                      {filteredData.map((emp) => {
                        const pct = (emp.originalTarget ?? 0) > 0 ? Math.min(100, Math.round(((emp.achievedTarget || 0) / (emp.originalTarget ?? 1)) * 100)) : 0;
                        return (
                          <tr key={emp.id} className="hover:bg-surfaceContainerLowest/80 transition-all group">
                            <td className="p-5">
                              <span className="font-black text-base text-onSurface group-hover:text-primary transition-colors">{emp.fullName || emp.name}</span>
                              <br/><span className="text-xs text-onSurfaceVariant bg-surfaceContainer px-2 py-0.5 rounded-md font-bold">{emp.platform}</span>
                            </td>
                            <td className="p-5 align-middle">{getStatusBadge(emp.attendanceStatus)}</td>
                            <td className="p-5 text-center align-middle">
                              {(emp.videoCountToday || 0) > 0 ? (
                                <button onClick={() => setSelectedEmpLinks({name: emp.fullName || emp.name, links: emp.todayLinks || []})} className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary font-black border border-primary/20 hover:bg-primary hover:text-white transition-all cursor-pointer">{emp.videoCountToday}</button>
                              ) : (
                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-surfaceContainerHigh text-onSurfaceVariant font-black opacity-50">0</span>
                              )}
                            </td>
                            <td className="p-5 align-middle">
                              <span className="font-black text-lg">{emp.achievedTarget || 0}</span>
                              <span className="text-xs text-onSurfaceVariant">/{emp.originalTarget || 0}</span>
                              <br/><span className="text-xs text-secondary font-bold">المتبقي: {Math.max(0, (emp.originalTarget || 0) - (emp.achievedTarget || 0))}</span>
                            </td>
                            <td className="p-5 align-middle w-48">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-surfaceContainerHigh rounded-full h-2.5 overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-[1500ms]" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--secondary), var(--primary))' }} />
                                </div>
                                <span className="text-xs font-black text-onSurfaceVariant w-9 text-left">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredData.length === 0 && (
                        <tr><td colSpan={5} className="p-16 text-center text-onSurfaceVariant"><span className="text-5xl opacity-30 block mb-3">🗂️</span><span className="font-bold">لا توجد نتائج</span></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile/Tablet Cards */}
              <div className="lg:hidden flex flex-col gap-3">
                {filteredData.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-12 gap-3 bg-surfaceContainerLowest rounded-2xl border border-outlineVariant/10">
                    <span className="text-5xl opacity-30">🗂️</span>
                    <span className="font-bold text-sm text-onSurfaceVariant">لا توجد نتائج</span>
                  </div>
                )}
                {filteredData.map((emp) => {
                  const pct = (emp.originalTarget ?? 0) > 0 ? Math.min(100, Math.round(((emp.achievedTarget || 0) / (emp.originalTarget ?? 1)) * 100)) : 0;
                  return (
                    <div key={emp.id} className="bg-surface p-4 rounded-2xl border border-outlineVariant/10 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-base text-onSurface">{emp.fullName || emp.name}</p>
                          <span className="text-[10px] text-onSurfaceVariant bg-surfaceContainer px-2 py-0.5 rounded-md font-bold">{emp.platform}</span>
                        </div>
                        {getStatusBadge(emp.attendanceStatus)}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-surfaceContainerLow p-2 rounded-xl">
                          <p className="font-black text-lg text-primary">{emp.videoCountToday || 0}</p>
                          <p className="text-[9px] text-onSurfaceVariant font-bold">اليوم</p>
                        </div>
                        <div className="bg-surfaceContainerLow p-2 rounded-xl">
                          <p className="font-black text-lg text-onSurface">{emp.achievedTarget || 0}<span className="text-xs text-onSurfaceVariant">/{emp.originalTarget || 0}</span></p>
                          <p className="text-[9px] text-onSurfaceVariant font-bold">الإنجاز</p>
                        </div>
                        <div className="bg-surfaceContainerLow p-2 rounded-xl">
                          <p className="font-black text-lg text-secondary">{Math.max(0, (emp.originalTarget || 0) - (emp.achievedTarget || 0))}</p>
                          <p className="text-[9px] text-onSurfaceVariant font-bold">المتبقي</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-surfaceContainerHigh rounded-full h-2.5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-[1500ms]" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--secondary), var(--primary))' }} />
                        </div>
                        <span className="text-xs font-black text-onSurfaceVariant w-9 text-left">{pct}%</span>
                      </div>
                      {(emp.videoCountToday || 0) > 0 && (
                        <button onClick={() => setSelectedEmpLinks({name: emp.fullName || emp.name, links: emp.todayLinks || []})} className="text-xs font-bold text-primary bg-primary/10 p-2.5 rounded-xl border border-primary/20 active:scale-95 transition-transform">
                          🔗 مشاهدة روابط اليوم ({emp.videoCountToday})
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════ MODAL: Links Viewer ═══════════ */}
      {selectedEmpLinks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedEmpLinks(null)}>
          <div className="bg-surface p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] max-w-lg w-full shadow-2xl border border-outlineVariant/20 relative animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedEmpLinks(null)} className="absolute top-4 sm:top-6 left-4 sm:left-6 w-9 h-9 bg-surfaceContainerHigh rounded-full flex items-center justify-center hover:bg-error/10 hover:text-error transition-colors font-bold text-sm">✕</button>
            <h3 className="text-xl sm:text-2xl font-black mb-2 text-primary">فيديوهات اليوم 📂</h3>
            <p className="text-onSurfaceVariant font-bold mb-4 text-sm">الموظف: <span className="text-onSurface">{selectedEmpLinks.name}</span></p>
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scroll pr-2">
              {selectedEmpLinks.links.map((link, i) => (
                <a key={i} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className="p-3 bg-surfaceContainerLow hover:bg-surfaceContainer border border-outlineVariant/20 rounded-xl flex items-center gap-3 group transition-colors">
                  <span className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-black text-xs shrink-0">{i+1}</span>
                  <span className="truncate text-xs sm:text-sm font-bold text-onSurface flex-1">{link}</span>
                  <span className="text-secondary opacity-50 group-hover:opacity-100 transition-opacity shrink-0">🔗</span>
                </a>
              ))}
              {selectedEmpLinks.links.length === 0 && (
                <p className="text-center text-onSurfaceVariant py-4 text-sm">لم يرفع أي فيديوهات اليوم.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
