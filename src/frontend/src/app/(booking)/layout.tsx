import Link from 'next/link';

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-slate-800 flex items-center gap-2">
            <span className="text-xl">🏡</span>
            <span>Homestay</span>
          </Link>
          <Link href="/booking/lookup" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
            Tra cứu đặt phòng
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
