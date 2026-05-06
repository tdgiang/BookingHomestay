import { NavHeader } from '@/components/marketing/nav-header';
import { Footer } from '@/components/marketing/footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <NavHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
