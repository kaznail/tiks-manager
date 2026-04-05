"use client"
import Link from 'next/link';
import { Shield, Zap, BarChart3, MessageCircle } from 'lucide-react';
import React from 'react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-onSurface selection:bg-primary/20" dir="rtl">
      
      {/* Navbar */}
      <nav className="fixed w-full top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-outlineVariant/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-ambient">م</div>
            <span className="font-display font-black text-xl tracking-tight hidden sm:block">شؤون الموظفين</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-onSurfaceVariant hover:text-primary transition-colors">تسجيل الدخول</Link>
            <Link href="/login" className="gradient-bg text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-ambient hover:shadow-lg transition-all hover:-translate-y-0.5">ابدأ الآن</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] -z-10"></div>
        
        <div className="max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surfaceContainerHigh border border-outlineVariant/20 text-xs font-bold text-primary mb-8 shadow-sm">
            <span className="animate-pulse">✨</span> الإصدار الجديد 2.0 متاح الآن
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight leading-[1.2] mb-6 text-onSurface">
            أدر فريقك بذكاء، وحقق <span className="text-transparent bg-clip-text gradient-bg inline-block">أهدافك</span> بسهولة
          </h1>
          
          <p className="text-lg md:text-xl text-onSurfaceVariant mb-10 max-w-2xl mx-auto leading-relaxed">
            المنصة المتكاملة لإدارة حضور الموظفين، تتبع الإنجازات اليومية، وتقييم الأداء في بيئة عمل عصرية وسريعة.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto gradient-bg text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-ambient hover:shadow-xl transition-all hover:scale-105">
              الدخول للوحة التحكم
            </Link>
            <a href="#features" className="w-full sm:w-auto bg-surfaceContainerHigh text-onSurface px-8 py-4 rounded-2xl font-bold text-lg hover:bg-surfaceContainerLow transition-colors border border-outlineVariant/20">
              استكشف الميزات
            </a>
          </div>
        </div>

        {/* Mockup Preview */}
        <div className="max-w-6xl mx-auto mt-20 relative animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
          <div className="glass-card p-2 rounded-[2rem] border-4 border-surfaceContainerHigh shadow-2xl relative overflow-hidden">
             {/* Fake browser UI */}
             <div className="h-10 bg-surfaceContainerLow rounded-t-[1.7rem] flex items-center px-6 gap-2 border-b border-outlineVariant/10">
               <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
               <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
               <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
             </div>
             <div className="bg-surfaceContainerLow aspect-[16/9] w-full rounded-b-[1.7rem] flex items-center justify-center overflow-hidden relative">
               <div className="absolute inset-0 skeleton opacity-30 mix-blend-overlay"></div>
               <div className="text-3xl font-black text-primary/20 rotate-[-10deg]">شؤون الموظفين — لوحة التحكم</div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-surfaceContainerLowest border-t border-outlineVariant/5 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-black mb-4">كل ما تحتاجه في مكان واحد</h2>
            <p className="text-onSurfaceVariant text-lg">أدوات قوية مصممة لزيادة الإنتاجية وتنظيم العمل.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<BarChart3 size={32} />} 
              title="تقارير لحظية" 
              desc="متابعة أداء الموظفين وإحصائيات العمل بشكل لحظي ورسوم بيانية دقيقة." 
              color="text-primary" bg="bg-primary/10" 
            />
            <FeatureCard 
              icon={<Shield size={32} />} 
              title="نظام حماية قوي" 
              desc="دردشة مشفرة، وصلاحيات مخصصة تضمن سرية البيانات والمراسلات." 
              color="text-tertiary" bg="bg-tertiary/10" 
            />
            <FeatureCard 
              icon={<Zap size={32} />} 
              title="إنجازات وتقييم" 
              desc="نظام أهداف شهري مع تقييم ذاتي ولوحة شرف لأفضل الموظفين." 
              color="text-secondary" bg="bg-secondary/10" 
            />
            <FeatureCard 
              icon={<MessageCircle size={32} />} 
              title="تواصل مباشر" 
              desc="نظام دردشة متقدم وإشعارات فورية لضمان بقاء الفريق على تواصل." 
              color="text-success" bg="bg-success/10" 
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface py-12 px-6 border-t border-outlineVariant/10 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-bold text-onSurfaceVariant font-display text-lg">شؤون الموظفين &copy; 2026</p>
          <p className="text-sm text-onSurfaceVariant">تم التطوير لتلبية احتياجات إدارة شؤون الموظفين</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color, bg }: { icon: any; title: string; desc: string; color: string; bg: string }) {
  return (
    <div className="glass-card p-8 hover:-translate-y-2 transition-transform duration-300">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${bg} ${color}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-onSurface">{title}</h3>
      <p className="text-onSurfaceVariant text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
