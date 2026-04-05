"use client"
import React, { useState, useEffect } from 'react';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ───
interface ActivityLog {
  id: string;
  action: string;
  details?: string;
  createdAt: string;
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetch(API_URL + '/users/logs/activity', { headers: { 'Authorization': 'Bearer ' + getToken() } })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { console.error('فشل جلب سجل النشاطات:', err); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-onSurfaceVariant">جاري التحميل...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
      <header>
        <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">سجل النشاطات</h1>
        <p className="text-onSurfaceVariant text-sm">جميع العمليات التي قام بها المدير مسجّلة هنا تلقائياً</p>
      </header>

      <div className="glass-card p-4 flex items-center gap-3">
        <span className="bg-primary text-white px-4 py-2 rounded-full font-bold">{logs.length}</span>
        <span className="text-sm text-onSurfaceVariant">عملية مسجّلة</span>
      </div>

      <div className="flex flex-col gap-1">
        {logs.length === 0 ? (
          <div className="text-center p-16 text-onSurfaceVariant glass-card">
            <p>لم يتم تسجيل أي نشاطات بعد.</p>
          </div>
        ) : logs.map((log, idx) => (
          <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-surfaceContainerLowest/50 rounded-xl transition-colors">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-3 h-3 rounded-full bg-primary/60"></div>
              {idx < logs.length - 1 && <div className="w-0.5 h-8 bg-outlineVariant/20"></div>}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{log.action}</p>
              {log.details && <p className="text-[11px] text-onSurfaceVariant mt-1">{log.details}</p>}
              <p className="text-[10px] text-onSurfaceVariant mt-1">{new Date(log.createdAt).toLocaleString('ar-EG')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
