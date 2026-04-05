"use client"
import React, { useState, useEffect } from 'react';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const MAX_TITLE_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 500;
const STATUS_MSG_DURATION = 5000;

// ─── Types ───
interface Employee {
  id: string;
  name: string;
  fullName?: string;
}

interface NotificationLog {
  id: string;
  message: string;
  createdAt: string;
  employee?: { name: string };
}

export default function NotificationsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchEmployees = () => {
    const token = getToken();
    if (!token) return;
    fetch(API_URL + '/users', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(res => { if (!res.ok) throw new Error('فشل جلب الموظفين'); return res.json(); })
      .then(data => setEmployees(Array.isArray(data) ? data : []))
      .catch(err => { console.error(err); setStatusMsg('فشل في جلب بيانات الموظفين'); setStatusType('error'); setTimeout(() => setStatusMsg(''), STATUS_MSG_DURATION); });
  };

  const fetchLogs = () => {
    const token = getToken();
    if (!token) return;
    fetch(API_URL + '/users/logs/notifications', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(res => { if (!res.ok) throw new Error('فشل جلب الإشعارات'); return res.json(); })
      .then(data => setLogs(Array.isArray(data) ? data : []))
      .catch(err => { console.error(err); setStatusMsg('فشل في جلب سجل الإشعارات'); setStatusType('error'); setTimeout(() => setStatusMsg(''), STATUS_MSG_DURATION); });
  };

  useEffect(() => {
    fetchEmployees();
    fetchLogs();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    // Input validation
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!trimmedTitle || trimmedTitle.length === 0) {
      setStatusType('error');
      setStatusMsg('يرجى إدخال عنوان الإشعار.');
      setTimeout(() => setStatusMsg(''), STATUS_MSG_DURATION);
      return;
    }

    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      setStatusType('error');
      setStatusMsg(`عنوان الإشعار يجب أن لا يتجاوز ${MAX_TITLE_LENGTH} حرف.`);
      setTimeout(() => setStatusMsg(''), STATUS_MSG_DURATION);
      return;
    }

    if (!trimmedMessage || trimmedMessage.length === 0) {
      setStatusType('error');
      setStatusMsg('يرجى إدخال محتوى الرسالة.');
      setTimeout(() => setStatusMsg(''), STATUS_MSG_DURATION);
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setStatusType('error');
      setStatusMsg(`محتوى الرسالة يجب أن لا يتجاوز ${MAX_MESSAGE_LENGTH} حرف.`);
      setTimeout(() => setStatusMsg(''), STATUS_MSG_DURATION);
      return;
    }

    setSending(true);
    setStatusMsg('');

    try {
      const token = getToken();
      let res: Response;

      if (selectedUser === 'ALL') {
        res = await fetch(API_URL + '/users/notifications/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ title: trimmedTitle, message: trimmedMessage })
        });
      } else {
        res = await fetch(API_URL + '/users/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ employeeId: selectedUser, title: trimmedTitle, message: trimmedMessage })
        });
      }

      if (res.ok) {
        setStatusType('success');
        setStatusMsg(selectedUser === 'ALL' ? 'تم البث لجميع الموظفين بنجاح!' : 'تم الإرسال بنجاح!');
        setTitle('');
        setMessage('');
        fetchLogs();
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatusType('error');
        setStatusMsg(errData.message || 'فشل الإرسال. تحقق من البيانات.');
      }
    } catch (error) {
      console.error('خطأ في إرسال الإشعار:', error);
      setStatusType('error');
      setStatusMsg('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setSending(false);
      setTimeout(() => setStatusMsg(''), STATUS_MSG_DURATION);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = getToken();
      const res = await fetch(API_URL + '/users/notifications/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) fetchLogs();
      else console.error('فشل حذف الإشعار:', res.status);
    } catch (err) {
      console.error('خطأ في حذف الإشعار:', err);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">مركز الإشعارات والبث</h1>
          <p className="text-onSurfaceVariant text-sm">أرسل إشعارات فورية تظهر على هواتف/حواسيب الموظفين باستخدام Firebase</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Send Notification Box */}
         <div className="glass-card p-6 h-fit relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 gradient-bg"></div>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">📢 إصدار إشعار جديد</h2>
            
            {statusMsg && (
              <div className={`p-3 rounded-lg text-sm mb-4 font-bold border ${statusType === 'success' ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
                {statusMsg}
              </div>
            )}

            <form onSubmit={handleSendNotification} className="flex flex-col gap-4">
               <div>
                 <label className="text-xs font-bold text-onSurfaceVariant block mb-2">توجيه الإشعار إلى:</label>
                 <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full bg-surfaceContainerLow p-3 rounded-xl border border-outlineVariant/20 outline-none focus:ring-2 focus:ring-primary font-bold text-sm cursor-pointer">
                    <option value="ALL">إلى جميع الموظفين (بث عام)</option>
                    {employees.map(emp => (
                       <option key={emp.id} value={emp.id}>{emp.fullName || emp.name}</option>
                    ))}
                 </select>
               </div>

               <div>
                 <label className="text-xs font-bold text-onSurfaceVariant block mb-2">عنوان الإشعار (موجز):</label>
                 <input type="text" required maxLength={MAX_TITLE_LENGTH} value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: تنبيه إداري، تحديث جديد..." className="w-full bg-surfaceContainerLow p-3 rounded-xl border border-outlineVariant/20 outline-none focus:ring-2 focus:ring-primary text-sm" />
                 <span className="text-[10px] text-onSurfaceVariant mt-1 block">{title.length}/{MAX_TITLE_LENGTH}</span>
               </div>

               <div>
                 <label className="text-xs font-bold text-onSurfaceVariant block mb-2">الرسالة التفصيلية:</label>
                 <textarea required maxLength={MAX_MESSAGE_LENGTH} value={message} onChange={e => setMessage(e.target.value)} placeholder="اكتب محتوى الإشعار ليتم دفعه للموظف..." rows={4} className="w-full bg-surfaceContainerLow p-3 rounded-xl border border-outlineVariant/20 outline-none focus:ring-2 focus:ring-primary text-sm resize-none custom-scroll" />
                 <span className="text-[10px] text-onSurfaceVariant mt-1 block">{message.length}/{MAX_MESSAGE_LENGTH}</span>
               </div>

               <button disabled={sending} type="submit" className="gradient-bg text-white font-bold p-4 rounded-xl mt-2 flex justify-center items-center gap-2 hover:shadow-ambient transition-all disabled:opacity-50">
                 {sending ? 'جاري الإرسال...' : 'إرسال الإشعار 🚀'}
               </button>
            </form>
         </div>

         {/* Logs History */}
         <div className="glass-card p-6 flex flex-col h-fit md:min-h-[500px]">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">📂 سجل الإشعارات المرسلة ({logs.length})</h2>
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scroll pr-2">
               {logs.length === 0 ? (
                  <p className="text-onSurfaceVariant text-sm text-center mt-10">لم يتم إرسال أي إشعارات بعد.</p>
               ) : logs.map(log => (
                  <div key={log.id} className="bg-surfaceContainerLowest border border-outlineVariant/10 p-4 rounded-xl flex flex-col gap-2 hover:bg-surfaceContainerLow transition-colors relative group">
                     <p className="text-[10px] text-tertiary font-bold px-2 py-0.5 bg-tertiary/10 rounded w-fit">{log.employee?.name || 'مجهول'}</p>
                     <p className="font-bold text-sm leading-relaxed">{log.message}</p>
                     <p className="text-[10px] text-onSurfaceVariant">{new Date(log.createdAt).toLocaleString('ar-EG')}</p>
                     
                     <button onClick={() => handleDelete(log.id)} className="absolute top-4 left-4 text-error opacity-0 group-hover:opacity-100 transition-opacity bg-error/10 hover:bg-error hover:text-white px-2 py-1 flex items-center justify-center rounded text-xs font-bold border border-error/20">حذف</button>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
