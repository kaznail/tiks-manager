"use client"
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, BarChart2, Bell, LogOut, FileText, Archive, Shield, Calendar, MessageSquare, Settings, Activity, Trophy, Palmtree, Menu, X, Search, ChevronRight, User, Banknote, MonitorPlay } from 'lucide-react';
import AuthGuard from '../../components/AuthGuard';
import ThemeToggle from '../../components/ThemeToggle';
import { ToastProvider, useToast } from '../../components/Toast';
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Client wrapper inside context so we can use useToast
function DashboardInnerLayout({ children, isAdmin }: { children: React.ReactNode, isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Restore theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  // Socket Connection for Real-Time Toast Notifications
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    
    // Employee only notifications, but you can enable it for admin too
    if (userId && token && !isAdmin) {
      const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
        query: { userId }
      });

      socket.on('notification', (payload: any) => {
        // payload can be string or object
        toast(typeof payload === 'string' ? payload : (payload.message || 'لديك إشعار جديد'), 'info');
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [toast, isAdmin]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    router.push('/login');
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/users', { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSearchResults(data.filter((e: any) => e.name?.includes(q) || e.fullName?.includes(q) || e.username?.includes(q)).slice(0, 5));
      }
    } catch {}
  };

  const adminLinks = [
    { href: '/admin', icon: <Home size={20} />, label: 'لوحة التحكم', match: (p: string) => p === '/admin' },
    { href: '/admin/employees', icon: <Users size={20} />, label: 'الموظفين', match: (p: string) => p.includes('/employees') },
    { href: '/admin/archive', icon: <Archive size={20} />, label: 'الأرشيف', match: (p: string) => p.includes('/archive') },
    { href: '/admin/warnings', icon: <Shield size={20} />, label: 'التحذيرات', match: (p: string) => p.includes('/warnings'), badge: true },
    { href: '/admin/leaves', icon: <Palmtree size={20} />, label: 'الإجازات', match: (p: string) => p.includes('/leaves') },
    { href: '/admin/leaderboard', icon: <Trophy size={20} />, label: 'ترتيب الموظفين', match: (p: string) => p.includes('/leaderboard') },
    { href: '/admin/reports', icon: <BarChart2 size={20} />, label: 'التقارير', match: (p: string) => p.includes('/reports') },
    { href: '/admin/notifications', icon: <Bell size={20} />, label: 'الإشعارات', match: (p: string) => p.includes('/notifications') },
    { href: '/admin/chat', icon: <MessageSquare size={20} />, label: 'المحادثات', match: (p: string) => p.includes('/chat') },
    { href: '/admin/operations', icon: <MonitorPlay size={20} />, label: 'سجل العمليات والمتابعة', match: (p: string) => p.includes('/admin/operations') },
    { href: '/admin/finance', icon: <Banknote size={20} />, label: 'المالية والرواتب', match: (p: string) => p.includes('/admin/finance') },
    { href: '/admin/calendar', icon: <Calendar size={20} />, label: 'التقويم', match: (p: string) => p.includes('/calendar') },
    { href: '/admin/activity', icon: <Activity size={20} />, label: 'سجل النشاطات', match: (p: string) => p.includes('/activity') },
    { href: '/admin/settings', icon: <Settings size={20} />, label: 'الإعدادات', match: (p: string) => p.includes('/settings') },
  ];

  const employeeLinks = [
    { href: '/employee', icon: <Home size={20} />, label: 'لوحة التحكم', match: (p: string) => p === '/employee' },
    { href: '/employee/profile', icon: <User size={20} />, label: 'ملفي الشخصي', match: (p: string) => p.includes('/employee/profile') },
    { href: '/employee/reports', icon: <FileText size={20} />, label: 'تقاريري', match: (p: string) => p.includes('/employee/reports') },
    { href: '/employee/finance', icon: <Banknote size={20} />, label: 'مستحقاتي المالية', match: (p: string) => p.includes('/employee/finance') },
    { href: '/employee/leaves', icon: <Palmtree size={20} />, label: 'الإجازات', match: (p: string) => p.includes('/employee/leaves') },
    { href: '/employee/chat', icon: <MessageSquare size={20} />, label: 'محادثة المدير', match: (p: string) => p.includes('/employee/chat') },
    { href: '/employee/notifications', icon: <Bell size={20} />, label: 'إشعاراتي', match: (p: string) => p.includes('/employee/notifications') },
  ];

  const links: { href: string; icon: any; label: string; match: any; badge?: boolean }[] = isAdmin ? adminLinks : employeeLinks;

  const SidebarContent = () => (
    <>
      <div>
        {!collapsed && <div className="text-xl font-bold text-primary mb-8 mr-2 leading-tight">شؤون<br/>الموظفين</div>}
        {collapsed && <div className="text-primary text-2xl font-bold mb-8 text-center">🏢</div>}
        <nav className="flex flex-col gap-1">
          {links.map(link => (
            <Link key={link.href} href={link.href} className={`flex items-center gap-3 p-3 rounded-xl transition-all relative ${link.match(pathname) ? 'bg-surfaceContainerLowest shadow-sm text-primary' : 'text-onSurfaceVariant hover:bg-surfaceContainerHigh'} ${collapsed ? 'justify-center' : ''}`} title={collapsed ? link.label : ''}>
              {link.icon}
              {!collapsed && <span className="text-sm">{link.label}</span>}
              {link.badge && <span className="absolute left-3 top-3 w-2 h-2 rounded-full bg-error animate-pulse"></span>}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-col gap-2 mt-6">
        <ThemeToggle />
        <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-error rounded-xl hover:bg-surfaceContainerHigh transition-colors w-full">
          <LogOut size={20} />
          {!collapsed && <span className="text-sm">تسجيل الخروج</span>}
        </button>
      </div>
    </>
  );

  return (
        <div className="flex h-screen bg-surfaceContainerLow text-onSurface" dir="rtl">
          {/* Desktop Sidebar */}
          <aside className={`sidebar-desktop flex-col justify-between p-4 bg-surface border-l border-outlineVariant/15 overflow-y-auto custom-scroll shrink-0 transition-all duration-300 ${collapsed ? 'w-20' : 'w-60'}`}>
            <SidebarContent />
          </aside>

          {/* Mobile overlay */}
          {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

          {/* Mobile Sidebar */}
          <aside className={`sidebar-mobile fixed inset-y-0 right-0 w-72 bg-surface z-50 flex-col justify-between p-6 overflow-y-auto custom-scroll transition-transform duration-300 shadow-2xl ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 left-4"><X size={24} className="text-onSurfaceVariant" /></button>
            <SidebarContent />
          </aside>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <header className="flex items-center justify-between px-6 py-3 bg-surface border-b border-outlineVariant/10 shrink-0">
              <div className="flex items-center gap-3">
                <button className="md:hidden p-2" onClick={() => setMobileOpen(true)}><Menu size={22} /></button>
                <button className="hidden md:block p-2 text-onSurfaceVariant hover:text-primary transition-colors" onClick={() => setCollapsed(!collapsed)}>
                  <ChevronRight size={20} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                </button>
                {/* Search */}
                {isAdmin && (
                  <div className="relative">
                    <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-onSurfaceVariant hover:text-primary transition-colors"><Search size={20} /></button>
                    {searchOpen && (
                      <div className="absolute top-12 right-0 w-80 bg-surface border border-outlineVariant/20 rounded-2xl shadow-2xl z-50 p-3 animate-fade-in">
                        <input autoFocus type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="ابحث عن موظف..." className="w-full bg-surfaceContainerLow p-3 rounded-xl outline-none text-sm mb-2" />
                        {searchResults.map(emp => (
                          <Link key={emp.id} href={`/admin/employees/${emp.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surfaceContainerLow transition-colors" onClick={() => setSearchOpen(false)}>
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold">{emp.name?.[0]}</div>
                            <div><p className="text-sm font-bold">{emp.fullName || emp.name}</p><p className="text-[10px] text-onSurfaceVariant">{emp.platform || emp.username}</p></div>
                          </Link>
                        ))}
                        {searchQuery.length >= 2 && searchResults.length === 0 && <p className="text-xs text-onSurfaceVariant text-center py-2">لا نتائج</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="text-xs text-onSurfaceVariant">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-auto bg-surfaceContainerLow main-content custom-scroll">
              {children}
            </main>
          </div>
        </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.includes('admin');
  return (
    <AuthGuard>
      <ToastProvider>
        <DashboardInnerLayout isAdmin={isAdmin}>
          {children}
        </DashboardInnerLayout>
      </ToastProvider>
    </AuthGuard>
  );
}
