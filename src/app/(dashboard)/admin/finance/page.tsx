"use client"
import React, { useState, useEffect } from 'react';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ───
interface Employee {
  id: string;
  name: string;
  fullName?: string;
  platform?: string;
  role: string;
  currentBalance?: number;
}

interface FinanceRequest {
  id: string;
  amount: number;
  notes?: string;
  adminNotes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  employee?: Employee;
}

export default function AdminFinancePage() {
  const [requests, setRequests] = useState<FinanceRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [selectedReq, setSelectedReq] = useState<(FinanceRequest & { action: 'approve' | 'reject' }) | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchData = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const [reqsRes, empsRes] = await Promise.all([
        fetch(API_URL + '/users/finance/requests', { headers: { 'Authorization': 'Bearer ' + token } }),
        fetch(API_URL + '/users', { headers: { 'Authorization': 'Bearer ' + token } })
      ]);
      if (!reqsRes.ok) throw new Error(`فشل جلب الطلبات: HTTP ${reqsRes.status}`);
      if (!empsRes.ok) throw new Error(`فشل جلب الموظفين: HTTP ${empsRes.status}`);
      const reqsData = await reqsRes.json();
      const empsData = await empsRes.json();
      setRequests(Array.isArray(reqsData) ? reqsData : []);
      setEmployees(Array.isArray(empsData) ? empsData.filter((e: Employee) => e.role === 'employee') : []);
    } catch (e) {
      console.error('فشل جلب بيانات المالية:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedReq) return;
    setActionLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/users/finance/${action}/${selectedReq.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ adminNotes })
      });
      if (!res.ok) console.error('فشل تنفيذ الإجراء:', res.status);
    } catch (err) {
      console.error('خطأ في معالجة الطلب:', err);
    }
    setActionLoading(false);
    setSelectedReq(null);
    setAdminNotes('');
    fetchData();
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    
    const parsedAmount = parseFloat(topupAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.error('المبلغ المدخل غير صحيح');
      return;
    }

    setActionLoading(true);
    try {
      const token = getToken();
      const newBalance = (selectedEmp.currentBalance || 0) + parsedAmount;
      
      const res = await fetch(`${API_URL}/users/${selectedEmp.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ amount: newBalance })
      });
      if (!res.ok) console.error('فشل شحن الرصيد:', res.status);
    } catch (err) {
      console.error('خطأ في شحن المحفظة:', err);
    }
    setActionLoading(false);
    setSelectedEmp(null);
    setTopupAmount('');
    fetchData();
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto animate-in fade-in duration-500 pb-10">
      <header className="flex justify-between items-end">
        <div>
           <h1 className="text-display font-black text-3xl mb-1 text-onSurface">إدارة المالية والرواتب 💼</h1>
           <p className="text-onSurfaceVariant text-sm">مراجعة طلبات السحب وشحن محافظ الموظفين الذكية.</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Requests List */}
          <div className="glass-card rounded-3xl p-6 border-none lg:col-span-2 flex flex-col h-[700px]">
             <h3 className="text-lg font-bold mb-4 flex justify-between items-center bg-surfaceContainerLow p-4 rounded-2xl">
               <span>طلبات السحب من الموظفين</span>
               <span className="bg-warning text-onWarning px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                 {requests.filter(r => r.status === 'PENDING').length} طلب معلق
               </span>
             </h3>
             <div className="flex-1 overflow-y-auto custom-scroll pr-1 flex flex-col gap-3">
                {requests.map(req => (
                   <div key={req.id} className="bg-surfaceContainerLowest border border-outlineVariant/20 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
                      <div className="flex justify-between items-start">
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                               <span className="font-bold text-lg">{req.employee?.fullName}</span>
                               <span className="bg-surfaceContainerHigh text-[10px] px-2 py-0.5 rounded text-onSurfaceVariant">
                                 {req.employee?.platform || 'بدون منصة'}
                               </span>
                            </div>
                            <p className="text-xs text-onSurfaceVariant">تاريخ الطلب: {new Date(req.createdAt).toLocaleString('ar-EG')}</p>
                         </div>
                         <div className="text-left">
                            <span className="text-2xl font-black text-secondary">{req.amount.toLocaleString()} د.ع</span>
                            <div className="mt-1">
                              {req.status === 'PENDING' && <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-bold">قيد المراجعة</span>}
                              {req.status === 'APPROVED' && <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-bold">مكتمل 🟢</span>}
                              {req.status === 'REJECTED' && <span className="bg-error/10 text-error px-2 py-1 rounded text-xs font-bold">مرفوض 🔴</span>}
                            </div>
                         </div>
                      </div>
                      
                      {req.notes && (
                        <div className="bg-surface p-3 rounded-xl border border-outlineVariant/10 text-sm">
                          <span className="text-xs text-onSurfaceVariant font-bold block mb-1">ملاحظة الموظف:</span>
                          {req.notes}
                        </div>
                      )}

                      {req.adminNotes && req.status !== 'PENDING' && (
                        <div className="bg-primary/5 text-primary p-3 rounded-xl border border-primary/10 text-sm mt-0">
                          <span className="text-xs font-bold block mb-1">ردك السابق:</span>
                          {req.adminNotes}
                        </div>
                      )}

                      {req.status === 'PENDING' && (
                        <div className="flex gap-2 mt-2 pt-4 border-t border-outlineVariant/10">
                           <button onClick={() => setSelectedReq({...req, action: 'approve'})} className="flex-1 bg-success hover:bg-success/80 text-white font-bold py-2 rounded-xl transition-colors">موافقة وصرف ✅</button>
                           <button onClick={() => setSelectedReq({...req, action: 'reject'})} className="flex-1 bg-error/10 hover:bg-error text-error hover:text-white font-bold py-2 rounded-xl transition-colors">رفض ❌</button>
                        </div>
                      )}
                   </div>
                ))}
                {requests.length === 0 && <p className="text-center text-onSurfaceVariant my-auto">لا يوجد طلبات سحب.</p>}
             </div>
          </div>

          {/* Wallets Overview */}
          <div className="glass-card rounded-3xl p-6 border-none lg:col-span-1 flex flex-col h-[700px]">
             <h3 className="text-lg font-bold mb-4 bg-surfaceContainerLow p-4 rounded-2xl">محافظ الموظفين 🏦</h3>
             <p className="text-xs text-onSurfaceVariant mb-4">هنا يمكنك شحن الأرصدة وإضافة الرواتب لمحافظ الموظفين.</p>
             <div className="flex-1 overflow-y-auto custom-scroll pr-1 flex flex-col gap-2">
               {employees.map(emp => (
                 <div key={emp.id} className="bg-surfaceContainerLowest p-3 rounded-2xl flex items-center justify-between border border-outlineVariant/10">
                   <div>
                     <p className="font-bold text-sm truncate w-32" title={emp.fullName || 'بدون اسم'}>{(emp.fullName || 'بدون اسم').split(' ').slice(0, 2).join(' ')}</p>
                     <p className="text-xs text-success font-bold mt-1">{(emp.currentBalance || 0).toLocaleString()} د.ع</p>
                   </div>
                   <button onClick={() => setSelectedEmp(emp)} className="bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shrink-0">
                     شحن الرصيد 🔋
                   </button>
                 </div>
               ))}
               {employees.length === 0 && <p className="text-xs text-center text-onSurfaceVariant mt-4">لا يوجد موظفين.</p>}
             </div>
          </div>

        </div>
      )}

      {/* Approve/Reject Modal */}
      {selectedReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-surface w-full max-w-md rounded-3xl p-8 shadow-ambient animate-in zoom-in-95 duration-200">
             <h3 className="text-xl font-bold mb-2">{selectedReq.action === 'approve' ? 'موافقة على طلب السحب ✅' : 'رفض طلب السحب ❌'}</h3>
             <p className="text-sm text-onSurfaceVariant mb-6">
               أنت على وشك {selectedReq.action === 'approve' ? 'الموافقة على صرف' : 'رفض'} مبلغ <b className="text-secondary">{selectedReq.amount.toLocaleString()} د.ع</b> للموظف {selectedReq.employee?.fullName}.
             </p>
             <textarea 
                value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                placeholder="أضف ملاحظة للموظف (اختياري)..." rows={3}
                className="w-full bg-surfaceContainer p-4 rounded-xl outline-none focus:ring-2 border border-outlineVariant/20 mb-6 text-sm"
             />
             <div className="flex gap-3">
               <button onClick={() => handleAction(selectedReq.action)} disabled={actionLoading} className={`flex-1 text-white font-bold py-3 rounded-xl disabled:opacity-50 ${selectedReq.action === 'approve' ? 'bg-success' : 'bg-error'}`}>{actionLoading ? 'جاري المعالجة...' : 'تأكيد الإجراء'}</button>
               <button onClick={() => { setSelectedReq(null); setAdminNotes(''); }} className="flex-1 bg-surfaceContainerHigh font-bold py-3 rounded-xl hover:bg-surfaceContainerHighest text-onSurface">إلغاء</button>
             </div>
          </div>
        </div>
      )}

      {/* Topup Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-surface w-full max-w-md rounded-3xl p-8 shadow-ambient animate-in zoom-in-95 duration-200">
             <h3 className="text-xl font-black mb-2 text-primary">شحن المحفظة 🏦</h3>
             <p className="text-sm text-onSurfaceVariant mb-6">إضافة مبلغ مالي لمحفظة <b className="text-onSurface">{selectedEmp.fullName}</b>.</p>
             
             <div className="bg-surfaceContainerHigh p-4 rounded-2xl mb-6 text-center">
               <span className="text-xs text-onSurfaceVariant block mb-1">الرصيد الحالي</span>
               <span className="text-2xl font-black text-success">{(selectedEmp.currentBalance || 0).toLocaleString()} د.ع</span>
             </div>

             <form onSubmit={handleTopup}>
               <label className="text-xs font-bold text-onSurfaceVariant mb-2 block">المبلغ المراد إضافته (د.ع):</label>
               <input 
                  type="number" required min="1"
                  value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
                  placeholder="مثال: الراتب الشهري (500000)"
                  className="w-full bg-surfaceContainer p-4 rounded-xl outline-none focus:ring-2 border border-outlineVariant/20 mb-6 font-bold text-primary text-xl"
               />
               <div className="flex gap-3">
                 <button type="submit" disabled={actionLoading} className="flex-1 bg-primary text-white font-bold py-3 rounded-xl disabled:opacity-50">{actionLoading ? 'جاري الشحن...' : 'شحن المحفظة 🔋'}</button>
                 <button type="button" onClick={() => { setSelectedEmp(null); setTopupAmount(''); }} className="flex-1 bg-surfaceContainerHigh font-bold py-3 rounded-xl hover:bg-surfaceContainerHighest text-onSurface">إلغاء</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
