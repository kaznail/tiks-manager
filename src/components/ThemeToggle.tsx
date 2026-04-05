"use client"
import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') { setDark(true); document.documentElement.setAttribute('data-theme', 'dark'); }
  }, []);

  const toggle = () => {
    const newTheme = !dark;
    setDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : '');
  };

  return (
    <button onClick={toggle} className="flex items-center gap-2 p-3 rounded-xl hover:bg-surfaceContainerHigh transition-colors text-onSurfaceVariant w-full" title="تبديل الوضع">
      {dark ? <Sun size={20} /> : <Moon size={20} />}
      <span className="text-sm">{dark ? 'وضع فاتح' : 'وضع داكن'}</span>
    </button>
  );
}
