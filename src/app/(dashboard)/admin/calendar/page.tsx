"use client"
import React, { useState, useEffect } from 'react';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ───
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  description?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('عام');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchEvents = () => {
    fetch(API_URL + '/users/events/all', { headers: { 'Authorization': 'Bearer ' + getToken() } })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch((err) => { console.error('فشل جلب الأحداث:', err); });
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL + '/users/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
        body: JSON.stringify({ title, date, type, description })
      });
      if (!res.ok) console.error('فشل إنشاء الحدث:', res.status);
      setTitle(''); setDate(''); setDescription(''); setShowForm(false);
      fetchEvents();
    } catch (err) {
      console.error('خطأ في إنشاء الحدث:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(API_URL + '/users/events/' + id, {
        method: 'DELETE', headers: { 'Authorization': 'Bearer ' + getToken() }
      });
      if (!res.ok) console.error('فشل حذف الحدث:', res.status);
      fetchEvents();
    } catch (err) {
      console.error('خطأ في حذف الحدث:', err);
    }
  };

  const typeColors: Record<string, string> = {
    'راتب': 'bg-secondary/10 text-secondary border-secondary/20',
    'إجازة': 'bg-tertiary/10 text-tertiary border-tertiary/20',
    'مناسبة': 'bg-primary/10 text-primary border-primary/20',
    'عام': 'bg-surfaceContainerHigh text-onSurface border-outlineVariant/20',
  };

  // Group events by month
  const grouped = events.reduce((acc: Record<string, CalendarEvent[]>, ev) => {
    const month = ev.date?.substring(0, 7) || 'unknown';
    if (!acc[month]) acc[month] = [];
    acc[month].push(ev);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">تقويم الأحداث</h1>
          <p className="text-onSurfaceVariant text-sm">مواعيد الرواتب، الإجازات، المناسبات</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="gradient-bg text-white px-5 py-3 rounded-xl font-bold text-sm hover:shadow-ambient transition-shadow">
          {showForm ? 'إلغاء' : '+ إضافة حدث'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الحدث" className="bg-surfaceContainerLow p-3 rounded-xl border border-outlineVariant/20 outline-none focus:ring-2 focus:ring-primary text-sm" />
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="bg-surfaceContainerLow p-3 rounded-xl border border-outlineVariant/20 outline-none focus:ring-2 focus:ring-primary text-sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={type} onChange={e => setType(e.target.value)} className="bg-surfaceContainerLow p-3 rounded-xl border border-outlineVariant/20 outline-none text-sm font-bold">
              <option>عام</option><option>راتب</option><option>إجازة</option><option>مناسبة</option>
            </select>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف إضافي (اختياري)" className="bg-surfaceContainerLow p-3 rounded-xl border border-outlineVariant/20 outline-none text-sm" />
          </div>
          <button type="submit" className="bg-primary text-white font-bold p-3 rounded-xl hover:opacity-90">حفظ الحدث 📅</button>
        </form>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center p-16 text-onSurfaceVariant glass-card flex flex-col items-center gap-3">
          <span className="text-5xl opacity-40">📅</span>
          <p>لا توجد أحداث مسجلة بعد.</p>
        </div>
      ) : Object.entries(grouped).map(([month, evts]) => (
        <div key={month}>
          <h3 className="font-bold text-sm text-onSurfaceVariant mb-3">{month}</h3>
          <div className="flex flex-col gap-2">
            {evts.map((ev) => (
              <div key={ev.id} className={`p-4 rounded-xl border flex items-center justify-between group ${typeColors[ev.type] || typeColors['عام']}`}>
                <div className="flex items-center gap-4">
                  <span className="text-lg">{ev.type === 'راتب' ? '💰' : ev.type === 'إجازة' ? '🏖️' : ev.type === 'مناسبة' ? '🎉' : '📌'}</span>
                  <div>
                    <p className="font-bold text-sm">{ev.title}</p>
                    {ev.description && <p className="text-[10px] opacity-70 mt-0.5">{ev.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold">{ev.date}</span>
                  <button onClick={() => handleDelete(ev.id)} className="opacity-0 group-hover:opacity-100 text-error text-xs font-bold hover:underline transition-opacity">حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
