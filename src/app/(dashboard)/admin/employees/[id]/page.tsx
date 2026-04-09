"use client"
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { resolveFileUrl } from '../../../../../utils/resolveFileUrl';

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [emp, setEmp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Salary
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryNotes, setSalaryNotes] = useState('');
  const [addingSalary, setAddingSalary] = useState(false);

  // Performance
  const [reviewMonth, setReviewMonth] = useState(new Date().toISOString().substring(0, 7));
  const [reviewRating, setReviewRating] = useState(3);
  const [reviewNotes, setReviewNotes] = useState('');
  const [addingReview, setAddingReview] = useState(false);

  // Contract
  const [contractTitle, setContractTitle] = useState('');
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [addingContract, setAddingContract] = useState(false);

  // Monthly Target removed as standalone, now part of Edit Info

  // Edit Employee
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const [statusMsg, setStatusMsg] = useState('');

  // Block / Ban
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Manage Photos
  const [photoTarget, setPhotoTarget] = useState<'photo1' | 'photo2' | 'photo3' | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [deletingWarningId, setDeletingWarningId] = useState<string | null>(null);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchDetails = () => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users/' + id, { headers: { 'Authorization': 'Bearer ' + getToken() } })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => { setEmp(data); setLoading(false); })
      .catch((err) => { console.error('فشل جلب تفاصيل الموظف:', err); setLoading(false); });
  };

  useEffect(() => { fetchDetails(); }, [id]);

  const showMsg = (msg: string) => { setStatusMsg(msg); setTimeout(() => setStatusMsg(''), 3000); };

  const handleAddSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users/' + id + '/salary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
      body: JSON.stringify({ amount: salaryAmount, notes: salaryNotes })
    });
    setAddingSalary(false); setSalaryAmount(''); setSalaryNotes('');
    showMsg('تم تسليم الراتب بنجاح ✓');
    fetchDetails();
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users/' + id + '/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
      body: JSON.stringify({ month: reviewMonth, rating: reviewRating, notes: reviewNotes })
    });
    setAddingReview(false); setReviewNotes('');
    showMsg('تم حفظ التقييم بنجاح ✓');
    fetchDetails();
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractFile) return;
    const formData = new FormData();
    formData.append('title', contractTitle);
    formData.append('file', contractFile);
    try {
      const token = getToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${id}/contract`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });
      setContractTitle('');
      setContractFile(null);
      setAddingContract(false);
      fetchDetails();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteWarning = async (warningId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا التحذير؟')) return;
    setDeletingWarningId(warningId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/warnings/issued/${warningId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + getToken() }
      });
      if (res.ok) {
        alert('تم رفع التحذير بنجاح');
        fetchDetails();
      } else {
        alert('حدث خطأ أثناء رفع التحذير');
      }
    } catch (err) {
      alert('تعذر الاتصال بالخادم');
    }
    setDeletingWarningId(null);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
      body: JSON.stringify(editData)
    });
    setEditing(false);
    showMsg('تم تحديث البيانات بنجاح ✓');
    fetchDetails();
  };

  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile || !photoTarget) return;
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append(photoTarget, photoFile);
    await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users/' + id, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + getToken() },
      body: formData
    });
    setPhotoFile(null); setPhotoTarget(null); setUploadingPhoto(false);
    showMsg('تم رفع الصورة بنجاح ✓');
    fetchDetails();
  };

  const handlePhotoDelete = async (photoField: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
      body: JSON.stringify({ [photoField]: null })
    });
    showMsg('تم حذف الصورة بنجاح ✓');
    fetchDetails();
  };

  if (loading) return <div className="p-10 text-onSurfaceVariant text-center">جاري فتح ملف السجل السري للموظف...</div>;
  if (!emp) return <div className="p-10 text-error text-center font-bold">لم يتم العثور على ملف الموظف!</div>;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      {statusMsg && <div className="bg-success/10 text-success p-3 rounded-xl text-sm font-bold border border-success/20 fixed top-4 left-1/2 -translate-x-1/2 z-50 shadow-lg">{statusMsg}</div>}

      {/* Header */}
      <header className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 bg-surfaceContainerHigh rounded-full flex items-center justify-center hover:bg-surfaceContainerLowest transition-colors">➜</button>
          <div>
            <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">{emp.fullName || emp.name}</h1>
            <p className="text-onSurfaceVariant text-sm">السيرة الذاتية المفصلة والملف الكامل (C.V)</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setEditing(!editing); setEditData({ name: emp.name, fullName: emp.fullName, age: emp.age, province: emp.province, gender: emp.gender, masterCard: emp.masterCard, platform: emp.platform, salary: emp.salary, monthlyVideoTarget: emp.monthlyVideoTarget, allowedLeaves: emp.allowedLeaves }); }} className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold">✏️ تعديل البيانات</button>
          {emp.isBlocked ? (
            <button onClick={async () => { setActionLoading(true); await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${id}/unblock`, { method: 'POST', headers: { 'Authorization': 'Bearer ' + getToken() } }); fetchDetails(); setActionLoading(false); }} disabled={actionLoading} className="bg-success text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50">✅ رفع الحظر</button>
          ) : (
            <button onClick={() => setShowBlockModal(true)} className="bg-warning text-white px-4 py-2 rounded-xl text-xs font-bold">🚫 حظر مؤقت</button>
          )}
          <button onClick={() => setShowBanModal(true)} className="bg-error text-white px-4 py-2 rounded-xl text-xs font-bold">⛔ حذف نهائي</button>
        </div>
      </header>

      {/* Edit Form */}
      {editing && (
        <form onSubmit={handleEditSave} className="glass-card p-6 animate-in fade-in border-2 border-primary/20">
          <h3 className="font-bold text-lg text-primary mb-4">تعديل بيانات الموظف</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <EditField label="الاسم المختصر" value={editData.name || ''} onChange={v => setEditData({...editData, name: v})} />
            <EditField label="الاسم الكامل" value={editData.fullName || ''} onChange={v => setEditData({...editData, fullName: v})} />
            <EditField label="العمر" value={editData.age || ''} onChange={v => setEditData({...editData, age: v})} type="number" />
            <EditField label="المحافظة" value={editData.province || ''} onChange={v => setEditData({...editData, province: v})} />
            <EditField label="الجنس" value={editData.gender || ''} onChange={v => setEditData({...editData, gender: v})} />
            <EditField label="الماستر كارد" value={editData.masterCard || ''} onChange={v => setEditData({...editData, masterCard: v})} />
            <EditField label="المنصة" value={editData.platform || ''} onChange={v => setEditData({...editData, platform: v})} />
            <EditField label="الراتب" value={editData.salary || ''} onChange={v => setEditData({...editData, salary: v})} type="number" />
            <EditField label="هدف الفيديوهات الشهري" value={editData.monthlyVideoTarget || ''} onChange={v => setEditData({...editData, monthlyVideoTarget: v})} type="number" />
            <EditField label="أيام الإجازة السنوية" value={editData.allowedLeaves || ''} onChange={v => setEditData({...editData, allowedLeaves: v})} type="number" />
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="gradient-bg text-white px-6 py-2 rounded-xl font-bold text-sm">حفظ التعديلات</button>
            <button type="button" onClick={() => setEditing(false)} className="bg-surfaceContainerHigh text-onSurfaceVariant px-6 py-2 rounded-xl font-bold text-sm">إلغاء</button>
          </div>
        </form>
      )}



      {/* Main Info */}
      <div className="glass-card p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full gradient-bg"></div>
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Photos */}
          <div className="flex flex-col gap-4 min-w-[200px]">
            <h3 className="text-sm text-onSurfaceVariant font-bold">الصور الشخصية</h3>
            <div className="flex flex-col gap-3">
              <div className="relative group">
                {emp.photo1 ? <img src={resolveFileUrl(emp.photo1)} className="w-48 h-48 object-cover rounded-2xl border-4 border-surface shadow-ambient" alt="Photo 1" /> : <div className="w-48 h-48 bg-surfaceContainerLow rounded-2xl border-2 border-dashed border-outlineVariant/20 flex items-center justify-center text-xs text-onSurfaceVariant">لا صورة</div>}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => setPhotoTarget('photo1')} className="bg-primary hover:bg-primary/80 text-white w-8 h-8 rounded-full text-xs shadow-md">✏️</button>
                   {emp.photo1 && <button onClick={() => handlePhotoDelete('photo1')} className="bg-error hover:bg-error/80 text-white w-8 h-8 rounded-full text-xs shadow-md">🗑</button>}
                </div>
              </div>
              <div className="flex gap-2 w-48">
                <div className="flex-1 h-20 relative group">
                  {emp.photo2 ? <img src={resolveFileUrl(emp.photo2)} className="w-full h-full object-cover rounded-xl border" alt="" /> : <div className="w-full h-full bg-surfaceContainerLow rounded-xl border-dashed border border-outlineVariant/20 flex flex-col items-center justify-center text-[8px] text-onSurfaceVariant opacity-50"><span className="text-xl">👤</span></div>}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-col">
                    <button onClick={() => setPhotoTarget('photo2')} className="bg-primary/90 hover:bg-primary text-white w-6 h-6 rounded flex items-center justify-center text-[10px] shadow-sm">✏️</button>
                    {emp.photo2 && <button onClick={() => handlePhotoDelete('photo2')} className="bg-error/90 hover:bg-error text-white w-6 h-6 rounded flex items-center justify-center text-[10px] shadow-sm">🗑</button>}
                  </div>
                </div>
                <div className="flex-1 h-20 relative group">
                  {emp.photo3 ? <img src={resolveFileUrl(emp.photo3)} className="w-full h-full object-cover rounded-xl border" alt="" /> : <div className="w-full h-full bg-surfaceContainerLow rounded-xl border-dashed border border-outlineVariant/20 flex flex-col items-center justify-center text-[8px] text-onSurfaceVariant opacity-50"><span className="text-xl">👤</span></div>}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-col">
                    <button onClick={() => setPhotoTarget('photo3')} className="bg-primary/90 hover:bg-primary text-white w-6 h-6 rounded flex items-center justify-center text-[10px] shadow-sm">✏️</button>
                    {emp.photo3 && <button onClick={() => handlePhotoDelete('photo3')} className="bg-error/90 hover:bg-error text-white w-6 h-6 rounded flex items-center justify-center text-[10px] shadow-sm">🗑</button>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1 w-full">
            <InfoBox label="الاسم الكامل" value={emp.fullName || 'غير مدخل'} highlight />
            <InfoBox label="اسم الدخول" value={'@' + emp.username} dir="ltr" />
            <InfoBox label="العمر / الجنس" value={`${emp.age || '--'} سنة — ${emp.gender || 'غير محدد'}`} />
            <InfoBox label="المحافظة" value={emp.province || 'غير محدد'} />
            <InfoBox label="تاريخ المباشرة" value={new Date(emp.startDate).toLocaleDateString('ar-EG')} />
            <InfoBox label="المنصة" value={emp.platform || 'غير محدد'} color="secondary" />
            <InfoBox label="إجازات مسموحة" value={emp.allowedLeaves ? emp.allowedLeaves + ' يوم' : '21 يوم'} color="primary" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-primary">💰 الملف المالي</h2>
            <button onClick={() => setAddingSalary(!addingSalary)} className="gradient-bg text-white px-3 py-2 rounded-lg text-xs font-bold">تسليم راتب</button>
          </div>
          <div className="flex gap-4 mb-4">
            <div className="bg-surfaceContainerLow flex-1 p-4 rounded-xl"><span className="text-xs text-onSurfaceVariant block mb-1">الراتب الشهري</span><span className="font-bold text-lg">{emp.salary ? emp.salary.toLocaleString() + ' د.ع' : 'لم يحدد'}</span></div>
            <div className="bg-surfaceContainerLow flex-1 p-4 rounded-xl"><span className="text-xs text-onSurfaceVariant block mb-1">الماستر كارد</span><span className="font-bold text-sm font-mono dir-ltr block" dir="ltr">{emp.masterCard || 'لا يوجد'}</span></div>
          </div>

          {addingSalary && (
            <form onSubmit={handleAddSalary} className="bg-surfaceContainerLowest p-4 rounded-xl border border-primary/30 mb-4 flex flex-col gap-3 animate-in fade-in">
              <input type="number" required placeholder="المبلغ (د.ع)" value={salaryAmount} onChange={e => setSalaryAmount(e.target.value)} className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm" />
              <input type="text" placeholder="ملاحظات" value={salaryNotes} onChange={e => setSalaryNotes(e.target.value)} className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm" />
              <button type="submit" className="bg-primary text-white font-bold p-2 rounded-lg text-sm">دفع وتوثيق</button>
            </form>
          )}

          <h3 className="font-bold text-sm mb-2">سجل الرواتب ({emp.salaryRecords?.length || 0})</h3>
          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scroll pr-2">
            {emp.salaryRecords?.length > 0 ? emp.salaryRecords.map((s: any) => (
              <div key={s.id} className="bg-surfaceContainerLowest p-3 rounded-lg flex justify-between items-center border border-outlineVariant/10">
                <div><p className="font-bold text-sm text-secondary">{s.amount.toLocaleString()} د.ع</p><p className="text-[10px] text-onSurfaceVariant">{s.notes || 'راتب روتيني'}</p></div>
                <span className="text-[10px] bg-secondaryContainer px-2 py-1 rounded-full font-bold">{new Date(s.paidAt).toLocaleDateString('ar-EG')}</span>
              </div>
            )) : <p className="text-sm text-onSurfaceVariant">لم يتم استلام أي رواتب بعد.</p>}
          </div>
        </div>

        {/* Attendance */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-success mb-4">📅 سجل الحضور</h2>
          <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto custom-scroll pr-2">
            {emp.attendance?.length > 0 ? emp.attendance.map((a: any) => (
              <div key={a.id} className="bg-surfaceContainerLowest p-3 rounded-lg flex justify-between items-center border border-outlineVariant/10">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${a.status === 'PRESENT' ? 'bg-success' : a.status === 'LATE' ? 'bg-warning' : 'bg-error'}`}></span>
                  <span className="text-sm font-bold">{a.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-secondary font-bold">{a.videoCount} فيديو</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${a.status === 'PRESENT' ? 'bg-success/10 text-success' : a.status === 'LATE' ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'}`}>{a.status === 'PRESENT' ? 'حاضر' : a.status === 'LATE' ? 'متأخر' : 'غائب'}</span>
                </div>
              </div>
            )) : <p className="text-sm text-onSurfaceVariant">لا يوجد سجل حضور بعد.</p>}
          </div>
        </div>

        {/* Performance Reviews */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-tertiary">⭐ التقييم الشهري</h2>
            <button onClick={() => setAddingReview(!addingReview)} className="bg-tertiary text-white px-3 py-2 rounded-lg text-xs font-bold">تقييم جديد</button>
          </div>

          {addingReview && (
            <form onSubmit={handleAddReview} className="bg-surfaceContainerLowest p-4 rounded-xl border border-tertiary/30 mb-4 flex flex-col gap-3 animate-in fade-in">
              <input type="month" value={reviewMonth} onChange={e => setReviewMonth(e.target.value)} className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">التقييم:</span>
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setReviewRating(n)} className={`text-2xl ${n <= reviewRating ? 'text-tertiary' : 'text-outlineVariant/30'}`}>★</button>
                ))}
              </div>
              <input type="text" placeholder="ملاحظات الأداء" value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm" />
              <button type="submit" className="bg-tertiary text-white font-bold p-2 rounded-lg text-sm">حفظ التقييم</button>
            </form>
          )}

          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scroll pr-2">
            {emp.performanceReviews?.length > 0 ? emp.performanceReviews.map((r: any) => (
              <div key={r.id} className="bg-surfaceContainerLowest p-3 rounded-lg flex justify-between items-center border border-outlineVariant/10">
                <div><p className="font-bold text-sm">{r.month}</p><p className="text-[10px] text-onSurfaceVariant">{r.notes || ''}</p></div>
                <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <span key={n} className={`text-lg ${n <= r.rating ? 'text-tertiary' : 'text-outlineVariant/20'}`}>★</span>)}</div>
              </div>
            )) : <p className="text-sm text-onSurfaceVariant">لا يوجد تقييمات بعد.</p>}
          </div>
        </div>

        {/* Contracts */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-primary">📄 العقود والاتفاقيات</h2>
            <button onClick={() => setAddingContract(!addingContract)} className="bg-primary text-white px-3 py-2 rounded-lg text-xs font-bold">رفع عقد</button>
          </div>

          {addingContract && (
            <form onSubmit={handleAddContract} className="bg-surfaceContainerLowest p-4 rounded-xl border border-primary/30 mb-4 flex flex-col gap-3 animate-in fade-in">
              <input type="text" required placeholder="عنوان العقد" value={contractTitle} onChange={e => setContractTitle(e.target.value)} className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm" />
              <input type="file" onChange={e => setContractFile(e.target.files?.[0] || null)} className="text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-3 file:py-2 file:font-bold" />
              <button type="submit" className="bg-primary text-white font-bold p-2 rounded-lg text-sm">رفع وحفظ</button>
            </form>
          )}

          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scroll pr-2">
            {emp.contracts?.length > 0 ? emp.contracts.map((c: any) => (
              <a key={c.id} href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${c.filePath}`} target="_blank" rel="noreferrer" className="bg-surfaceContainerLowest p-3 rounded-lg flex justify-between items-center border border-outlineVariant/10 hover:bg-surfaceContainerLow transition-colors">
                <p className="font-bold text-sm text-primary">{c.title}</p>
                <span className="text-[10px] text-onSurfaceVariant">{new Date(c.createdAt).toLocaleDateString('ar-EG')}</span>
              </a>
            )) : <p className="text-sm text-onSurfaceVariant">لم يتم رفع أي عقود بعد.</p>}
          </div>
        </div>

        {/* Warnings & Rewards */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-error mb-4">⚠️ التحذيرات ({emp.warnings?.length || 0})</h2>
          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scroll pr-2">
            {emp.warnings?.length > 0 ? emp.warnings.map((w: any) => (
              <div key={w.id} className="bg-error/5 border border-error/10 p-3 rounded-xl flex justify-between items-start gap-4">
                <div>
                  <p className="text-xs font-bold text-error">{w.type}</p>
                  <p className="text-[10px] text-onSurfaceVariant mt-1">{w.reason || 'بدون سبب'} — {new Date(w.issuedAt).toLocaleDateString('ar-EG')}</p>
                </div>
                <button 
                  onClick={() => handleDeleteWarning(w.id)}
                  disabled={deletingWarningId === w.id}
                  className="bg-error/10 text-error hover:bg-error hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 disabled:opacity-50"
                  title="رفع هذا التحذير الموجه للموظف وإلغائه"
                >
                  {deletingWarningId === w.id ? 'يتم الرفع...' : 'رفع التحذير 🗑️'}
                </button>
              </div>
            )) : <p className="text-sm text-onSurfaceVariant">لا توجد تحذيرات 👍</p>}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-tertiary mb-4">🏆 المكافآت ({emp.rewards?.length || 0})</h2>
          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scroll pr-2">
            {emp.rewards?.length > 0 ? emp.rewards.map((r: any) => (
              <div key={r.id} className="bg-tertiary/5 border border-tertiary/10 p-3 rounded-xl">
                <p className="text-xs font-bold text-tertiary">{r.reason}</p>
                <p className="text-[10px] text-onSurfaceVariant mt-1">{new Date(r.issuedAt).toLocaleDateString('ar-EG')}</p>
              </div>
            )) : <p className="text-sm text-onSurfaceVariant">لا مكافآت حتى الآن</p>}
          </div>
        </div>

        {/* Account Links */}
        <div className="glass-card p-6 md:col-span-2">
          <h2 className="text-lg font-bold text-secondary mb-4">🔗 حسابات الإدارة ({emp.accountLinks?.length || 0})</h2>
          <div className="flex flex-wrap gap-2">
            {emp.accountLinks?.length > 0 ? emp.accountLinks.map((acc: any) => (
              <a key={acc.id} href={acc.url} target="_blank" rel="noreferrer" className="bg-surfaceContainerLow px-4 py-2 rounded-xl text-xs font-mono dir-ltr text-primary hover:bg-primary hover:text-white transition-colors font-bold truncate max-w-[300px] border border-outlineVariant/10" dir="ltr">
                {acc.url} ↗
              </a>
            )) : <p className="text-sm text-onSurfaceVariant">لم يتم ربط أي حسابات.</p>}
          </div>
        </div>
      </div>

      {/* Blocked Banner */}
      {emp.isBlocked && (
        <div className="bg-error/10 border-2 border-error/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="text-4xl">⛔</span>
            <div>
              <h3 className="font-black text-error text-lg">هذا الموظف محظور</h3>
              <p className="text-sm text-onSurfaceVariant">السبب: <span className="font-bold text-onSurface">{emp.blockedReason || 'غير محدد'}</span></p>
              {emp.blockedAt && <p className="text-xs text-onSurfaceVariant mt-1">تاريخ الحظر: {new Date(emp.blockedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
            </div>
          </div>
          <button onClick={async () => { setActionLoading(true); await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${id}/unblock`, { method: 'POST', headers: { 'Authorization': 'Bearer ' + getToken() } }); fetchDetails(); setActionLoading(false); }} disabled={actionLoading} className="bg-success text-white px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shrink-0">
            ✅ رفع الحظر عنه
          </button>
        </div>
      )}

      {/* Photo Upload Modal */}
      {photoTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handlePhotoUpload} className="bg-surfaceContainer rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4 border border-outlineVariant/20 shadow-2xl">
            <h2 className="font-bold text-lg">تحديث ({photoTarget})</h2>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-onSurfaceVariant">اختر صورة جديدة</label>
              <input type="file" accept="image/*" required onChange={e => setPhotoFile(e.target.files ? e.target.files[0] : null)} className="bg-surfaceContainerHigh p-3 rounded-lg text-sm border border-outlineVariant/20" />
            </div>
            <div className="flex gap-3 mt-2">
              <button disabled={uploadingPhoto} type="submit" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold disabled:opacity-50 text-sm">
                {uploadingPhoto ? 'جاري الرفع...' : 'رفع الصورة 📤'}
              </button>
              <button type="button" disabled={uploadingPhoto} onClick={() => { setPhotoTarget(null); setPhotoFile(null); }} className="flex-1 bg-surfaceContainerHigh text-onSurface font-bold py-3 rounded-xl disabled:opacity-50 text-sm">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowBlockModal(false)}>
          <div className="bg-surface p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl border border-warning/30 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <span className="text-5xl block mb-3">🚫</span>
              <h3 className="font-black text-xl text-warning">حظر مؤقت</h3>
              <p className="text-sm text-onSurfaceVariant mt-2">سيتم منع <span className="font-bold text-onSurface">{emp.fullName || emp.name}</span> من تسجيل الدخول مؤقتاً</p>
            </div>
            <div className="mb-6">
              <label className="text-xs font-bold text-onSurfaceVariant mb-2 block">سبب الحظر (اختياري)</label>
              <textarea value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="اكتب سبب الحظر..." className="w-full bg-surfaceContainerLow p-3 rounded-xl outline-none text-sm border border-outlineVariant/20 resize-none h-20" />
            </div>
            <div className="flex gap-3">
              <button onClick={async () => { setActionLoading(true); await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${id}/block`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() }, body: JSON.stringify({ reason: blockReason }) }); setShowBlockModal(false); setBlockReason(''); fetchDetails(); setActionLoading(false); }} disabled={actionLoading} className="flex-1 bg-warning text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                🚫 تأكيد الحظر
              </button>
              <button onClick={() => setShowBlockModal(false)} className="flex-1 bg-surfaceContainerHigh text-onSurface py-3 rounded-xl font-bold text-sm hover:opacity-80 transition-all">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowBanModal(false)}>
          <div className="bg-surface p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl border-2 border-error/30 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <span className="text-5xl block mb-3">⛔</span>
              <h3 className="font-black text-xl text-error">حذف نهائي</h3>
              <p className="text-sm text-onSurfaceVariant mt-2">سيتم حذف <span className="font-bold text-error">{emp.fullName || emp.name}</span> وجميع بياناته نهائياً من النظام</p>
              <div className="bg-error/10 border border-error/20 rounded-xl p-3 mt-4 text-xs text-error font-bold">
                ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه! سيتم حذف:<br/>
                التقارير • التحذيرات • الحضور • الرواتب • المحادثات • كل شيء
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={async () => { setActionLoading(true); await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${id}/permanent-ban`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + getToken() } }); setShowBanModal(false); setActionLoading(false); router.push('/admin/employees'); }} disabled={actionLoading} className="flex-1 bg-error text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                ⛔ حذف نهائي
              </button>
              <button onClick={() => setShowBanModal(false)} className="flex-1 bg-surfaceContainerHigh text-onSurface py-3 rounded-xl font-bold text-sm hover:opacity-80 transition-all">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({ label, value, highlight, dir, color }: { label: string; value: string; highlight?: boolean; dir?: string; color?: string }) {
  const colorClass = color === 'secondary' ? 'text-secondary' : highlight ? 'text-primary' : 'text-onSurface';
  return (
    <div className="bg-surfaceContainerLow p-4 rounded-xl border border-outlineVariant/10">
      <span className="text-xs text-onSurfaceVariant block mb-1">{label}</span>
      <span className={`font-bold text-lg ${colorClass}`} dir={dir}>{value}</span>
    </div>
  );
}

function EditField({ label, value, onChange, type }: { label: string; value: any; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-onSurfaceVariant">{label}</label>
      <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} className="bg-surfaceContainerHigh p-3 rounded-lg outline-none text-sm border border-outlineVariant/10 focus:border-primary/30" />
    </div>
  );
}
