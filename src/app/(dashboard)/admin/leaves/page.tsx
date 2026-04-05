"use client"
import React, { useState, useEffect } from 'react';
import { resolveFileUrl } from '../../../../utils/resolveFileUrl';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEFAULT_ALLOWED_LEAVES = 21;
const STATUS_MSG_DURATION = 3000;

// ─── Types ───
interface Employee {
  id: string;
  name: string;
  fullName?: string;
  photo1?: string;
  platform?: string;
  allowedLeaves?: number;
}

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  employeeId: string;
  employee?: Employee;
}

interface LeaveStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  onLeaveNow?: LeaveRequest[];
}

export default function LeavesPage() {
  const [tab, setTab] = useState<'pending'|'all'|'stats'>('pending');
  const [pending, setPending] = useState<LeaveRequest[]>([]);
  const [all, setAll] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotesMap, setAdminNotesMap] = useState<Record<string, string>>({});
  const [statusMsg, setStatusMsg] = useState('');

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchData = () => {
    const headers = { 'Authorization': 'Bearer ' + getToken() };
    Promise.all([
      fetch(API_URL + '/users/leaves/pending', { headers }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).catch((err) => { console.error('فشل جلب الطلبات المعلقة:', err); return []; }),
      fetch(API_URL + '/users/leaves/all', { headers }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).catch((err) => { console.error('فشل جلب كل الطلبات:', err); return []; }),
      fetch(API_URL + '/users/leaves/stats', { headers }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).catch((err) => { console.error('فشل جلب الإحصائيات:', err); return null; }),
    ]).then(([p, a, s]) => {
      setPending(Array.isArray(p) ? p : []);
      setAll(Array.isArray(a) ? a : []);
      setStats(s);
      setLoading(false);
    }).catch((err) => { console.error('فشل جلب بيانات الإجازات:', err); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const showMsg = (msg: string) => { setStatusMsg(msg); setTimeout(() => setStatusMsg(''), STATUS_MSG_DURATION); };

  const calcDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const days = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 0;
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`${API_URL}/users/leaves/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
        body: JSON.stringify({ adminNotes: adminNotesMap[id] || '' })
      });
      if (res.ok) {
        showMsg(action === 'approve' ? 'تمت الموافقة على الإجازة ✅' : 'تم رفض طلب الإجازة ❌');
      } else {
        const err = await res.json().catch(() => null);
        showMsg(err?.message || 'حدث خطأ أثناء المعالجة');
      }
    } catch (err) {
      console.error('خطأ في معالجة الطلب:', err);
      showMsg('حدث خطأ أثناء المعالجة');
    }
    setAdminNotesMap(prev => { const n = {...prev}; delete n[id]; return n; });
    fetchData();
  };

  const leaveTypeColors: Record<string, string> = { 'عادية': 'bg-blue-500/10 text-blue-400', 'مرضية': 'bg-red-500/10 text-red-400', 'طارئة': 'bg-orange-500/10 text-orange-400', 'أخرى': 'bg-gray-500/10 text-gray-400' };
  const statusColors: Record<string, string> = { 'PENDING': 'bg-yellow-500/10 text-yellow-400', 'APPROVED': 'bg-green-500/10 text-green-400', 'REJECTED': 'bg-red-500/10 text-red-400' };
  const statusLabels: Record<string, string> = { 'PENDING': '⏳ بانتظار المراجعة', 'APPROVED': '✅ مقبولة', 'REJECTED': '❌ مرفوضة' };

  /** Safe first character accessor */
  const getInitial = (text?: string): string => {
    if (!text || text.length === 0) return '؟';
    return text[0];
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      {statusMsg && <div className="bg-success/10 text-success p-3 rounded-xl text-sm font-bold border border-success/20 fixed top-4 left-1/2 -translate-x-1/2 z-50 shadow-lg">{statusMsg}</div>}

      <header>
        <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">إدارة الإجازات</h1>
        <p className="text-onSurfaceVariant text-sm">نظام متكامل لإدارة طلبات الإجازات وإحصائياتها</p>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="إجمالي الطلبات" value={stats.total} color="primary" />
          <StatCard label="بانتظار المراجعة" value={stats.pending} color="warning" />
          <StatCard label="مقبولة" value={stats.approved} color="success" />
          <StatCard label="مرفوضة" value={stats.rejected} color="error" />
          <StatCard label="في إجازة الآن" value={stats.onLeaveNow?.length || 0} color="tertiary" />
        </div>
      )}

      {/* Currently on leave */}
      {stats?.onLeaveNow && stats.onLeaveNow.length > 0 && (
        <div className="glass-card p-4 border-r-4 border-tertiary">
          <h3 className="font-bold text-sm text-tertiary mb-3">🌴 الموظفون في إجازة حالياً</h3>
          <div className="flex flex-wrap gap-3">
            {stats.onLeaveNow.map((l: LeaveRequest) => (
              <div key={l.id} className="flex items-center gap-2 bg-tertiary/10 px-3 py-2 rounded-xl">
                {l.employee?.photo1 ? <img src={resolveFileUrl(l.employee.photo1)} className="w-8 h-8 rounded-full object-cover" alt={`صورة ${l.employee?.fullName || l.employee?.name || 'موظف'}`} /> : <div className="w-8 h-8 bg-tertiary/20 rounded-full flex items-center justify-center font-bold text-xs text-tertiary">{getInitial(l.employee?.name)}</div>}
                <div><p className="font-bold text-xs">{l.employee?.fullName || l.employee?.name}</p><p className="text-[10px] text-onSurfaceVariant">{l.startDate} → {l.endDate}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['pending', 'all', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t ? 'gradient-bg text-white shadow-ambient' : 'bg-surfaceContainerLow text-onSurfaceVariant hover:bg-surfaceContainerHigh'}`}>
            {t === 'pending' ? `طلبات معلقة (${pending.length})` : t === 'all' ? 'كل الطلبات' : 'إحصائيات الموظفين'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass-card p-6 min-h-[400px]">
        {loading ? <p className="text-onSurfaceVariant text-center p-10">جاري التحميل...</p> : tab === 'pending' ? (
          pending.length === 0 ? <EmptyState icon="✅" text="لا توجد طلبات معلقة" /> : (
            <div className="flex flex-col gap-4">
              {pending.map(req => (
                <div key={req.id} className="bg-surfaceContainerLowest p-5 rounded-2xl border border-outlineVariant/10 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {req.employee?.photo1 ? <img src={resolveFileUrl(req.employee.photo1)} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" alt={`صورة ${req.employee?.fullName || req.employee?.name || 'موظف'}`} /> : <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">{getInitial(req.employee?.name)}</div>}
                      <div>
                        <p className="font-bold">{req.employee?.fullName || req.employee?.name}</p>
                        <p className="text-xs text-onSurfaceVariant">{req.employee?.platform || ''}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${leaveTypeColors[req.type] || 'bg-gray-500/10'}`}>{req.type}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="bg-surfaceContainerLow p-3 rounded-xl"><span className="text-[10px] text-onSurfaceVariant block">من</span><span className="font-bold">{req.startDate}</span></div>
                    <div className="bg-surfaceContainerLow p-3 rounded-xl"><span className="text-[10px] text-onSurfaceVariant block">إلى</span><span className="font-bold">{req.endDate}</span></div>
                    <div className="bg-primary/10 p-3 rounded-xl border border-primary/20"><span className="text-[10px] text-primary block">عدد الأيام</span><span className="font-black text-primary text-lg">{calcDays(req.startDate, req.endDate)}</span></div>
                    <div className="bg-surfaceContainerLow p-3 rounded-xl"><span className="text-[10px] text-onSurfaceVariant block">رصيد الإجازات</span><span className="font-bold">{req.employee?.allowedLeaves || DEFAULT_ALLOWED_LEAVES} يوم</span></div>
                  </div>
                  <div className="bg-surfaceContainerLow p-3 rounded-xl"><span className="text-[10px] text-onSurfaceVariant block mb-1">السبب</span><p className="text-sm">{req.reason}</p></div>
                  <input type="text" value={adminNotesMap[req.id] || ''} onChange={e => setAdminNotesMap({...adminNotesMap, [req.id]: e.target.value})} placeholder="ملاحظات المدير (اختياري)..." className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm" />
                  <div className="flex gap-3">
                    <button onClick={() => handleAction(req.id, 'approve')} className="flex-1 bg-success text-white p-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all">✅ موافقة</button>
                    <button onClick={() => handleAction(req.id, 'reject')} className="flex-1 bg-error text-white p-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all">❌ رفض</button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === 'all' ? (
          all.length === 0 ? <EmptyState icon="📋" text="لا توجد طلبات إجازة" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead><tr className="border-b border-outlineVariant/20 text-onSurfaceVariant text-sm">
                  <th className="p-3 font-medium">الموظف</th>
                  <th className="p-3 font-medium">النوع</th>
                  <th className="p-3 font-medium">من</th>
                  <th className="p-3 font-medium">إلى</th>
                  <th className="p-3 font-medium">السبب</th>
                  <th className="p-3 font-medium">الحالة</th>
                  <th className="p-3 font-medium">ملاحظات المدير</th>
                </tr></thead>
                <tbody>
                  {all.map(req => (
                    <tr key={req.id} className="border-b border-outlineVariant/10 hover:bg-surfaceContainerLow transition-colors">
                      <td className="p-3 font-bold text-sm">{req.employee?.fullName || req.employee?.name}</td>
                      <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${leaveTypeColors[req.type] || ''}`}>{req.type}</span></td>
                      <td className="p-3 text-sm">{req.startDate}</td>
                      <td className="p-3 text-sm">{req.endDate}</td>
                      <td className="p-3 text-xs max-w-[180px] truncate">{req.reason}</td>
                      <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[req.status] || ''}`}>{statusLabels[req.status]}</span></td>
                      <td className="p-3 text-xs text-onSurfaceVariant">{req.adminNotes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-lg">إحصائيات إجازات الموظفين</h3>
            {all.length > 0 ? (() => {
              const empMap = new Map<string, { name: string; total: number; approved: number; rejected: number; pending: number }>();
              all.forEach((req) => {
                const empId = req.employeeId;
                if (!empMap.has(empId)) empMap.set(empId, { name: req.employee?.fullName || req.employee?.name || '', total: 0, approved: 0, rejected: 0, pending: 0 });
                const e = empMap.get(empId)!;
                e.total++;
                if (req.status === 'APPROVED') e.approved++;
                else if (req.status === 'REJECTED') e.rejected++;
                else e.pending++;
              });
              return Array.from(empMap.entries()).map(([id, data]) => (
                <div key={id} className="bg-surfaceContainerLowest p-4 rounded-xl flex justify-between items-center border border-outlineVariant/10">
                  <p className="font-bold text-sm">{data.name}</p>
                  <div className="flex gap-4 text-xs">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded font-bold">إجمالي: {data.total}</span>
                    <span className="bg-success/10 text-success px-2 py-1 rounded font-bold">مقبولة: {data.approved}</span>
                    <span className="bg-error/10 text-error px-2 py-1 rounded font-bold">مرفوضة: {data.rejected}</span>
                    <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded font-bold">معلقة: {data.pending}</span>
                  </div>
                </div>
              ));
            })() : <EmptyState icon="📊" text="لا بيانات لعرضها" />}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = { primary: 'bg-primary', success: 'bg-success', warning: 'bg-yellow-500', error: 'bg-error', tertiary: 'bg-tertiary' };
  const textMap: Record<string, string> = { primary: 'text-primary', success: 'text-success', warning: 'text-yellow-400', error: 'text-error', tertiary: 'text-tertiary' };
  return (
    <div className="glass-card p-4 relative overflow-hidden border-none">
      <div className={`absolute top-0 right-0 w-1 h-full ${colorMap[color]}`}></div>
      <span className="text-xs text-onSurfaceVariant block mb-2">{label}</span>
      <span className={`text-2xl font-bold ${textMap[color]}`}>{value}</span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return <div className="text-center py-16 text-onSurfaceVariant flex flex-col items-center gap-3"><span className="text-5xl opacity-30">{icon}</span><p>{text}</p></div>;
}
