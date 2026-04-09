"use client"
import React, { useState, useEffect } from 'react';
import { resolveFileUrl } from '../../../utils/resolveFileUrl';

export default function EmployeeDashboardPage() {
  const [tiktokUrls, setTiktokUrls] = useState<string[]>(['']);
  const [submitted, setSubmitted] = useState(false);
  const [errorString, setErrorString] = useState('');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [monthlyTarget, setMonthlyTarget] = useState<any>(null);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const getUserId = (): string | null => {
    try {
      const token = getToken();
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const decoded = JSON.parse(atob(parts[1]));
      return decoded?.sub || decoded?.id || null;
    } catch (err) {
      console.error('فشل فك تشفير التوكن:', err);
      return null;
    }
  };

  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;
    const token = getToken();
    // Fetch employee details
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users/' + userId, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.json())
      .then(data => {
        setEmployeeData(data);
        setWarnings(data.warnings || []);
        setRewards(data.rewards || []);
        setAttendance(data.attendance || []);
        const today = new Date().toISOString().split('T')[0];
        const todayAtt = (data.attendance || []).find((a: any) => a.date === today);
        setTodayRecord(todayAtt || null);

        // Check for welcome modal
        const hasSeen = localStorage.getItem(`welcome_${userId}`);
        if (!hasSeen && data) {
          localStorage.setItem(`welcome_${userId}`, 'true');
          setTimeout(() => setShowWelcomeModal(true), 1500);
        }
      })
      .catch((err) => { console.error('فشل جلب بيانات الموظف:', err); });
    // Fetch monthly target
    const month = new Date().toISOString().substring(0, 7);
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users/targets/' + userId + '/' + month, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.json())
      .then(data => { if (data && data.targetCount) setMonthlyTarget(data); })
      .catch((err) => { console.error('فشل جلب الهدف الشهري:', err); });
    // Fetch notifications
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/notifications/${userId}`, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNotifications(data); })
      .catch((err) => { console.error('فشل جلب الإشعارات:', err); });

    // Fetch leave requests
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/leaves/employee/${userId}`, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setLeaveRequests(data); })
      .catch((err) => { console.error('فشل جلب طلبات الإجازة:', err); });
  }, []);

  const markNotificationRead = (id: string) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/notifications/${id}/read`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + getToken() }
    }).then(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    });
  };

  const [videoCountInput, setVideoCountInput] = useState<string>('');
  const [setupMode, setSetupMode] = useState(true);

  const handleSetupCount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorString('');
    const count = parseInt(videoCountInput);
    if (count > 0 && count <= 20) {
      setTiktokUrls(Array(count).fill(''));
      setSetupMode(false);
    } else {
      setErrorString('يرجى إدخال عدد صحيح بين 1 و 20');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorString('');

    const validUrls = tiktokUrls.filter(u => u.trim() !== '');
    if (validUrls.length === 0) {
      setErrorString('يرجى إدخال رابط واحد على الأقل.');
      return;
    }

    if (validUrls.length !== tiktokUrls.length) {
      setErrorString('يرجى تعبئة جميع الخانات أو العودة لتغيير العدد.');
      return;
    }

    // Automatically prepend https:// if missing
    const normalizedUrls = validUrls.map(u => u.startsWith('http') ? u : `https://${u}`);
    const userPlatform = employeeData?.platform?.toLowerCase() || '';

    for (const url of normalizedUrls) {
      if (!url.includes('.') || url.includes(' ')) {
        setErrorString('يرجى إدخال روابط صحيحة (مثال: tiktok.com/@user)');
        return;
      }
      
      // Smart Platform Restriction
      if (userPlatform.includes('tiktok') || userPlatform.includes('تيك توك')) {
        if (!url.includes('tiktok.com')) return setErrorString('لقد تم تخصيصك لنشر فيديوهات (تيك توك) فقط. يرجى إدخال روابط تيك توك.');
      } else if (userPlatform.includes('insta') || userPlatform.includes('انستغرام') || userPlatform.includes('إنستغرام')) {
        if (!url.includes('instagram.com')) return setErrorString('لقد تم تخصيصك لمنصة (إنستغرام) فقط. الروابط غير مطابقة.');
      } else if (userPlatform.includes('youtube') || userPlatform.includes('يوتيوب')) {
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) return setErrorString('يرجى إدخال روابط يوتيوب صحيحة.');
      } else if (userPlatform.includes('facebook') || userPlatform.includes('فيس') || userPlatform.includes('فيسبوك')) {
        if (!url.includes('facebook.com') && !url.includes('fb.watch')) return setErrorString('يرجى إدخال روابط فيسبوك صحيحة.');
      }
    }

    try {
      const token = getToken();
      const userId = getUserId();

      // Submit each URL as a report using normalizedUrls!
      for (const url of normalizedUrls) {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ tiktokUrl: url })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'حدث خطأ أثناء الإرسال');
        }
      }

      // Record attendance with video links (ONLY after successful submission of all links)
      await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ employeeId: userId, videoLinks: normalizedUrls })
      });

      setSubmitted(true);
      setSetupMode(true);
      setVideoCountInput('');
      setTiktokUrls(['']);
    } catch (e: any) {
      setErrorString(e.message || 'فشل الاتصال بالخادم.');
    }
  };

  const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير ☀️' : hour < 18 ? 'مساء الخير 🌤️' : 'مساء الخير 🌙';

  const closeWelcomeModal = () => {
    setShowWelcomeModal(false);
    const userId = getUserId();
    if (userId) localStorage.setItem(`welcome_${userId}`, 'true');
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto animate-in fade-in duration-500 pb-10">
      
      {/* Welcome Modal */}
      {showWelcomeModal && employeeData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl animate-in fade-in duration-700">
           <div className="bg-gradient-to-br from-surfaceContainerLowest to-surfaceContainer p-10 rounded-[3rem] shadow-2xl border border-outlineVariant/20 max-w-lg w-full relative overflow-hidden animate-in zoom-in-90 slide-in-from-bottom-10 duration-700 ease-out text-center">
             
             {/* Background glow effects */}
             <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen scale-150 animate-pulse"></div>
             <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen scale-150 animate-pulse delay-1000"></div>

             <div className="relative z-10 flex flex-col items-center">
               <div className="relative mb-6 group">
                 <div className="absolute -inset-2 bg-gradient-to-r from-primary to-secondary rounded-full opacity-50 blur-lg animate-spin-slow"></div>
                 {employeeData.photo1 ? (
                   <img src={resolveFileUrl(employeeData.photo1)} className="relative w-40 h-40 object-cover rounded-full border-4 border-surface shadow-2xl transform transition-transform group-hover:scale-105 duration-500" alt="Profile" />
                 ) : (
                   <div className="relative w-40 h-40 bg-surfaceContainer rounded-full flex items-center justify-center text-primary text-6xl font-black border-4 border-surface shadow-2xl">
                     {employeeData.name?.[0]}
                   </div>
                 )}
               </div>
               
               <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2 animate-in slide-in-from-bottom-4 delay-200 fill-mode-both">{employeeData.fullName || employeeData.name}</h2>
               <p className="text-xl text-onSurface font-bold mb-4 animate-in slide-in-from-bottom-4 delay-300 fill-mode-both">@{employeeData.username}</p>
               
               <p className="text-onSurfaceVariant mb-8 leading-relaxed font-bold animate-in slide-in-from-bottom-4 delay-500 fill-mode-both">
                 أهلاً بك في شبكة الأستاذ أمير الفارس!<br/>
                 نتمنى لك يوماً مليئاً بالإنجازات والإبداع المستمر. تألق دائماً في {employeeData.platform || 'عملك'}.
               </p>

               <button 
                 onClick={closeWelcomeModal}
                 className="bg-primary text-white font-black text-lg w-full py-4 rounded-2xl shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] hover:scale-105 hover:shadow-[0_15px_40px_rgba(var(--primary-rgb),0.5)] transition-all duration-300 animate-in slide-in-from-bottom-4 delay-700 fill-mode-both"
               >
                 دخول للوحة التحكم 🚀
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Header Profile & Wallet Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Welcome Card */}
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl p-8 text-white shadow-ambient" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' }}>
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
           <div className="relative z-10 flex flex-col justify-between h-full">
             <div>
               <h1 className="text-display font-black text-3xl mb-2">{greeting}، {employeeData?.fullName?.split(' ')[0] || 'يا بطل'}!</h1>
               <p className="text-white/80 font-medium">مرحباً بك في لوحة تحكم شبكة الأستاذ أمير الفارس. يوم جديد، إبداع جديد!</p>
             </div>
             <div className="mt-8 flex gap-4">
               <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex-1 border border-white/20">
                 <p className="text-xs text-white/80 mb-1">حالة الحضور اليوم</p>
                 <p className="text-xl font-bold">{todayRecord ? '✅ حاضر' : '❌ لم يسجل'}</p>
               </div>
               <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex-1 border border-white/20">
                 <p className="text-xs text-white/80 mb-1">عدد فيديوهات اليوم</p>
                 <p className="text-xl font-bold">{todayRecord?.videoCount || 0} فيديو</p>
               </div>
             </div>
           </div>
        </div>

        {/* Smart Wallet Card */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden border border-outlineVariant/20 group">
           <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-success/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
           <div>
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-onSurfaceVariant">المحفظة الذكية 💰</h3>
               <span className="bg-success/10 text-success text-xs px-2 py-1 rounded-md font-bold border border-success/20">متاح للسحب</span>
             </div>
             <p className="text-4xl font-black text-success tracking-tight">{(employeeData?.currentBalance || 0).toLocaleString()} <span className="text-sm text-onSurfaceVariant">د.ع</span></p>
             <p className="text-xs text-onSurfaceVariant mt-2">يعكس هذا الرصيد مستحقاتك المالية المتوفرة.</p>
           </div>
           
           <a href="/employee/finance" className="mt-6 block w-full bg-surfaceContainerHigh hover:bg-success hover:text-white text-center py-3 rounded-xl font-bold transition-all border border-outlineVariant/10 group-hover:shadow-ambient">
             طلب صرف مستحقات 💸
           </a>
        </div>
      </div>

      {/* Target & KPI Section */}
      {monthlyTarget && (
        <div className="glass-card p-6 border-none rounded-3xl flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">🎯 الهدف الشهري <span className="text-xs font-normal text-onSurfaceVariant bg-surfaceContainer px-2 py-1 rounded-full">فيديوهات</span></h3>
            <div className="bg-surfaceContainerHigh rounded-full h-5 overflow-hidden border border-outlineVariant/10 shadow-inner">
              <div className="h-full rounded-full transition-all duration-1000 relative" style={{ width: Math.min(100, (monthlyTarget.achievedCount / monthlyTarget.targetCount) * 100) + '%', background: 'linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%)' }}>
                 <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20"></div>
              </div>
            </div>
            <div className="flex justify-between mt-3 text-sm text-onSurfaceVariant font-bold">
              <span>تم إنجاز: <b className="text-primary">{monthlyTarget.achievedCount}</b></span>
              <span>المطلوب: <b>{monthlyTarget.targetCount}</b></span>
            </div>
          </div>
          <div className="md:w-32 text-center bg-surfaceContainerLow p-4 rounded-2xl border border-outlineVariant/20">
            <span className="block text-3xl font-black text-secondary">{Math.max(0, monthlyTarget.targetCount - monthlyTarget.achievedCount)}</span>
            <span className="text-xs text-onSurfaceVariant font-bold">متبقي لإنهاء الهدف</span>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[ 
          { label: 'أيام الحضور (حسب السجل)', value: attendance.filter(a => a.status === 'PRESENT').length, color: 'text-success', bg: 'bg-success/10' },
          { label: 'أيام التأخر', value: attendance.filter(a => a.status === 'LATE').length, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'المكافآت', value: rewards.length, color: 'text-tertiary', bg: 'bg-tertiary/10' },
          { label: 'التحذيرات', value: warnings.length, color: 'text-error', bg: 'bg-error/10' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-3xl p-5 flex flex-col items-center justify-center text-center border border-outlineVariant/10 shadow-sm ${stat.bg}`}>
             <span className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</span>
             <span className="text-xs font-bold text-onSurface">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Submission Panel */}
        <div className="md:col-span-2 glass-card p-8 rounded-3xl border border-outlineVariant/20 relative overflow-hidden">
          <div className="absolute top-0 flex justify-center w-full left-0 opacity-30 pointer-events-none">
             <div className="w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] -top-20"></div>
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-display font-bold mb-2">تسجيل الحضور وإرسال التقارير 📤</h2>
            <p className="text-sm text-onSurfaceVariant mb-6">أضف روابط الفيديوهات التي نشرتها اليوم. يعتبر إرسال رابط واحد على الأقل تسجيلاً لحضورك.</p>
            
            {errorString && (
              <div className="bg-error/10 text-error p-3 rounded-xl text-sm mb-4 border border-error/20 flex items-center gap-2"><b>تنبيه:</b> {errorString}</div>
            )}

            {setupMode ? (
              <form onSubmit={handleSetupCount} className="bg-surfaceContainerLow p-8 rounded-2xl flex flex-col items-center gap-6 border-2 border-primary/20">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-primary mb-2">مرحباً! كم عدد الفيديوهات التي نشرتها اليوم؟</h3>
                  <p className="text-sm text-onSurfaceVariant">يرجى إدخال العدد الدقيق لفتح الخانات المخصصة لك.</p>
                </div>
                <div className="flex items-center gap-4 w-full max-w-sm">
                  <input
                    type="number"
                    min="1" max="20"
                    required
                    value={videoCountInput}
                    onChange={(e) => setVideoCountInput(e.target.value)}
                    className="flex-1 bg-surface p-4 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 border border-outlineVariant/20 text-center text-2xl font-black"
                    placeholder="0"
                  />
                  <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-md transition-all active:scale-95">استمرار ➔</button>
                </div>
              </form>
            ) : (
              <form className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-onSurface flex items-center gap-2">
                      <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">{tiktokUrls.length}</span>
                      قائمة الروابط (منصة: {employeeData?.platform || 'غير محدد'}):
                    </label>
                    <button type="button" onClick={() => setSetupMode(true)} className="text-xs bg-surfaceContainerHigh hover:bg-error/10 hover:text-error px-3 py-1.5 rounded-lg text-onSurfaceVariant font-bold transition-colors">تعديل العدد</button>
                  </div>
                  {tiktokUrls.map((url, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="bg-surfaceContainerHigh text-onSurfaceVariant font-bold w-10 flex items-center justify-center rounded-xl border border-outlineVariant/10">{idx + 1}</div>
                      <input
                        type="text" value={url}
                        onChange={e => { const n = [...tiktokUrls]; n[idx] = e.target.value; setTiktokUrls(n); }}
                        placeholder={`الصق الرابط رقم ${idx + 1} هنا...`}
                        className="flex-1 bg-surfaceContainerLow focus:bg-surface text-onSurface p-4 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 border border-outlineVariant/20 text-left dir-ltr text-sm font-mono transition-all"
                        dir="ltr" required
                      />
                    </div>
                  ))}
                </div>
                
                <button type="submit" className="mt-4 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all shadow-ambient transform hover:-translate-y-1 relative overflow-hidden group" style={{ background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)' }} disabled={submitted}>
                  <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -translate-x-full skew-x-12"></div>
                  {submitted ? '⏳ تم الإرسال للمدير وهو الآن يراجعها، انتظر رده' : `إرسال الروابط واعتماد الحضور 🚀`}
                </button>
                
                {submitted && (
                  <button type="button" onClick={() => { setSubmitted(false); setSetupMode(true); setVideoCountInput(''); setTiktokUrls(['']); }} className="text-primary text-sm font-bold hover:underline mx-auto block mt-2">تقديم تقارير يوم جديد</button>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Attendance History */}
        <div className="glass-card p-6 rounded-3xl border border-outlineVariant/20 flex flex-col h-[450px]">
          <h3 className="font-bold text-base mb-4 flex items-center justify-between">
            <span>📅 سجل الحضور</span>
            <span className="text-[10px] bg-surfaceContainerHigh px-2 py-1 rounded text-onSurfaceVariant">آخر 7 أيام</span>
          </h3>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scroll pr-1">
            {attendance.slice(0, 7).map((att: any) => (
              <div key={att.id} className="flex items-center justify-between p-4 bg-surfaceContainerLowest border border-outlineVariant/10 rounded-2xl hover:border-outlineVariant/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full shadow-sm ${att.status === 'PRESENT' ? 'bg-success shadow-success/50' : att.status === 'LATE' ? 'bg-warning shadow-warning/50' : 'bg-error shadow-error/50'}`}></div>
                  <span className="text-sm font-bold">{new Date(att.date).toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric'})}</span>
                </div>
                <span className="text-xs bg-surfaceContainerHigh px-2 py-1 rounded text-onSurface font-bold">{att.videoCount} فيديو</span>
              </div>
            ))}
            {attendance.length === 0 && <div className="m-auto text-center"><p className="text-4xl mb-2">📭</p><p className="text-xs text-onSurfaceVariant">لا يوجد سجل مرور بعد</p></div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
        {/* Notifications Grid */}
        <div className="glass-card p-6 rounded-3xl border border-outlineVariant/20 flex flex-col min-h-[400px]">
          <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
            <span>🔔 الإشعارات الواردة</span>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="bg-error text-white text-xs px-2 py-1 rounded-full font-bold">
                {notifications.filter(n => !n.isRead).length} جديد
              </span>
            )}
          </h3>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scroll pr-2 max-h-[400px]">
             {notifications.length === 0 ? (
               <div className="m-auto text-center text-onSurfaceVariant py-10 opacity-60">
                 <span className="text-5xl block mb-2">🔕</span>
                 <p>لا توجد إشعارات لك</p>
               </div>
             ) : notifications.map(notif => (
               <div key={notif.id} onClick={() => !notif.isRead && markNotificationRead(notif.id)} className={`p-4 rounded-xl border relative cursor-pointer transition-colors ${notif.isRead ? 'bg-surfaceContainerLowest border-outlineVariant/10 hover:bg-surfaceContainerLow opacity-70' : 'gradient-bg text-white border-transparent shadow-ambient'}`}>
                 {!notif.isRead && <span className="absolute top-2 left-2 w-2 h-2 bg-error rounded-full animate-ping"></span>}
                 <p className="font-bold text-sm leading-relaxed mb-2">{notif.message}</p>
                 <p className={`text-[10px] ${notif.isRead ? 'text-onSurfaceVariant' : 'text-white/80'}`}>{new Date(notif.createdAt).toLocaleString('ar-EG')}</p>
               </div>
             ))}
          </div>
        </div>

        {/* Leaves Dashboard */}
        <div className="glass-card p-6 rounded-3xl border border-outlineVariant/20 flex flex-col min-h-[400px]">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2">🌴 نظام الإجازات</h3>
           
           <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-surfaceContainerLow p-4 rounded-2xl border border-outlineVariant/10 flex flex-col items-center justify-center text-center">
                 <span className="block text-2xl font-black text-primary mb-1">{employeeData?.allowedLeaves || 21}</span>
                 <span className="text-xs font-bold text-onSurfaceVariant">الرصيد الكلي المقدر (يوم)</span>
              </div>
              <div className="bg-surfaceContainerLow p-4 rounded-2xl border border-outlineVariant/10 flex flex-col items-center justify-center text-center">
                 <span className="block text-2xl font-black text-warning mb-1">
                   {leaveRequests.filter(r => r.status === 'APPROVED').reduce((sum, r) => sum + Math.ceil((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1, 0)}
                 </span>
                 <span className="text-xs font-bold text-onSurfaceVariant">أيام الإجازات المستخدمة</span>
              </div>
           </div>

           <a href="/employee/leaves" className="bg-surfaceContainerHigh hover:bg-primary hover:text-white text-center py-3 rounded-xl font-bold transition-all border border-outlineVariant/10 mb-6 block w-full">
             تقديم طلب إجازة جديد 📝
           </a>

           <h4 className="text-xs font-bold text-onSurfaceVariant mb-3">سجل طلباتي (آخر الطلبات)</h4>
           <div className="flex flex-col gap-2 overflow-y-auto custom-scroll pr-1 flex-1">
              {leaveRequests.slice(0, 5).map(req => (
                 <div key={req.id} className="bg-surfaceContainerLowest border border-outlineVariant/10 p-3 rounded-xl text-sm flex justify-between items-center">
                    <div>
                       <p className="font-bold">{req.type}</p>
                       <p className="text-[10px] text-onSurfaceVariant">{req.startDate} ↗ {req.endDate}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${req.status === 'APPROVED' ? 'bg-success/10 text-success' : req.status === 'REJECTED' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
                       {req.status === 'APPROVED' ? '✅ مقبولة' : req.status === 'REJECTED' ? '❌ مرفوضة' : '⏳ معلقة'}
                    </span>
                 </div>
              ))}
              {leaveRequests.length === 0 && <p className="text-center text-xs text-onSurfaceVariant py-4">لم تقم بتقديم أي طلب بإجازة</p>}
           </div>
        </div>
      </div>
    </div>
  );
}
