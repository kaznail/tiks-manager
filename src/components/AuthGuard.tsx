"use client"
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.replace('/login');
      return;
    }

    // Decode JWT to get role from token itself (most reliable)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Check token expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.clear();
        router.replace('/login');
        return;
      }

      const role = payload.role?.toLowerCase();

      // Store role if missing
      if (!localStorage.getItem('role')) {
        localStorage.setItem('role', role === 'admin' ? 'admin' : 'employee');
      }

      // Check role vs path
      if (pathname.includes('/admin') && role !== 'admin') {
        router.replace('/login');
        return;
      }
      if (pathname.startsWith('/employee') && role === 'admin') {
        router.replace('/admin');
        return;
      }
    } catch (e) {
      // If token is invalid, redirect to login
      localStorage.clear();
      router.replace('/login');
      return;
    }

    setAuthorized(true);
  }, [pathname, router]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center h-screen bg-surfaceContainerLow">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return <>{children}</>;
}
