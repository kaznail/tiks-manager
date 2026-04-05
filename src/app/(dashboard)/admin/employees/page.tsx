"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { resolveFileUrl } from '../../../../utils/resolveFileUrl';

// ─── Constants ───
const DEFAULT_ALLOWED_LEAVES = 21;
const SUCCESS_MSG_DURATION = 4000;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ───
interface EmployeeCount {
  salaryRecords?: number;
  rewards?: number;
  accountLinks?: number;
}

interface Employee {
  id: string;
  name: string;
  username: string;
  fullName?: string;
  photo1?: string;
  platform?: string;
  _count?: EmployeeCount;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Base details
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [salary, setSalary] = useState('');
  
  // Advanced details (CV)
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [education, setEducation] = useState('');
  const [province, setProvince] = useState('');
  const [gender, setGender] = useState('ذكر');
  const [masterCard, setMasterCard] = useState('');
  const [platform, setPlatform] = useState('تيك توك (TikTok)');
  const [allowedLeaves, setAllowedLeaves] = useState(String(DEFAULT_ALLOWED_LEAVES));
  const [accountLinks, setAccountLinks] = useState<string[]>(['']);
  
  // Files
  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [photo3, setPhoto3] = useState<File | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Stepper State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchEmployees = () => {
    fetch(API_URL + '/users', { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => { setEmployees(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { console.error('فشل جلب الموظفين:', err); setLoading(false); });
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
  };
  
  const handlePrevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const formData = new FormData();
    
    formData.append('name', name);
    formData.append('username', username);
    formData.append('password', password);
    formData.append('salary', salary);
    formData.append('fullName', fullName);
    formData.append('age', age);
    formData.append('education', education);
    formData.append('province', province);
    formData.append('gender', gender);
    formData.append('masterCard', masterCard);
    formData.append('platform', platform);
    formData.append('allowedLeaves', allowedLeaves);

    // filter empty links and make smart URLs
    const validLinks = accountLinks
       .filter(l => l.trim() !== '')
       .map(l => l.startsWith('http') ? l : `https://${l}`);
    if (validLinks.length > 0) {
      formData.append('accountLinks', JSON.stringify(validLinks));
    }

    if (photo1) formData.append('photo1', photo1);
    if (photo2) formData.append('photo2', photo2);
    if (photo3) formData.append('photo3', photo3);

    try {
      const res = await fetch(API_URL + '/users', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });
      
      if (res.ok) {
        setName(''); setUsername(''); setPassword(''); setSalary(''); setFullName(''); setAge(''); setEducation(''); setProvince(''); setMasterCard(''); setAllowedLeaves(String(DEFAULT_ALLOWED_LEAVES)); setAccountLinks(['']); setPhoto1(null); setPhoto2(null); setPhoto3(null);
        setCurrentStep(1);
        setSuccessMsg('تم إصدار الهوية وبطاقة الموظف بنجاح!');
        fetchEmployees();
        setTimeout(() => setSuccessMsg(''), SUCCESS_MSG_DURATION);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || 'حدث خطأ. قد يكون اسم المستخدم مأخوذ أو عليك إعادة تسجيل الدخول.');
      }
    } catch (err) {
      console.error('فشل إنشاء الموظف:', err);
      setErrorMsg('فشل الاتصال بالخادم. تأكد من اتصالك بالإنترنت.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟ بياناته ستُمسح بالكامل.')) return;
    try {
      const res = await fetch(API_URL + '/users/' + id, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) fetchEmployees();
      else console.error('فشل حذف الموظف:', res.status);
    } catch (err) {
      console.error('خطأ في حذف الموظف:', err);
    }
  };

  /** Safe first character accessor for avatar display */
  const getInitial = (text?: string): string => {
    if (!text || text.length === 0) return 'م';
    return text[0];
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">إدارة الموظفين الشاملة</h1>
          <p className="text-onSurfaceVariant text-sm">أضف موظفاً جديداً بكامل أدق التفاصيل لعمل ملف متكامل له</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Advanced Stepper Creation Form */}
        <div className="glass-card p-6 h-fit relative overflow-hidden transition-all duration-300 shadow-lg border border-primary/20">
          <div className="absolute top-0 right-0 w-full h-1 bg-surfaceContainerHighest">
             <div className="h-full gradient-bg transition-all duration-500" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
          </div>

          <div className="flex justify-between items-center mb-6 mt-2">
             <h2 className="text-xl font-bold font-display text-primary">إصدار بطاقة موظف جديد</h2>
             <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">الخطوة {currentStep} من {totalSteps}</span>
          </div>
          
