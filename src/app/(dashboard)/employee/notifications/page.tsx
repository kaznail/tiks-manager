"use client"
import React, { useState, useEffect, useMemo } from 'react';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ───
interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function EmployeeNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
    fetch(API_URL + '/users/' + userId + '/notifications', {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => { setNotifications(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { console.error('فشل جلب الإشعارات:', err); setLoading(false); });
  }, [getUserId]);

  if (loading) return <div className="p-8 text-onSurfaceVariant">جاري تحميل الإشعارات...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <header>
        <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">إشعاراتي</h1>
        <p className="text-onSurfaceVariant text-sm">جميع الرسائل والتنبيهات الموجهة إليك من الإدارة</p>
      </header>

      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="text-center p-16 text-onSurfaceVariant flex flex-col items-center gap-3">
            <span className="text-5xl opacity-40">🔔</span>
            <p>لا توجد إشعارات حالياً.</p>
          </div>
        ) : notifications.map(notif => (
          <div key={notif.id} className={`glass-card p-5 flex items-start gap-4 transition-all ${notif.isRead ? 'opacity-60' : 'border-r-4 border-primary'}`}>
            <span className="text-2xl mt-1">{notif.isRead ? '📭' : '📬'}</span>
            <div className="flex-1">
              <p className="font-bold text-sm leading-relaxed">{notif.message}</p>
              <p className="text-[11px] text-onSurfaceVariant mt-2">{new Date(notif.createdAt).toLocaleString('ar-EG')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
