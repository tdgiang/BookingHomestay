import Link from 'next/link';
import { Phone, Mail, MapPin, Home } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
            <Home size={18} className="text-sky-400" />
            Homestay Đà Lạt
          </div>
          <p className="text-sm leading-relaxed mb-4">
            Không gian nghỉ dưỡng yên tĩnh giữa lòng Đà Lạt. Đặt trực tiếp —
            không qua trung gian, giá tốt nhất.
          </p>
          <div className="flex gap-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-sky-600 hover:text-white transition-colors cursor-pointer"
            >
              {/* Facebook icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-pink-600 hover:text-white transition-colors cursor-pointer"
            >
              {/* Instagram icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Khám phá</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { href: '/rooms', label: 'Danh sách phòng' },
              { href: '/#amenities', label: 'Tiện nghi & Dịch vụ' },
              { href: '/#location', label: 'Vị trí & Bản đồ' },
              { href: '/#contact', label: 'Liên hệ đặt phòng' },
              { href: '/booking/lookup', label: 'Tra cứu đặt phòng' },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="hover:text-white transition-colors duration-200">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Liên hệ</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a href="tel:0901234567" className="flex items-center gap-2.5 hover:text-white transition-colors cursor-pointer">
                <Phone size={14} className="text-sky-400 shrink-0" />
                0901 234 567
              </a>
            </li>
            <li>
              <a href="mailto:info@homestay.vn" className="flex items-center gap-2.5 hover:text-white transition-colors cursor-pointer">
                <Mail size={14} className="text-sky-400 shrink-0" />
                info@homestay.vn
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin size={14} className="text-sky-400 shrink-0 mt-0.5" />
              <span>123 Nguyễn Thị Minh Khai,<br />Đà Lạt, Lâm Đồng</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Homestay Đà Lạt. Đặt trực tiếp — giá tốt nhất.</span>
          <span>Made with ♥ in Đà Lạt</span>
        </div>
      </div>
    </footer>
  );
}
