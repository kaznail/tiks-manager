"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'NONE' | 'ADMIN' | 'EMPLOYEE'>('NONE');
  const [adminCode, setAdminCode] = useState('');
  const [secondaryCode, setSecondaryCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminCode, secondaryCode })
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', 'admin');
        router.push('/admin');
      } else {
        setError('رمز وصول غير صالح. حاول مرة أخرى.');
        setLoading(false);
      }
    } catch(err) {
      setError('لا يمكن الاتصال بالخادم.');
      setLoading(false);
    }
  };

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/auth/employee/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', 'employee');
        if (data.user?.id) localStorage.setItem('userId', data.user.id);
        router.push('/employee');
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
        setLoading(false);
      }
    } catch(err) {
      setError('لا يمكن الاتصال بالخادم.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-4 font-sans dir-rtl">
      {/* Animated Aurora Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10000ms]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-secondary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[8000ms] delay-1000"></div>
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] bg-tertiary/10 rounded-full blur-[100px] mix-blend-screen animate-spin-slow"></div>
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      </div>

      <div className="bg-gradient-to-br from-surfaceContainerLowest/60 to-surfaceContainer/40 backdrop-blur-2xl w-full max-w-lg p-10 md:p-14 rounded-[3rem] relative z-10 flex flex-col gap-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/10 animate-in zoom-in-95 fade-in duration-1000 ease-out">
        
        {/* Header Section */}
        <div className="text-center group">
          <div className="w-20 h-20 bg-gradient-to-tr from-primary to-secondary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-ambient transform transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
            <span className="text-4xl">🏢</span>
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-onSurface to-onSurfaceVariant mb-3 tracking-tight">موقع شؤون الموظفين</h1>
          <p className="text-onSurfaceVariant font-medium text-sm md:text-base">بوابة العمل الآمنة والذكية لشبكتنا</p>
        </div>

        {error && (
            <div className="bg-error/10 text-error p-4 rounded-2xl text-sm text-center border border-error/20 font-bold animate-in slide-in-from-top-4 fade-in duration-300">
              ⚠️ {error}
            </div>
        )}

        {/* Selection State */}
        {loginType === 'NONE' && (
          <div className="flex flex-col gap-4 mt-4 animate-in slide-in-from-bottom-8 fade-in duration-700">
            <button 
              onClick={() => setLoginType('ADMIN')}
              className="group relative overflow-hidden bg-surface text-onSurface font-black py-5 rounded-2xl border-2 border-primary/20 hover:border-primary transition-all duration-300 shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
            >
              <div className="absolute inset-0 w-0 bg-primary/10 transition-all duration-500 ease-out group-hover:w-full"></div>
              <span className="relative flex items-center justify-center gap-3">
                <span className="text-xl">👑</span> إدارة النظام
              </span>
            </button>
            <button 
              onClick={() => setLoginType('EMPLOYEE')}
              className="group relative overflow-hidden bg-surfaceContainer border-2 border-transparent text-onSurface font-black py-5 rounded-2xl hover:border-secondary/30 transition-all duration-300 shadow-md hover:shadow-secondary/10 hover:-translate-y-1"
            >
              <div className="absolute inset-0 w-0 bg-secondary/10 transition-all duration-500 ease-out group-hover:w-full"></div>
              <span className="relative flex items-center justify-center gap-3">
                <span className="text-xl">💼</span> بوابة الموظفين
              </span>
            </button>
          </div>
        )}

        {/* Admin Login State */}
        {loginType === 'ADMIN' && (
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-5 animate-in slide-in-from-right-8 fade-in duration-500">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-onSurfaceVariant px-1">رمز التحقق السري للمسؤول</label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
                <input 
                  type="password" 
                  value={adminCode}
                  onChange={e => setAdminCode(e.target.value)}
                  className="relative w-full bg-surfaceContainerLow border-none rounded-xl p-4 focus:bg-surfaceContainerLowest focus:ring-2 focus:ring-primary transition-all outline-none text-left dir-ltr font-mono text-lg shadow-inner"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-onSurfaceVariant px-1">الرقم السري الإضافي (إن وجد)</label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary to-primary rounded-xl blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
                <input 
                  type="password" 
                  value={secondaryCode}
                  onChange={e => setSecondaryCode(e.target.value)}
                  className="relative w-full bg-surfaceContainerLow border-none rounded-xl p-4 focus:bg-surfaceContainerLowest focus:ring-2 focus:ring-secondary transition-all outline-none text-left dir-ltr font-mono text-lg shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button disabled={loading} type="submit" className="relative group overflow-hidden bg-primary text-white font-black py-4 mt-4 rounded-xl shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_15px_40px_rgba(var(--primary-rgb),0.5)] transition-all duration-300 hover:-translate-y-1 disabled:opacity-50">
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_forwards]"></div>
              {loading ? 'جاري التحقق...' : 'دخول لصلاحيات الإدارة 🚀'}
            </button>
            
            <button type="button" disabled={loading} onClick={() => {setLoginType('NONE'); setError('');}} className="text-sm font-bold text-onSurfaceVariant hover:text-primary transition-colors text-center mt-2 flex items-center justify-center gap-2">
              <span className="text-lg">←</span> العودة للخيارات
            </button>
          </form>
        )}

        {/* Employee Login State */}
        {loginType === 'EMPLOYEE' && (
          <form onSubmit={handleEmployeeLogin} className="flex flex-col gap-5 animate-in slide-in-from-left-8 fade-in duration-500">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-onSurfaceVariant px-1">اسم الحساب (Username)</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-surfaceContainerLow border border-outlineVariant/10 rounded-xl p-4 focus:bg-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all outline-none text-left dir-ltr font-mono shadow-inner"
                placeholder="user_123"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-onSurfaceVariant px-1">الرمز السري (Password)</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-surfaceContainerLow border border-outlineVariant/10 rounded-xl p-4 focus:bg-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all outline-none text-left dir-ltr font-mono shadow-inner"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button disabled={loading} type="submit" className="relative group overflow-hidden bg-secondary text-white font-black py-4 mt-4 rounded-xl shadow-[0_10px_30px_rgba(var(--secondary-rgb),0.3)] hover:shadow-[0_15px_40px_rgba(var(--secondary-rgb),0.5)] transition-all duration-300 hover:-translate-y-1 disabled:opacity-50">
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_forwards]"></div>
              {loading ? 'يتم تسجيل الدخول...' : 'تسجيل حضور وبدء العمل ✨'}
            </button>
            
            <button type="button" disabled={loading} onClick={() => {setLoginType('NONE'); setError('');}} className="text-sm font-bold text-onSurfaceVariant hover:text-secondary transition-colors text-center mt-2 flex items-center justify-center gap-2">
              <span className="text-lg">←</span> الرجوع للوراء
            </button>
          </form>
        )}
        
      </div>
    </div>
  );
}
