"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { resolveFileUrl } from '../../../../utils/resolveFileUrl';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ───
interface EmployeeCount {
  salaryRecords?: number;
  rewards?: number;
  accountLinks?: number;
  reports?: number;
  warnings?: number;
}

interface Employee {
  id: string;
  name: string;
  fullName?: string;
  username?: string;
  photo1?: string;
  platform?: string;
  province?: string;
  age?: number;
  gender?: string;
  _count?: EmployeeCount;
}

interface SalaryRecord {
  amount: number;
  notes?: string;
  paidAt: string;
}

interface AccountLink {
  id: string;
  url: string;
  platform?: string;
}

interface Warning {
  type: string;
  reason?: string;
  issuedAt: string;
}

interface Reward {
  reason: string;
  issuedAt: string;
}

interface EmployeeDetails extends Employee {
  photo2?: string;
  photo3?: string;
  education?: string;
  salary?: number;
  startDate: string;
  masterCard?: string;
  salaryRecords?: SalaryRecord[];
  accountLinks?: AccountLink[];
  warnings?: Warning[];
  rewards?: Reward[];
}

export default function ArchivePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(API_URL + '/users', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => { setEmployees(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { console.error('فشل جلب الموظفين:', err); setLoading(false); });
  }, []);

  // Fetch full details for expanded employee
  const [details, setDetails] = useState<Record<string, EmployeeDetails>>({});

  const loadDetails = (id: string) => {
    if (details[id]) return; // Already loaded
    const token = getToken();
    fetch(API_URL + '/users/' + id, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setDetails(prev => ({ ...prev, [id]: data })))
      .catch((err) => { console.error('فشل جلب تفاصيل الموظف:', err); });
  };

  const handleToggle = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadDetails(id);
    }
  };

  /** Safe first character accessor */
  const getInitial = (text?: string): string => {
    if (!text || text.length === 0) return 'م';
    return text[0];
  };

  // Filtering
  const platforms = Array.from(new Set(employees.map(e => e.platform).filter(Boolean)));
  const filtered = employees.filter(emp => {
    const matchesSearch = !searchQuery || 
      (emp.fullName || '').includes(searchQuery) || 
      (emp.name || '').includes(searchQuery) || 
      (emp.username || '').includes(searchQuery) ||
      (emp.province || '').includes(searchQuery);
    const matchesPlatform = filterPlatform === 'ALL' || emp.platform === filterPlatform;
    return matchesSearch && matchesPlatform;
  });

  // Stats
  const totalSalaries = employees.reduce((sum, e) => sum + (e._count?.salaryRecords || 0), 0);
  const totalWarnings = employees.reduce((sum, e) => sum + (e._count?.warnings || 0), 0);
  const totalRewards = employees.reduce((sum, e) => sum + (e._count?.rewards || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-8 max-w-7xl mx-auto">
        {[1,2,3,4].map(i => <div key={i} className="animate-pulse bg-surfaceContainerLow h-24 rounded-2xl"></div>)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">الأرشيف الشامل للموظفين</h1>
          <p className="text-onSurfaceVariant text-sm">مرجع مفصّل ودقيق لكل موظف — الرواتب، الصور، البيانات الشخصية، الحسابات، والأداء</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-onSurfaceVariant">إجمالي:</span>
          <span className="bg-primary text-white px-4 py-2 rounded-full font-bold text-lg">{employees.length}</span>
          <span className="text-xs text-onSurfaceVariant">موظف</span>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full gradient-bg"></div>
          <span className="text-xs text-onSurfaceVariant block mb-2">إجمالي الموظفين</span>
          <span className="text-3xl font-bold font-display text-primary">{employees.length}</span>
        </div>
        <div className="glass-card p-5 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-secondary"></div>
          <span className="text-xs text-onSurfaceVariant block mb-2">الرواتب المُسلّمة</span>
          <span className="text-3xl font-bold font-display text-secondary">{totalSalaries}</span>
        </div>
        <div className="glass-card p-5 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-tertiary"></div>
          <span className="text-xs text-onSurfaceVariant block mb-2">المكافآت الممنوحة</span>
          <span className="text-3xl font-bold font-display text-tertiary">{totalRewards}</span>
        </div>
        <div className="glass-card p-5 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-error"></div>
          <span className="text-xs text-onSurfaceVariant block mb-2">التحذيرات المسجلة</span>
          <span className="text-3xl font-bold font-display text-error">{totalWarnings}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، اسم المستخدم، أو المحافظة..."
            className="w-full bg-surfaceContainerLow p-3 pr-10 rounded-xl border border-outlineVariant/20 outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-onSurfaceVariant text-lg">🔍</span>
        </div>
        <select
          value={filterPlatform}
          onChange={e => setFilterPlatform(e.target.value)}
          className="bg-surfaceContainerLow p-3 rounded-xl border border-outlineVariant/20 outline-none focus:ring-2 focus:ring-primary text-sm font-bold cursor-pointer min-w-[180px]"
        >
          <option value="ALL">جميع المنصات</option>
          {platforms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Employee Archive Cards */}
      {filtered.length === 0 ? (
        <div className="text-center p-16 text-onSurfaceVariant flex flex-col items-center gap-3">
          <span className="text-5xl opacity-40">📭</span>
          <p className="font-bold">لا توجد نتائج مطابقة للبحث.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((emp, index) => {
            const isExpanded = expandedId === emp.id;
            const empDetails = details[emp.id];

            return (
              <div
                key={emp.id}
                className={`glass-card overflow-hidden transition-all duration-500 ${isExpanded ? 'ring-2 ring-primary/30 shadow-lg' : 'hover:shadow-md'}`}
              >
                {/* Collapsed Header Row */}
                <div
                  onClick={() => handleToggle(emp.id)}
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-surfaceContainerLow/50 transition-colors"
                >
                  {/* Index */}
                  <span className="text-xs font-bold text-onSurfaceVariant bg-surfaceContainerHigh w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {emp.photo1 ? (
                      <img src={resolveFileUrl(emp.photo1)} className="w-14 h-14 object-cover rounded-full border-2 border-primary shadow-sm" alt={`صورة ${emp.fullName || emp.name}`} />
                    ) : (
                      <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl border-2 border-primary/20">
                        {getInitial(emp.name)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full border-2 border-surface"></span>
                  </div>

                  {/* Name & Quick Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-onSurface truncate">{emp.fullName || emp.name}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[11px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded">{emp.platform || 'غير محدد'}</span>
                      {emp.province && <span className="text-[11px] text-onSurfaceVariant">📍 {emp.province}</span>}
                      {emp.age && <span className="text-[11px] text-onSurfaceVariant">🎂 {emp.age} سنة</span>}
                      {emp.gender && <span className="text-[11px] text-onSurfaceVariant">{emp.gender === 'ذكر' ? '👨' : '👩'} {emp.gender}</span>}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-onSurfaceVariant">رواتب</span>
                      <span className="font-bold text-secondary">{emp._count?.salaryRecords || 0}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-onSurfaceVariant">تقارير</span>
                      <span className="font-bold text-primary">{emp._count?.reports || 0}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-onSurfaceVariant">تحذيرات</span>
                      <span className={`font-bold ${(emp._count?.warnings || 0) > 0 ? 'text-error' : 'text-onSurface'}`}>{emp._count?.warnings || 0}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-onSurfaceVariant">مكافآت</span>
                      <span className="font-bold text-tertiary">{emp._count?.rewards || 0}</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <span className={`text-onSurfaceVariant text-lg transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-outlineVariant/10 p-6 animate-in fade-in slide-in-from-top-2 duration-300 bg-surfaceContainerLowest/50">
                    {!empDetails ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span className="mr-3 text-sm text-onSurfaceVariant">جاري تحميل البيانات التفصيلية...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        {/* Photos Row */}
                        <div>
                          <h3 className="text-sm font-bold text-onSurfaceVariant mb-3">📸 الصور الشخصية</h3>
                          <div className="flex gap-4 flex-wrap">
                            {[empDetails.photo1, empDetails.photo2, empDetails.photo3].map((photo, i) => (
                              photo ? (
                                <img key={i} src={resolveFileUrl(photo)} className="w-32 h-32 object-cover rounded-2xl border-2 border-surface shadow-ambient hover:scale-105 transition-transform cursor-pointer" alt={`صورة ${i + 1} - ${empDetails.fullName || empDetails.name}`} />
                              ) : (
                                <div key={i} className="w-32 h-32 bg-surfaceContainerLow rounded-2xl border-2 border-dashed border-outlineVariant/30 flex items-center justify-center text-onSurfaceVariant text-xs">
                                  لا صورة
                                </div>
                              )
                            ))}
                          </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <InfoBox label="الاسم الكامل (الثلاثي)" value={empDetails.fullName || 'غير مدخل'} highlight />
                          <InfoBox label="اسم الدخول" value={'@' + empDetails.username} dir="ltr" />
                          <InfoBox label="العمر" value={empDetails.age ? empDetails.age + ' سنة' : 'غير محدد'} />
                          <InfoBox label="الجنس" value={empDetails.gender || 'غير محدد'} />
                          <InfoBox label="المحافظة / السكن" value={empDetails.province || 'غير محدد'} />
                          <InfoBox label="تاريخ المباشرة" value={new Date(empDetails.startDate).toLocaleDateString('ar-EG')} />
                          <InfoBox label="المنصة الرئيسية" value={empDetails.platform || 'غير محدد'} color="secondary" />
                          <InfoBox label="الراتب الشهري" value={empDetails.salary ? empDetails.salary.toLocaleString() + ' د.ع' : 'لم يحدد'} color="primary" />
                          <InfoBox label="رقم الماستر كارد" value={empDetails.masterCard || 'لا يوجد'} dir="ltr" mono />
                        </div>

                        {/* Salary Records */}
                        <div>
                          <h3 className="text-sm font-bold text-onSurfaceVariant mb-3">💰 سجل الرواتب المستلمة ({empDetails.salaryRecords?.length || 0})</h3>
                          {empDetails.salaryRecords && empDetails.salaryRecords.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scroll pr-2">
                              {empDetails.salaryRecords.map((sal, idx) => (
                                <div key={idx} className="bg-surfaceContainerLow border border-outlineVariant/10 p-3 rounded-xl flex justify-between items-center">
                                  <div>
                                    <p className="font-bold text-sm text-secondary">{sal.amount.toLocaleString()} د.ع</p>
                                    <p className="text-[10px] text-onSurfaceVariant mt-0.5">{sal.notes || 'راتب روتيني'}</p>
                                  </div>
                                  <span className="text-[10px] bg-secondaryContainer text-onSecondaryContainer px-2 py-1 rounded-full font-bold">
                                    {new Date(sal.paidAt).toLocaleDateString('ar-EG')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-onSurfaceVariant bg-surfaceContainerLow p-3 rounded-xl">لم يتم استلام أي رواتب بعد.</p>
                          )}
                        </div>

                        {/* Account Links */}
                        <div>
                          <h3 className="text-sm font-bold text-onSurfaceVariant mb-3">🔗 الحسابات المُدارة ({empDetails.accountLinks?.length || 0})</h3>
                          {empDetails.accountLinks && empDetails.accountLinks.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {empDetails.accountLinks.map((acc, idx) => (
                                <a key={idx} href={acc.url} target="_blank" rel="noreferrer" className="bg-surfaceContainerLow border border-outlineVariant/10 px-4 py-2 rounded-xl text-xs font-mono dir-ltr text-left text-primary hover:bg-primary hover:text-white transition-colors font-bold truncate max-w-[300px]" dir="ltr">
                                  {acc.url} ↗
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-onSurfaceVariant bg-surfaceContainerLow p-3 rounded-xl">لم يتم ربط أي حسابات.</p>
                          )}
                        </div>

                        {/* Warnings & Rewards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-bold text-error mb-3">⚠️ التحذيرات ({empDetails.warnings?.length || 0})</h3>
                            {empDetails.warnings && empDetails.warnings.length > 0 ? (
                              <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto custom-scroll pr-2">
                                {empDetails.warnings.map((w, idx) => (
                                  <div key={idx} className="bg-error/5 border border-error/10 p-3 rounded-xl">
                                    <p className="text-xs font-bold text-error">{w.type}</p>
                                    <p className="text-[10px] text-onSurfaceVariant mt-1">{w.reason || 'بدون سبب'}</p>
                                    <p className="text-[10px] text-onSurfaceVariant mt-1">{new Date(w.issuedAt).toLocaleDateString('ar-EG')}</p>
                                  </div>
                                ))}
                              </div>
                            ) : <p className="text-sm text-onSurfaceVariant bg-surfaceContainerLow p-3 rounded-xl">لا توجد تحذيرات 👍</p>}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-tertiary mb-3">🏆 المكافآت ({empDetails.rewards?.length || 0})</h3>
                            {empDetails.rewards && empDetails.rewards.length > 0 ? (
                              <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto custom-scroll pr-2">
                                {empDetails.rewards.map((r, idx) => (
                                  <div key={idx} className="bg-tertiary/5 border border-tertiary/10 p-3 rounded-xl">
                                    <p className="text-xs font-bold text-tertiary">{r.reason}</p>
                                    <p className="text-[10px] text-onSurfaceVariant mt-1">{new Date(r.issuedAt).toLocaleDateString('ar-EG')}</p>
                                  </div>
                                ))}
                              </div>
                            ) : <p className="text-sm text-onSurfaceVariant bg-surfaceContainerLow p-3 rounded-xl">لا مكافآت حتى الآن</p>}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-end">
                          <Link href={'/admin/employees/' + emp.id}>
                            <button className="gradient-bg text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-ambient transition-shadow">
                              فتح الملف الكامل (C.V) ➜
                            </button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Reusable Info Box Component
function InfoBox({ label, value, highlight, dir, mono, color }: { label: string; value: string; highlight?: boolean; dir?: string; mono?: boolean; color?: string }) {
  const colorClass = color === 'primary' ? 'text-primary' : color === 'secondary' ? 'text-secondary' : 'text-onSurface';
  return (
    <div className="bg-surfaceContainerLow p-3 rounded-xl border border-outlineVariant/10">
      <span className="text-[10px] text-onSurfaceVariant block mb-1">{label}</span>
      <span className={`font-bold text-sm ${highlight ? 'text-primary' : colorClass} ${mono ? 'font-mono' : ''} ${dir === 'ltr' ? 'dir-ltr text-left block' : ''}`} dir={dir}>
        {value}
      </span>
    </div>
  );
}
