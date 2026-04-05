"use client"
import React, { useState, useEffect } from 'react';
import { resolveFileUrl } from '../../../utils/resolveFileUrl';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [monthlyComparison, setMonthlyComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    Promise.all([
      fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users/stats/overview', { headers: { 'Authorization': 'Bearer ' + token } }).then(r => r.json()).catch((err) => { console.error('فشل جلب الإحصائيات:', err); return null; }),
      fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users', { headers: { 'Authorization': 'Bearer ' + token } }).then(r => r.json()).catch((err) => { console.error('فشل جلب الموظفين:', err); return []; }),
      fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users/weekly-report', { headers: { 'Authorization': 'Bearer ' + token } }).then(r => r.json()).catch((err) => { console.error('فشل جلب التقرير الأسبوعي:', err); return null; }),
      fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users/monthly-comparison', { headers: { 'Authorization': 'Bearer ' + token } }).then(r => r.json()).catch((err) => { console.error('فشل جلب المقارنة الشهرية:', err); return null; }),
    ]).then(([s, e, wr, mc]) => {
      setStats(s);
      setEmployees(Array.isArray(e) ? e : []);
      setWeeklyReport(wr);
      setMonthlyComparison(mc);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-onSurfaceVariant">جاري تحميل البيانات...</div>;

  const maxReportCount = stats?.reportsLast7Days ? Math.max(...stats.reportsLast7Days.map((d: any) => d.count), 1) : 1;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">مرحباً بك في موقع شؤون الموظفين</h1>
          <p className="text-onSurfaceVariant text-sm">نظرة عامة شاملة على فريقك وأدائهم</p>
        </div>
        <div className="w-12 h-12 bg-primaryContainer text-white rounded-full flex items-center justify-center font-bold text-lg shadow-ambient">م</div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="إجمالي الموظفين" value={stats?.totalEmployees || 0} color="primary" icon="👥" />
        <StatCard label="التقارير المرسلة" value={stats?.totalReports || 0} color="secondary" icon="📊" />
        <StatCard label="تحذيرات بانتظار الموافقة" value={stats?.pendingWarnings || 0} color="error" icon="⚠️" link="/admin/warnings" />
        <StatCard label="الحضور اليوم" value={stats?.attendanceToday || 0} color="success" icon="✅" suffix={'/' + (stats?.totalEmployees || 0)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Reports Chart (Weekly) */}
        <div className="glass-card p-6 lg:col-span-2">
          <h2 className="text-lg font-bold mb-6 flex justify-between">
            <span>📈 النشاط آخر 7 أيام</span>
            {weeklyReport && <span className="text-xs font-normal text-onSurfaceVariant bg-surfaceContainerHigh px-3 py-1 rounded-full">{weeklyReport.period}</span>}
          </h2>
          <div className="flex items-end gap-2 md:gap-4 h-[220px]">
            {weeklyReport?.days?.map((day: any, idx: number) => {
              const maxVal = Math.max(...weeklyReport.days.map((d: any) => Math.max(d.reports, d.attendance)), 1);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-surfaceContainerHigh p-2 rounded-lg text-xs font-bold shadow-lg pointer-events-none z-10 whitespace-nowrap">
                    تقارير: {day.reports} | حضور: {day.attendance}
                  </div>
                  <div className="flex items-end justify-center gap-1 w-full h-[160px]">
                    <div className="w-[40%] rounded-t-md bg-secondary transition-all duration-700" style={{ height: `${(day.attendance / maxVal) * 100}%`, minHeight: '4px' }}></div>
                    <div className="w-[40%] rounded-t-md bg-primary transition-all duration-700" style={{ height: `${(day.reports / maxVal) * 100}%`, minHeight: '4px' }}></div>
                  </div>
                  <span className="text-[10px] text-onSurfaceVariant truncate max-w-full">{day.dayName.substring(0, 3)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 justify-center mt-4">
            <span className="text-xs font-bold text-onSurfaceVariant flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary"></span> التقارير ({weeklyReport?.totalReports})</span>
            <span className="text-xs font-bold text-onSurfaceVariant flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary"></span> الحضور ({weeklyReport?.totalAttendance})</span>
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <h2 className="text-lg font-bold mb-4">🏆 أداء الشهر الحالي</h2>
          {monthlyComparison && monthlyComparison.reports ? (
            <div className="flex flex-col gap-4">
              <ComparisonRow label="التقارير" current={monthlyComparison.reports.current} change={monthlyComparison.reports.change} inverted={false} />
              <ComparisonRow label="المواظبة والحضور" current={monthlyComparison.attendance.current} change={monthlyComparison.attendance.change} inverted={false} />
              <ComparisonRow label="التحذيرات المسجلة" current={monthlyComparison.warnings.current} change={monthlyComparison.warnings.change} inverted={true} />
              
              <div className="mt-4 pt-4 border-t border-outlineVariant/20">
                <span className="text-xs text-onSurfaceVariant block mb-1">إجمالي الرواتب المدفوعة</span>
                <span className="text-2xl font-bold font-display text-primary">{(stats?.totalSalaryPaid || 0).toLocaleString()} د.ع</span>
              </div>
            </div>
          ) : (
            <div className="skeleton skeleton-card flex-1"></div>
          )}
        </div>
      </div>

      {/* Employee Quick List */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-display text-onSurface">الموظفون</h2>
          <Link href="/admin/employees" className="text-primary text-sm font-bold hover:underline">عرض الكل ➜</Link>
        </div>
        
        <div className="bg-surfaceContainerLowest rounded-xl p-4 flex flex-col gap-2 min-h-[200px]">
          {employees.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-onSurfaceVariant p-10">
              <span className="text-4xl mb-4">📭</span>
              <p>لا يوجد موظفين مسجلين حالياً.</p>
            </div>
          ) : employees.slice(0, 5).map((emp, idx) => (
            <div key={emp.id || idx} className="flex justify-between items-center p-4 hover:bg-surfaceContainerLow transition-colors rounded-lg">
              <div className="flex items-center gap-4">
                {emp.photo1 ? (
                  <img src={resolveFileUrl(emp.photo1)} className="w-10 h-10 rounded-full object-cover border" alt="" />
                ) : (
                  <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold">{emp.name?.[0] || 'م'}</div>
                )}
                <div>
                  <p className="font-bold text-sm">{emp.fullName || emp.name || emp.username}</p>
                  <p className="text-xs text-onSurfaceVariant">{emp.platform || ''} — تقارير: {emp._count?.reports || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${(emp._count?.warnings || 0) > 0 ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                  {(emp._count?.warnings || 0) > 0 ? emp._count.warnings + ' تحذير' : 'سليم ✓'}
                </span>
                <Link href={'/admin/employees/' + emp.id} className="text-xs text-primary font-bold hover:underline">التفاصيل ➜</Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, color, icon, link, suffix }: { label: string; value: number; color: string; icon: string; link?: string; suffix?: string }) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary', secondary: 'text-secondary', error: 'text-error', success: 'text-success', tertiary: 'text-tertiary'
  };
  const bgMap: Record<string, string> = {
    primary: 'bg-primary', secondary: 'bg-secondary', error: 'bg-error', success: 'bg-success', tertiary: 'bg-tertiary'
  };

  const Card = (
    <div className="glass-card p-5 border-none relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
      <div className={`absolute top-0 right-0 w-1 h-full ${bgMap[color]}`}></div>
      <span className="text-xs text-onSurfaceVariant block mb-2">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold font-display ${colorMap[color]}`}>{value}</span>
        {suffix && <span className="text-sm text-onSurfaceVariant">{suffix}</span>}
      </div>
      <span className="absolute top-3 left-3 text-2xl opacity-10 group-hover:scale-125 transition-transform">{icon}</span>
    </div>
  );

  return link ? <Link href={link}>{Card}</Link> : Card;
}

function ComparisonRow({ label, current, change, inverted }: { label: string; current: number; change: number; inverted: boolean }) {
  const isPositive = current > 0 ? (inverted ? change <= 0 : change >= 0) : true;
  const isNeutral = change === 0;
  
  let color = 'text-onSurfaceVariant';
  let bg = 'bg-surfaceContainerHigh';
  let arrow = '';

  if (!isNeutral) {
    if (isPositive) { color = 'text-success'; bg = 'bg-success/10'; arrow = '↑'; }
    else { color = 'text-error'; bg = 'bg-error/10'; arrow = '↓'; }
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surfaceContainerLow">
      <div>
        <span className="text-xs text-onSurfaceVariant block mb-1">{label}</span>
        <span className="text-xl font-bold font-display">{current}</span>
      </div>
      <div className={`px-2 py-1 rounded flex items-center gap-1 font-bold text-[11px] ${bg} ${color}`}>
        <span>{arrow}</span>
        <span>{Math.abs(change)}%</span>
      </div>
    </div>
  );
}
