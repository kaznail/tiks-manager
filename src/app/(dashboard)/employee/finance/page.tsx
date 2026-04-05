"use client"
import React, { useState, useEffect, useMemo } from 'react';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ───
interface EmployeeData {
  id: string;
  name: string;
  fullName?: string;
  currentBalance: number;
}

interface FinanceRequest {
  id: string;
  amount: number;
  notes?: string;
  adminNotes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export default function EmployeeFinancePage() {
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [requests, setRequests] = useState<FinanceRequest[]>([]);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  
  const getUserId = useMemo(() => {
    return (): string | null => {
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
  }, []);

  const fetchData = async () => {
    const userId = getUserId();
    if (!userId) return;
    const token = getToken();

    // Fetch Employee
    try {
      const res = await fetch(API_URL + '/users/' + userId, { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEmployeeData(data);
    } catch (err) {
      console.error('فشل جلب بيانات الموظف:', err);
    }

    // Fetch Requests History
    try {
      const res = await fetch(API_URL + '/users/finance/employee/' + userId, { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('فشل جلب سجل الطلبات:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('المبلغ المطلوب غير صحيح.');
      setIsSubmitting(false);
      return;
    }

    const currentBalance = employeeData?.currentBalance ?? 0;
    if (parsedAmount > currentBalance) {
       setErrorMsg('رصيدك في المحفظة الذكية لا يكفي لهذا الطلب.');
       setIsSubmitting(false);
       return;
    }

    try {
      const token = getToken();
      const userId = getUserId();
      const res = await fetch(API_URL + '/users/finance/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ employeeId: userId, amount: parsedAmount, notes })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'حدث خطأ أثناء إرسال الطلب');
      }

      setSuccessMsg('تم إرسال طلب سحب المستحقات بنجاح! سيتم مراجعته من قبل الإدارة.');
      setAmount('');
      setNotes('');
      fetchData(); // Refresh list & balance
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'فشل الاتصال بالخادم.';
      setErrorMsg(errorMessage);
    }
    setIsSubmitting(false);
  };

  const currentBalance = employeeData?.currentBalance ?? 0;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
      <header>
        <h1 className="text-display font-black text-3xl mb-2 text-onSurface">مستحقاتي المالية 💳</h1>
        <p className="text-onSurfaceVariant text-sm">تقديم ومتابعة طلبات سحب الرواتب والمستحقات.</p>
      </header>

      {/* Wallet Balance Display */}
      <div className="glass-card rounded-3xl p-8 border border-outlineVariant/20 relative overflow-hidden flex items-center justify-between" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' }}>
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
          <div className="relative z-10 text-white">
             <p className="text-sm font-bold opacity-80 mb-1">الرصيد الكلي المتاح في المحفظة الذكية</p>
             <h2 className="text-5xl font-black">{currentBalance.toLocaleString()} <span className="text-lg">د.ع</span></h2>
          </div>
          <div className="relative z-10 hidden md:block">
             <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 text-5xl">🏦</div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Request Form */}
        <div className="glass-card rounded-3xl p-6 border-none lg:col-span-1 h-fit">
           <h3 className="text-lg font-bold mb-4">إنشاء طلب سحب جديد</h3>
           
           {errorMsg && <div className="bg-error/10 text-error p-3 rounded-xl text-sm mb-4 font-bold">{errorMsg}</div>}
           {successMsg && <div className="bg-success/10 text-success p-3 rounded-xl text-sm mb-4 font-bold">{successMsg}</div>}

           <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="text-xs font-bold text-onSurfaceVariant block">المبلغ المطلوب سحبه (د.ع)</label>
                  <button type="button" onClick={() => setAmount(currentBalance.toString())} className="text-[10px] bg-secondary/10 text-secondary px-2 py-1 rounded font-bold hover:bg-secondary/20 transition-colors">
                    سحب كل الرصيد
                  </button>
                </div>
                <input 
                  type="number" required min="1"
                  max={currentBalance}
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className="bg-surfaceContainerHigh p-4 rounded-xl w-full text-primary font-bold text-lg outline-none focus:ring-2 border border-outlineVariant/20"
                  placeholder="مثال: 50000"
                />
                <span className="text-[10px] text-onSurfaceVariant mt-1 block font-bold">
                  الحد الأقصى المسموح: {currentBalance.toLocaleString()} د.ع
                </span>
              </div>
              <div>
                <label className="text-xs font-bold text-onSurfaceVariant mb-1 block">ملاحظات (اختياري)</label>
                <textarea 
                  value={notes} onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="bg-surfaceContainerHigh p-4 rounded-xl w-full text-sm outline-none focus:ring-2 border border-outlineVariant/20 resize-none custom-scroll"
                  placeholder="اكتب هنا إذا كان لديك سبب معين..."
                />
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity shadow-ambient disabled:opacity-50">
                 {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
           </form>
        </div>

        {/* History List */}
        <div className="glass-card rounded-3xl p-6 border-none lg:col-span-2 flex flex-col min-h-[400px]">
           <h3 className="text-lg font-bold mb-4 flex justify-between items-center">
             سجل الطلبات
             <span className="text-xs bg-surfaceContainerHigh text-onSurfaceVariant px-3 py-1 rounded-lg">إجمالي الطلبات ( {requests.length} )</span>
           </h3>

           <div className="flex-1 overflow-y-auto custom-scroll pr-1 flex flex-col gap-3">
              {requests.map(req => (
                 <div key={req.id} className="bg-surfaceContainerLowest border border-outlineVariant/10 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:border-outlineVariant/30 transition-colors">
                    <div className="flex flex-col">
                       <span className="text-lg font-black text-secondary">{req.amount.toLocaleString()} د.ع</span>
                       <span className="text-xs text-onSurfaceVariant mt-1">تاريخ الطلب: {new Date(req.createdAt).toLocaleString('ar-EG')}</span>
                       {req.notes && <span className="text-xs mt-2 bg-surfaceContainerHigh p-2 rounded-lg text-onSurface">ملاحظاتك: {req.notes}</span>}
                       {req.adminNotes && req.status !== 'PENDING' && (
                         <span className="text-xs mt-2 bg-primary/10 text-primary p-2 rounded-lg font-bold">رسالة الإدارة: {req.adminNotes}</span>
                       )}
                    </div>
                    <div>
                       {req.status === 'PENDING' && <span className="bg-warning/10 text-warning px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap">قيد المراجعة ⏳</span>}
                       {req.status === 'APPROVED' && <span className="bg-success/10 text-success px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap">تمت الموافقة وتم الصرف ✅</span>}
                       {req.status === 'REJECTED' && <span className="bg-error/10 text-error px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap">مرفوض ❌</span>}
                    </div>
                 </div>
              ))}
              {requests.length === 0 && (
                <div className="m-auto text-center w-full">
                   <p className="text-4xl mb-4 text-onSurfaceVariant opacity-50">📂</p>
                   <p className="text-sm font-bold text-onSurfaceVariant">لا يوجد أي طلبات سحب مرفوعة حتى الآن.</p>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