          {errorMsg && <div className="bg-error/10 text-error p-3 text-sm rounded-lg mb-4 animate-in fade-in">{errorMsg}</div>}
          {successMsg && <div className="bg-tertiary/10 text-tertiary p-3 text-sm rounded-lg mb-4 animate-in fade-in font-bold border border-tertiary/20">{successMsg}</div>}
          
          <form onSubmit={handleCreate} className="flex flex-col gap-6 relative min-h-[400px] pb-24">
            
            {/* Step 1: Authentication */}
            <div className={`transition-all duration-500 absolute w-full ${currentStep === 1 ? 'opacity-100 translate-x-0 z-10 relative' : 'opacity-0 translate-x-[100%] z-0 hidden pointer-events-none'}`}>
              <div className="flex flex-col gap-4">
                <p className="text-sm font-bold text-onSurface mb-2">1. بيانات الدخول الأساسية 🔐</p>
                <div className="grid grid-cols-1 gap-3">
                   <div className="relative group">
                     <span className="absolute -top-2 right-3 text-[10px] bg-surface px-1 text-onSurfaceVariant font-bold">الاسم المفضل (للعرض) *</span>
                     <input type="text" required value={name} onChange={e => setName(e.target.value)} className="bg-surfaceContainerLow p-4 w-full rounded-xl outline-none focus:ring-2 focus:ring-primary border border-outlineVariant/20 transition-all text-sm" />
                   </div>
                   <div className="relative group mt-2">
                     <span className="absolute -top-2 right-3 text-[10px] bg-surface px-1 text-onSurfaceVariant font-bold">اسم المستخدم Username *</span>
                     <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="bg-surfaceContainerLow p-4 w-full rounded-xl outline-none focus:ring-2 focus:ring-primary border border-outlineVariant/20 transition-all text-left dir-ltr text-sm" dir="ltr" />
                   </div>
                   <div className="relative group mt-2">
                     <span className="absolute -top-2 right-3 text-[10px] bg-surface px-1 text-onSurfaceVariant font-bold">كلمة المرور الابتدائية *</span>
                     <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="bg-surfaceContainerLow p-4 w-full rounded-xl outline-none focus:ring-2 focus:ring-primary border border-outlineVariant/20 transition-all text-left dir-ltr text-sm" dir="ltr" />
                   </div>
                </div>
              </div>
            </div>

            {/* Step 2: Personal C.V. */}
            <div className={`transition-all duration-500 absolute w-full ${currentStep === 2 ? 'opacity-100 translate-x-0 z-10 relative' : currentStep > 2 ? 'opacity-0 -translate-x-[100%] z-0 hidden pointer-events-none' : 'opacity-0 translate-x-[100%] z-0 hidden pointer-events-none'}`}>
              <div className="flex flex-col gap-4">
                <p className="text-sm font-bold text-onSurface mb-2">2. السجل المدني والمالي (C.V) 📂</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="md:col-span-2 relative">
                     <span className="absolute -top-2 right-3 text-[10px] bg-surface px-1 text-onSurfaceVariant font-bold">الاسم الثلاثي الكامل</span>
                     <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="bg-surfaceContainerLow p-4 w-full rounded-xl outline-none focus:ring-2 focus:ring-primary border border-outlineVariant/20 text-sm" />
                   </div>
                   
                   <div className="relative mt-2">
                     <span className="absolute -top-2 right-3 text-[10px] bg-surface px-1 text-onSurfaceVariant font-bold">العمر</span>
                     <input type="number" value={age} onChange={e => setAge(e.target.value)} className="bg-surfaceContainerLow p-4 w-full rounded-xl outline-none focus:ring-2 focus:ring-primary border border-outlineVariant/20 text-sm" />
                   </div>

                   <div className="relative mt-2">
                     <span className="absolute -top-2 right-3 text-[10px] bg-surface px-1 text-onSurfaceVariant font-bold">الدراسة / التحصيل</span>
                     <input type="text" value={education} onChange={e => setEducation(e.target.value)} placeholder="مثال: بكلوريوس إعلام" className="bg-surfaceContainerLow p-4 w-full rounded-xl outline-none focus:ring-2 focus:ring-primary border border-outlineVariant/20 text-sm" />
                   </div>

                   <div className="relative mt-2">
                     <span className="absolute -top-2 right-3 text-[10px] bg-surface px-1 text-onSurfaceVariant font-bold">الجنس</span>
                     <select value={gender} onChange={e => setGender(e.target.value)} className="bg-surfaceContainerLow p-4 w-full rounded-xl outline-none focus:ring-2 focus:ring-primary border border-outlineVariant/20 text-sm cursor-pointer">
                        <option value="ذكر">ذكر</option><option value="أنثى">أنثى</option>
                     </select>
                   </div>

