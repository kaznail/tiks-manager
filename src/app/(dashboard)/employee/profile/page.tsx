"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { resolveFileUrl } from '../../../../utils/resolveFileUrl';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const STATUS_MSG_DURATION = 4000;

// ─── Types ───
interface AccountLink {
  id: string;
  url: string;
  platform?: string;
}

interface Achievement {
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface EmployeeData {
  id: string;
  name: string;
  fullName?: string;
  username: string;
  photo1?: string;
  age?: number;
  education?: string;
  province?: string;
  gender?: string;
  platform?: string;
  salary?: number;
  startDate: string;
  reports?: unknown[];
  warnings?: unknown[];
  rewards?: unknown[];
  accountLinks?: AccountLink[];
}

export default function EmployeeProfilePage() {
  const [emp, setEmp] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passType, setPassType] = useState<'success'|'error'>('success');
  const [changingPass, setChangingPass] = useState(false);
  const [selfRating, setSelfRating] = useState(3);
  const [selfNotes, setSelfNotes] = useState('');
  const [selfMsg, setSelfMsg] = useState('');
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  
  const getUserId = useMemo(() => {
    return (): string | null => {
      try {
        const t = getToken();
        if (!t) return null;
        const payload = t.split('.');
        if (payload.length < 2) return null;
        const decoded = JSON.parse(atob(payload[1]));
        return decoded?.sub || decoded?.id || null;
      } catch (err) {
        console.error('فشل فك تشفير التوكن:', err);
        return null;
      }
    };
  }, []);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) { setLoading(false); return; }
    
    Promise.all([
      fetch(API_URL + '/users/' + userId, { headers: { 'Authorization': 'Bearer ' + getToken() } })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
      fetch(API_URL + '/users/achievements/' + userId, { headers: { 'Authorization': 'Bearer ' + getToken() } })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .catch((err) => { console.error('فشل جلب الإنجازات:', err); return []; })
    ]).then(([empData, achData]) => {
      setEmp(empData);
      setAchievements(Array.isArray(achData) ? achData : []);
      setLoading(false);
    }).catch((err) => { console.error('فشل جلب بيانات الملف الشخصي:', err); setLoading(false); });
  }, [getUserId]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) { setPassMsg('كلمات المرور غير متطابقة'); setPassType('error'); return; }
    if (newPass.length < 4) { setPassMsg('يجب أن تكون كلمة المرور 4 أحرف على الأقل'); setPassType('error'); return; }
    setChangingPass(true);
    try {
      const res = await fetch(API_URL + '/users/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
        body: JSON.stringify({ userId: getUserId(), oldPassword: oldPass, newPassword: newPass })
      });
      if (res.ok) { setPassMsg('تم تغيير كلمة المرور بنجاح ✅'); setPassType('success'); setOldPass(''); setNewPass(''); setConfirmPass(''); }
      else { const data = await res.json().catch(() => ({})); setPassMsg(data.message || 'كلمة المرور القديمة غير صحيحة'); setPassType('error'); }
    } catch (err) {
      console.error('خطأ في تغيير كلمة المرور:', err);
      setPassMsg('فشل الاتصال بالخادم');
      setPassType('error');
    }
    setChangingPass(false);
    setTimeout(() => setPassMsg(''), STATUS_MSG_DURATION);
  };

  const handleSelfAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const month = new Date().toISOString().substring(0, 7);
      const res = await fetch(API_URL + '/users/self-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
        body: JSON.stringify({ employeeId: getUserId(), month, rating: selfRating, notes: selfNotes })
      });
      if (!res.ok) console.error('فشل حفظ التقييم:', res.status);
      setSelfMsg('تم حفظ تقييمك الذاتي بنجاح! ✅');
      setSelfNotes('');
    } catch (err) {
      console.error('خطأ في حفظ التقييم:', err);
      setSelfMsg('فشل حفظ التقييم');
    }
    setTimeout(() => setSelfMsg(''), STATUS_MSG_DURATION);
  };

  /** Safe first character accessor */
  const getInitial = (text?: string): string => {
    if (!text || text.length === 0) return '؟';
    return text[0];
  };

  if (loading) return <div className="flex flex-col gap-4 p-10">{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card"></div>)}</div>;
  if (!emp) return <div className="p-10 text-error text-center">لم يتم العثور على بياناتك</div>;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in pb-10">
      <header>
        <h1 className="text-3xl font-bold text-onSurface mb-1">ملفي الشخصي</h1>
        <p className="text-sm text-onSurfaceVariant">بياناتك الشخصية وإعدادات حسابك</p>
      </header>

      {/* Premium Profile Card */}
      <div className="bg-gradient-to-br from-surfaceContainerLowest to-surfaceContainer p-10 relative overflow-hidden rounded-[2.5rem] shadow-2xl border border-outlineVariant/20 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none mix-blend-screen scale-150 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen -z-0"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 relative z-10">
          <div className="relative group/pic cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full opacity-30 group-hover/pic:opacity-100 blur transition duration-1000 group-hover/pic:duration-200 animate-in spin-in"></div>
            {emp.photo1 ? (
              <img src={resolveFileUrl(emp.photo1)} className="relative w-36 h-36 rounded-full object-cover border-4 border-surface shadow-[0_0_30px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-out group-hover/pic:scale-105" alt={`صورة ${emp.fullName || emp.name}`} />
            ) : (
              <div className="relative w-36 h-36 bg-surfaceContainer rounded-full flex items-center justify-center text-primary text-5xl font-black border-4 border-surface shadow-lg transition-transform duration-500 group-hover/pic:scale-105">
                {getInitial(emp.name)}
              </div>
            )}
            <div className="absolute bottom-1 right-1 w-8 h-8 bg-success rounded-full border-4 border-surface shadow-md">
              <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-50"></span>
            </div>
          </div>
          
          <div className="text-center md:text-right flex-1 mt-4 md:mt-0">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-l from-onSurface to-onSurfaceVariant drop-shadow-sm mb-1">{emp.fullName || emp.name}</h2>
            <p className="text-onSurfaceVariant text-lg font-bold mb-3">@{emp.username}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black border border-primary/20">{emp.platform || 'بدون منصة'} المفضل</span>
              {emp.education && <span className="bg-secondary/10 text-secondary px-4 py-1.5 rounded-full text-xs font-black border border-secondary/20">🎓 {emp.education}</span>}
              <span className="bg-surfaceContainerHigh text-onSurface px-4 py-1.5 rounded-full text-xs font-black">🌟 موظف متميز</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 relative z-10">
          <InfoCard label="العمر" value={emp.age ? emp.age + ' سنة' : '—'} />
          <InfoCard label="الدراسة" value={emp.education || '—'} />
          <InfoCard label="المحافظة" value={emp.province || '—'} />
          <InfoCard label="الجنس" value={emp.gender || '—'} />
          <InfoCard label="تاريخ الانضمام" value={new Date(emp.startDate).toLocaleDateString('ar-EG')} />
          <InfoCard label="الراتب" value={emp.salary ? emp.salary.toLocaleString() + ' د.ع' : '—'} />
          <InfoCard label="التقارير المنجزة" value={emp.reports?.length || 0} />
          <InfoCard label="التحذيرات" value={emp.warnings?.length || 0} />
          <InfoCard label="المكافآت المكتسبة" value={emp.rewards?.length || 0} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change Password */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-lg text-primary mb-4">🔐 تغيير كلمة المرور</h3>
          {passMsg && <div className={`p-3 rounded-lg text-sm mb-3 font-bold ${passType === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>{passMsg}</div>}
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
            <input type="password" required value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="كلمة المرور الحالية" className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm" />
            <input type="password" required value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="كلمة المرور الجديدة" className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm" />
            <input type="password" required value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="تأكيد كلمة المرور الجديدة" className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm" />
            <button type="submit" disabled={changingPass} className="gradient-bg text-white p-3 rounded-xl font-bold text-sm disabled:opacity-50">{changingPass ? 'جاري التغيير...' : 'تغيير كلمة المرور'}</button>
          </form>
        </div>

        {/* Self Assessment */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-lg text-secondary mb-4">📊 تقييمي الذاتي للشهر</h3>
          {selfMsg && <div className="bg-success/10 text-success p-3 rounded-lg text-sm mb-3 font-bold">{selfMsg}</div>}
          <form onSubmit={handleSelfAssessment} className="flex flex-col gap-3">
            <label className="text-xs text-onSurfaceVariant font-bold">كيف تقيّم أداءك هذا الشهر؟</label>
            <div className="flex gap-2 justify-center py-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setSelfRating(s)} className={`text-3xl transition-transform hover:scale-125 ${selfRating >= s ? '' : 'opacity-20'}`}>{selfRating >= s ? '⭐' : '☆'}</button>
              ))}
            </div>
            <textarea value={selfNotes} onChange={e => setSelfNotes(e.target.value)} placeholder="ملاحظات إضافية عن أدائك (اختياري)..." rows={3} className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm resize-none" />
            <button type="submit" className="bg-secondary text-white p-3 rounded-xl font-bold text-sm hover:brightness-110">حفظ التقييم</button>
          </form>
        </div>
      </div>

      {/* Account Links */}
      {emp.accountLinks && emp.accountLinks.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-bold text-lg mb-3">🔗 حساباتي المربوطة</h3>
          <div className="flex flex-wrap gap-3">
            {emp.accountLinks.map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="bg-surfaceContainerLow px-4 py-2 rounded-xl text-sm text-primary hover:bg-primary/10 transition-colors">{link.platform || 'رابط'}: {link.url.substring(0, 30)}...</a>
            ))}
          </div>
        </div>
      )}

      {/* Achievements Container */}
      {achievements.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-bold text-lg mb-4 text-primary w-full">🏆 إنجازاتي</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {achievements.map((ach, idx) => (
              <div key={idx} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all ${ach.unlocked ? 'bg-surfaceContainerHigh border-2 border-primary/20 hover:scale-105 shadow-sm cursor-pointer' : 'bg-surfaceContainerLow opacity-40 grayscale'}`} title={ach.description}>
                <div className="text-4xl mb-2 drop-shadow-md">{ach.icon}</div>
                <h4 className={`text-sm font-bold ${ach.unlocked ? 'text-primary' : 'text-onSurfaceVariant'}`}>{ach.title}</h4>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surfaceContainerLow p-3 rounded-xl">
      <span className="text-[10px] text-onSurfaceVariant block mb-1">{label}</span>
      <span className="font-bold text-sm">{value}</span>
    </div>
  );
}
