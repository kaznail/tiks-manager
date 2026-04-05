import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surfaceContainerLow" dir="rtl">
      <div className="text-center animate-fade-in">
        <div className="text-8xl font-black text-primary/20 mb-4">404</div>
        <h1 className="text-3xl font-bold text-onSurface mb-2">الصفحة غير موجودة</h1>
        <p className="text-onSurfaceVariant mb-8">عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <Link href="/login" className="gradient-bg text-white px-8 py-3 rounded-2xl font-bold text-sm inline-block hover:shadow-ambient transition-shadow">
          العودة للصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