                   <div className="md:col-span-2 relative mt-2">
                     <span className="absolute -top-2 right-3 text-[10px] bg-surface px-1 text-onSurfaceVariant font-bold">المحافظة / السكن</span>
                     <input type="text" value={province} onChange={e => setProvince(e.target.value)} className="bg-surfaceContainerLow p-4 w-full rounded-xl outline-none focus:ring-2 focus:ring-primary border border-outlineVariant/20 text-sm" />
                   </div>

                   <div className="relative mt-2">
                     <span className="absolute -top-2 right-3 text-[10px] bg-surface px-1 text-onSurfaceVariant font-bold">الراتب المتفق عليه (د.ع)</span>
                     <input type="number" value={salary} onChange={e => setSalary(e.target.value)} className="bg-surfaceContainerLow p-4 w-full rounded-xl outline-none focus:ring-2 focus:ring-primary border border-outlineVariant/20 text-sm text-secondary font-bold" />
                   </div>

                   <div className="relative mt-2">
                     <span className="absolute -top-2 right-3 text-[10px] bg-surface px-1 text-onSurfaceVariant font-bold">عدد أيام الإجازة السنوية المسموحة</span>
                     <input type="number" value={allowedLeaves} onChange={e => setAllowedLeaves(e.target.value)} className="bg-surfaceContainerLow p-4 w-full rounded-xl outline-none focus:ring-2 focus:ring-primary border border-outlineVariant/20 text-sm font-bold text-primary" placeholder="مثال: 21" />
                   </div>

                   <div className="relative mt-2">
                     <span className="absolute -top-2 right-3 text-[10px] bg-surface px-1 text-onSurfaceVariant font-bold">رقم الماستر كارد</span>
                     <input type="text" value={masterCard} onChange={e => setMasterCard(e.target.value)} className="bg-surfaceContainerLow p-4 w-full rounded-xl outline-none focus:ring-2 focus:ring-primary border border-outlineVariant/20 text-sm font-mono" />
                   </div>
                </div>
              </div>
            </div>

            {/* Step 3: Social & Media */}
            <div className={`transition-all duration-500 absolute w-full ${currentStep === 3 ? 'opacity-100 translate-x-0 z-10 relative' : 'opacity-0 -translate-x-[100%] z-0 hidden pointer-events-none'}`}>
              <div className="flex flex-col gap-4">
                <p className="text-sm font-bold text-onSurface mb-2">3. التواصل والصور الشخصية 📸</p>
                
                <div className="relative mb-2">
                   <span className="absolute -top-2 right-3 text-[10px] bg-surface px-1 text-onSurfaceVariant font-bold">المنصة الأساسية للنشر</span>
                   <select value={platform} onChange={e => setPlatform(e.target.value)} className="bg-surfaceContainerLow p-4 w-full rounded-xl outline-none focus:ring-2 focus:ring-primary border border-outlineVariant/20 text-sm cursor-pointer font-bold text-primary">
                      <option value="تيك توك (TikTok)">تيك توك (TikTok)</option>
                      <option value="انستقرام (Instagram)">انستقرام (Instagram)</option>
                      <option value="يوتيوب (YouTube)">يوتيوب (YouTube)</option>
                      <option value="فيسبوك (Facebook)">فيسبوك (Facebook)</option>
                   </select>
                </div>

                <div className="bg-surfaceContainerLowest p-3 rounded-lg border border-outlineVariant/20">
                  <p className="text-xs text-onSurfaceVariant mb-2 font-bold flex justify-between">روابط الحسابات التابعة له: <button type="button" onClick={() => setAccountLinks([...accountLinks, ''])} className="text-secondary">+ إضافة رابط</button></p>
                  <div className="max-h-[120px] overflow-y-auto custom-scroll pr-1 flex flex-col gap-2">
                     {accountLinks.map((link, idx) => (
                        <input key={idx} type="text" placeholder="مثال: tiktok.com/@user" value={link} dir="ltr" className="bg-surfaceContainerHigh text-left p-3 rounded-lg outline-none focus:ring-2 border border-outlineVariant/20 w-full text-xs font-mono" onChange={e => {
                          const newLinks = [...accountLinks]; newLinks[idx] = e.target.value; setAccountLinks(newLinks);
                        }} />
                     ))}
                  </div>
                </div>

