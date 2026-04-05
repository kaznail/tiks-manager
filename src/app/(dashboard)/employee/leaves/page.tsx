"use client"
import React, { useState, useEffect, useMemo } from 'react';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEFAULT_ALLOWED_LEAVES = 21;
const STATUS_MSG_DURATION = 4000;

// ─── Types ───
interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
}

export default function EmployeeLeavePage() {
  const [tab, setTab] = useState<'request' | 'history'>('request');
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  
  // Default to today
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  
  const [reason, setReason] = useState('');
  const [type, setType] = useState('عادية');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [allowedLeaves, setAllowedLeaves] = useState(DEFAULT_ALLOWED_LEAVES);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  
  const getUserId = useMemo(() => {
    return (): string | null => {
      try {
        const t = getToken();
        if (!t) return null;
        const parts = t.split('.');
        if (parts.length < 2) return null;
        const decoded = JSON.parse(atob(parts[1]));
        return decoded?.sub || decoded?.id || null;
      } catch (err) {
        console.error('فشل فك تشفير التوكن:', err);
        return null;
      }
    };
  }, []);

  const fetchLeaves = () => {
    const userId = getUserId();
    if (!userId) { setLoading(false); return; }
    
    fetch(API_URL + '/users/leaves/employee/' + userId, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => { setLeaves(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { console.error('فشل جلب الإجازات:', err); setLoading(false); });

    fetch(API_URL + '/users/' + userId, { headers: { 'Authorization': 'Bearer ' + getToken() } })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (data && typeof data.allowedLeaves === 'number') {
          setAllowedLeaves(data.allowedLeaves);
        }
      })
      .catch((err) => { console.error('فشل جلب بيانات الموظف:', err); });
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = getUserId();
    if (!userId || !startDate || !endDate || !reason) return;
    
    // Validate dates
    if (endDate < startDate) {
      setStatusMsg('❌ خطأ: تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية.');
      setTimeout(() => setStatusMsg(''), STATUS_MSG_DURATION);
      return;
    }

    const days = calcDays(startDate, endDate);
    if (days === 0) {
      setStatusMsg('❌ خطأ: التواريخ المدخلة غير صحيحة.');
      setTimeout(() => setStatusMsg(''), STATUS_MSG_DURATION);
      return;
    }

    // Check balance
    if (days > availableLeaves) {
      setStatusMsg('❌ خطأ: عدد الأيام المطلوبة أكبر من رصيدك المتوفر.');
      setTimeout(() => setStatusMsg(''), STATUS_MSG_DURATION);
      return;
    }
    
    // Auto-calculate dayName
    const dName = new Date(startDate).toLocaleDateString('ar-EG', { weekday: 'long' });
    const finalReason = `[يوم ${dName}] ${reason}`;
    
    try {
      const res = await fetch(API_URL + '/users/leaves/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
        body: JSON.stringify({ employeeId: userId, startDate, endDate, reason: finalReason, type })
      });
      if (res.ok) {
        setStatusMsg('تم إرسال طلب الإجازة بنجاح! ⏳ بانتظار موافقة المدير');
        setStartDate(today); setEndDate(today); setReason(''); 
        fetchLeaves();
        setTab('history');
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatusMsg(errData.message || 'حدث خطأ في إرسال الطلب');
      }
    } catch (err) {
      console.error('خطأ في إرسال طلب الإجازة:', err);
      setStatusMsg('فشل الاتصال بالخادم');
    }
    setTimeout(() => setStatusMsg(''), STATUS_MSG_DURATION);
  };

  const statusColors: Record<string, string> = { 'PENDING': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 'APPROVED': 'bg-success/10 text-success border-success/20', 'REJECTED': 'bg-error/10 text-error border-error/20' };
  const statusLabels: Record<string, string> = { 'PENDING': '⏳ بانتظار الرد', 'APPROVED': '✅ مقبولة', 'REJECTED': '❌ مرفوضة' };

  const calcDays = (start: string, end: string): number => {
    if (!start || !end || end < start) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const days = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 0;
  };

  const usedDays = leaves.filter(l => l.status === 'APPROVED').reduce((sum, l) => sum + calcDays(l.startDate, l.endDate), 0);
  const availableLeaves = allowedLeaves - usedDays;

  const handleDaysChange = (daysStr: string) => {
    const days = parseInt(daysStr);
    if (!isNaN(days) && days >= 1) {
      const s = new Date(startDate);
      if (isNaN(s.getTime())) return;
      s.setDate(s.getDate() + (days - 1));
      setEndDate(s.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto animate-in fade-in duration-500 pb-10">
      {statusMsg && <div className="bg-primary/10 text-primary p-3 rounded-xl text-sm font-bold border border-primary/20 fixed top-4 left-1/2 -translate-x-1/2 z-50 shadow-lg">{statusMsg}</div>}

      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">الإجازات</h1>
          <p className="text-onSurfaceVariant text-sm">اطلب إجازة وتابع حالة طلباتك</p>
        </div>
        
        <div className="glass-card px-4 py-2 flex flex-col items-center">
          <span className="text-[10px] text-onSurfaceVariant font-bold">الرصيد المتوفر</span>
          <span className={`text-2xl font-black ${availableLeaves <= 0 ? 'text-error' : 'text-primary'}`}>{availableLeaves} <span className="text-sm font-normal text-onSurfaceVariant">يوم</span></span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('request')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'request' ? 'gradient-bg text-white' : 'bg-surfaceContainerLow text-onSurfaceVariant'}`}>📝 تقديم طلب</button>
        <button onClick={() => setTab('history')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'history' ? 'gradient-bg text-white' : 'bg-surfaceContainerLow text-onSurfaceVariant'}`}>📋 طلباتي ({leaves.length})</button>
      </div>

      {tab === 'request' ? (
        <form onSubmit={handleSubmit} className="glass-card p-8 flex flex-col gap-5">
          <h2 className="text-lg font-bold text-primary mb-2">تقديم طلب إجازة جديد</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-onSurfaceVariant">تاريخ البداية</label>
              <input type="date" required value={startDate} onChange={e => {
                 setStartDate(e.target.value);
                 // Keep the duration the same when start date changes
                 const oldDays = calcDays(startDate, endDate);
                 if (oldDays >= 1) {
                   const s = new Date(e.target.value);
                   if (!isNaN(s.getTime())) {
                     s.setDate(s.getDate() + (oldDays - 1));
                     setEndDate(s.toISOString().split('T')[0]);
                   }
                 }
              }} className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm border focus:border-primary transition-colors" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-onSurfaceVariant">تاريخ النهاية</label>
              <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm border focus:border-primary transition-colors" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-onSurfaceVariant">عدد أيام الإجازة</label>
              <input type="number" min="1" value={calcDays(startDate, endDate)} onChange={e => handleDaysChange(e.target.value)} className={`bg-surfaceContainerHigh p-3 rounded-lg outline-none font-bold text-sm text-center border focus:border-primary transition-colors ${calcDays(startDate, endDate) > availableLeaves ? 'text-error border-error/50 bg-error/10' : 'text-primary'}`} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-onSurfaceVariant">نوع الإجازة</label>
            <select value={type} onChange={e => setType(e.target.value)} className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm">
              <option value="عادية">🏖️ عادية</option>
              <option value="مرضية">🏥 مرضية</option>
              <option value="طارئة">🚨 طارئة</option>
              <option value="أخرى">📌 أخرى</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-onSurfaceVariant">سبب الإجازة</label>
            <textarea required value={reason} onChange={e => setReason(e.target.value)} placeholder="اكتب سبب طلب الإجازة بالتفصيل..." rows={3} className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm resize-none" />
          </div>
          <button type="submit" className="gradient-bg text-white p-3 rounded-xl font-bold text-sm hover:shadow-ambient transition-shadow">إرسال الطلب</button>
        </form>
      ) : (
        <div className="glass-card p-6 flex flex-col gap-4 min-h-[300px]">
          {loading ? <p className="text-center text-onSurfaceVariant">جاري التحميل...</p> : leaves.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center gap-3 text-onSurfaceVariant"><span className="text-5xl opacity-30">📋</span><p>لم تقدم أي طلب إجازة بعد</p></div>
          ) : leaves.map(req => (
            <div key={req.id} className={`p-4 rounded-xl border ${statusColors[req.status]} flex flex-col gap-2`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">{req.type}</span>
                <span className="text-xs font-bold">{statusLabels[req.status]}</span>
              </div>
              <div className="flex gap-4 text-xs">
                <span>📅 {req.startDate} → {req.endDate}</span>
              </div>
              <p className="text-xs">{req.reason}</p>
              {req.adminNotes && <p className="text-xs bg-surfaceContainerHigh p-2 rounded-lg mt-1">💬 رد المدير: {req.adminNotes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
