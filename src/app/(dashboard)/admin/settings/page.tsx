"use client"
import React, { useState, useEffect } from 'react';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const STATUS_MSG_DURATION = 3000;

// ─── Types ───
interface Setting {
  key: string;
  value: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [siteName, setSiteName] = useState('موقع شؤون الموظفين');
  const [warningHour, setWarningHour] = useState('23');
  const [adminSecondaryCode, setAdminSecondaryCode] = useState('');
  const [backupMsg, setBackupMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetch(API_URL + '/users/settings/all', { headers: { 'Authorization': 'Bearer ' + getToken() } })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setSettings(data);
          const sn = data.find((s: Setting) => s.key === 'siteName');
          const wh = data.find((s: Setting) => s.key === 'warningHour');
          const sc = data.find((s: Setting) => s.key === 'adminSecondaryCode');
          if (sn) setSiteName(sn.value);
          if (wh) setWarningHour(wh.value);
          if (sc) setAdminSecondaryCode(sc.value);
        }
        setLoading(false);
      })
      .catch((err) => { console.error('فشل جلب الإعدادات:', err); setLoading(false); });
  }, []);

  const saveSetting = async (key: string, value: string) => {
    const res = await fetch(API_URL + '/users/settings/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
      body: JSON.stringify({ key, value })
    });
    if (!res.ok) console.error('فشل حفظ الإعداد:', key, res.status);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSetting('siteName', siteName);
      await saveSetting('warningHour', warningHour);
      await saveSetting('adminSecondaryCode', adminSecondaryCode);
      setBackupMsg('تم حفظ الإعدادات بنجاح ✓');
    } catch (err) {
      console.error('خطأ في حفظ الإعدادات:', err);
      setBackupMsg('فشل حفظ الإعدادات');
    }
    setSaving(false);
    setTimeout(() => setBackupMsg(''), STATUS_MSG_DURATION);
  };

  const handleBackup = () => {
    setBackupMsg('⚠️ النسخ الاحتياطي متاح عبر لوحة تحكم Supabase مباشرة.');
    setTimeout(() => setBackupMsg(''), STATUS_MSG_DURATION + 1000);
  };

  if (loading) return <div className="p-8 text-onSurfaceVariant">جاري التحميل...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto animate-in fade-in duration-500 pb-10">
      <header>
        <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">إعدادات النظام</h1>
        <p className="text-onSurfaceVariant text-sm">تخصيص الموقع والنظام</p>
      </header>

      {backupMsg && <div className="bg-success/10 text-success p-3 rounded-xl text-sm font-bold border border-success/20">{backupMsg}</div>}

      <div className="glass-card p-6 flex flex-col gap-6">
        <h2 className="text-lg font-bold">⚙️ الإعدادات العامة</h2>

        <div>
          <label className="text-xs font-bold text-onSurfaceVariant block mb-2">اسم الموقع</label>
          <input type="text" value={siteName} onChange={e => setSiteName(e.target.value)} className="w-full bg-surfaceContainerLow p-3 rounded-xl border border-outlineVariant/20 outline-none focus:ring-2 focus:ring-primary text-sm font-bold" />
        </div>

        <div>
          <label className="text-xs font-bold text-onSurfaceVariant block mb-2">ساعة التحذير التلقائي (مساءً)</label>
          <select value={warningHour} onChange={e => setWarningHour(e.target.value)} className="w-full bg-surfaceContainerLow p-3 rounded-xl border border-outlineVariant/20 outline-none text-sm font-bold">
            {Array.from({ length: 12 }, (_, i) => i + 12).map(h => (
              <option key={h} value={h}>{h}:00</option>
            ))}
          </select>
          <p className="text-[10px] text-onSurfaceVariant mt-1">الموظف الذي لم يرسل تقريره قبل هذه الساعة سيتم إنشاء طلب تحذير تلقائي له</p>
        </div>

        <div>
          <label className="text-xs font-bold text-warning block mb-2">طبقة التحقق الثانية لإدارة النظام (الرقم الإضافي)</label>
          <input type="password" value={adminSecondaryCode} onChange={e => setAdminSecondaryCode(e.target.value)} className="w-full bg-surfaceContainerLow p-3 rounded-xl border border-warning/30 outline-none focus:ring-2 focus:ring-warning text-sm font-bold dir-ltr text-left font-mono" placeholder="اتركه فارغاً لتعطيل الميزة" />
          <p className="text-[10px] text-onSurfaceVariant mt-1">لحماية الحساب، إذا أدخلت رقماً هنا؛ لن تتمكن من الدخول للوحة التحكم مستقبلاً إلا إذا قمت بإدخاله بجانب الرمز الأساسي.</p>
        </div>

        <button onClick={handleSave} disabled={saving} className="gradient-bg text-white font-bold p-4 rounded-xl hover:shadow-ambient transition-shadow disabled:opacity-50">{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</button>
      </div>

      <div className="glass-card p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold">💾 النسخ الاحتياطي</h2>
        <p className="text-sm text-onSurfaceVariant">قم بتحميل نسخة احتياطية من قاعدة البيانات بالكامل لحفظها على جهازك</p>
        <button onClick={handleBackup} className="bg-secondary text-white font-bold p-4 rounded-xl hover:opacity-90 transition-opacity">تحميل نسخة احتياطية 📥</button>
      </div>

      <div className="glass-card p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold">📊 معلومات النظام</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surfaceContainerLow p-3 rounded-xl">
            <span className="text-[10px] text-onSurfaceVariant block">الإصدار</span>
            <span className="font-bold text-sm">v2.0.0</span>
          </div>
          <div className="bg-surfaceContainerLow p-3 rounded-xl">
            <span className="text-[10px] text-onSurfaceVariant block">قاعدة البيانات</span>
            <span className="font-bold text-sm">PostgreSQL (Supabase ☁️)</span>
          </div>
          <div className="bg-surfaceContainerLow p-3 rounded-xl">
            <span className="text-[10px] text-onSurfaceVariant block">الباك-إند</span>
            <span className="font-bold text-sm">NestJS</span>
          </div>
          <div className="bg-surfaceContainerLow p-3 rounded-xl">
            <span className="text-[10px] text-onSurfaceVariant block">الفرونت-إند</span>
            <span className="font-bold text-sm">Next.js 14</span>
          </div>
        </div>
      </div>
    </div>
  );
}