                <div className="bg-surfaceContainerLowest p-3 rounded-lg border border-outlineVariant/20 mt-1">
                  <p className="mb-2 text-xs font-bold">إرفاق بطاقات الصور (حتى 3 صور):</p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex bg-surfaceContainerHigh rounded-lg p-2 border border-outlineVariant/20 items-center justify-between">
                       <span className="text-xs font-bold text-primary px-2">صورة #1</span><input type="file" accept="image/*" onChange={e => setPhoto1(e.target.files?.[0] || null)} className="text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-2 file:py-1 file:font-bold cursor-pointer" />
                    </div>
                    <div className="flex bg-surfaceContainerHigh rounded-lg p-2 border border-outlineVariant/20 items-center justify-between">
                       <span className="text-xs font-bold text-onSurface px-2">صورة #2</span><input type="file" accept="image/*" onChange={e => setPhoto2(e.target.files?.[0] || null)} className="text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-2 file:py-1 file:font-bold cursor-pointer" />
                    </div>
                    <div className="flex bg-surfaceContainerHigh rounded-lg p-2 border border-outlineVariant/20 items-center justify-between">
                       <span className="text-xs font-bold text-onSurface px-2">صورة #3</span><input type="file" accept="image/*" onChange={e => setPhoto3(e.target.files?.[0] || null)} className="text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-2 file:py-1 file:font-bold cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="mt-auto pt-4 pb-2 flex justify-between gap-4 absolute bottom-0 w-full bg-surface z-20">
               {currentStep > 1 && (
                 <button type="button" onClick={handlePrevStep} className="bg-surfaceContainerHigh text-onSurface px-6 py-3 rounded-xl font-bold hover:bg-surfaceContainerHighest transition-colors text-sm">السابق</button>
               )}
               {currentStep < totalSteps ? (
                 <button type="button" onClick={handleNextStep} className="gradient-bg text-white px-8 py-3 rounded-xl font-bold hover:shadow-ambient transition-shadow ms-auto text-sm w-full md:w-auto">التالي ➜</button>
               ) : (
                 <button type="submit" className="bg-success text-onSuccess px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity ms-auto shadow-lg shadow-success/20 text-sm w-full md:w-auto">🚀 إصدار وحفظ البطاقة</button>
               )}
            </div>
          </form>
        </div>

        {/* List of Employees View */}
        <div className="glass-card p-6 min-h-[400px]">
          <h2 className="text-xl font-bold font-display mb-4">أرشيف الموظفين والسجلات</h2>
          {loading ? (
             <div className="flex flex-col gap-4 p-4">
                {[1,2,3].map(i => <div key={i} className="animate-pulse bg-surfaceContainerLow h-[80px] rounded-xl"></div>)}
             </div>
          ) : employees.length === 0 ? (
            <div className="text-center p-10 text-onSurfaceVariant flex flex-col items-center gap-3">
               <span className="text-4xl opacity-50">📂</span>
               <p>لا يوجد سجلات حالياً في النظام.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scroll">
              {employees.map(emp => (
                <div key={emp.id} className="bg-surfaceContainerLowest p-4 flex flex-col gap-3 rounded-xl hover:bg-surfaceContainerLow transition-colors border border-outlineVariant/10 group">
                  <div className="flex items-center gap-4 w-full">
                    <div className="relative">
                       {emp.photo1 ? (
                         <img src={resolveFileUrl(emp.photo1)} className="w-14 h-14 object-cover rounded-full border-2 border-primary shadow-sm group-hover:scale-105 transition-transform" alt={`صورة ${emp.fullName || emp.name}`} />
                       ) : (
                         <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl border-2 border-primary/20">
                            {emp.name && emp.name.length > 0 ? emp.name[0] : 'م'}
                         </div>
                       )}
                       <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface"></span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-onSurface">{emp.fullName || emp.name}</p>
                      <p className="text-[11px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded w-fit mt-1">{emp.platform || 'غير محدد'}</p>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex flex-col gap-2">
                       <Link href={`/admin/employees/${emp.id}`}>
                         <button className="text-[11px] bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold hover:bg-primary hover:text-white transition-colors border border-primary/20 w-full">
                           فتح C.V ➜
                         </button>
                       </Link>
                       <button onClick={() => handleDelete(emp.id)} className="text-[10px] text-error px-2 py-1 rounded hover:bg-error/10 transition-colors w-full text-left font-bold border border-transparent hover:border-error/20">
                          حذف السجل
                       </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 pt-3 border-t border-outlineVariant/10">
                     <div className="flex gap-4">
                       <div className="flex flex-col"><span className="text-[10px] text-onSurfaceVariant">الرواتب المتسلمة</span><span className="font-bold text-secondary text-sm">{emp._count?.salaryRecords || 0}</span></div>
                       <div className="flex flex-col"><span className="text-[10px] text-onSurfaceVariant">المكافآت</span><span className="font-bold text-tertiary text-sm">{emp._count?.rewards || 0}</span></div>
                       <div className="flex flex-col"><span className="text-[10px] text-onSurfaceVariant">الحسابات</span><span className="font-bold text-onSurface text-sm">{emp._count?.accountLinks || 0}</span></div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
