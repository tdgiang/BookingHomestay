import { SearchWidget } from '@/components/marketing/search-widget';
import { RoomCard } from '@/components/marketing/room-card';
import { serverApi } from '@/lib/api';
import { Room } from '@/lib/rooms';
import Link from 'next/link';
import Script from 'next/script';
import {
  Wifi, Wind, Tv, MapPin, ShieldCheck, HeartHandshake,
  Star, BadgePercent, MessageCircle, Gift, Users, ArrowRight,
  BedDouble, Clock, CheckCircle, Phone,
} from 'lucide-react';

async function getFeaturedRooms(): Promise<Room[]> {
  try {
    const res = await serverApi().get('/rooms', { params: { limit: 3, sortBy: 'createdAt', sortOrder: 'desc' } });
    return res.data.data?.items ?? [];
  } catch {
    return [];
  }
}

const AMENITIES = [
  { icon: Wifi, label: 'WiFi tốc độ cao', desc: 'Miễn phí toàn khu, 100 Mbps' },
  { icon: Wind, label: 'Điều hòa riêng', desc: 'Mỗi phòng điều chỉnh độc lập' },
  { icon: Tv, label: 'Smart TV', desc: 'Netflix, YouTube, 4K' },
  { icon: MapPin, label: 'Vị trí đắc địa', desc: '5 phút đến chợ Đà Lạt' },
  { icon: ShieldCheck, label: 'An ninh 24/7', desc: 'Camera và bảo vệ suốt ngày' },
  { icon: HeartHandshake, label: 'Dịch vụ tận tình', desc: 'Hỗ trợ phản hồi trong 15 phút' },
];

const WHY_DIRECT = [
  {
    icon: BadgePercent,
    title: 'Giá tốt nhất đảm bảo',
    desc: 'Bỏ qua trung gian, tiết kiệm 10–15% so với Booking.com hay Agoda.',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    icon: MessageCircle,
    title: 'Liên lạc trực tiếp',
    desc: 'Chat với chủ nhà qua Zalo/Messenger. Phản hồi trong 15 phút, mọi lúc mọi nơi.',
    color: 'text-sky-500',
    bg: 'bg-sky-50',
  },
  {
    icon: Gift,
    title: 'Ưu đãi chỉ khi đặt thẳng',
    desc: 'Welcome drink, early check-in, late check-out miễn phí khi đặt trực tiếp.',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
  },
];

const TESTIMONIALS = [
  {
    name: 'Nguyễn Thị Mai',
    location: 'TP. Hồ Chí Minh',
    text: 'Phòng sạch đẹp, nhân viên thân thiện, view cực kỳ ấn tượng. Đặt trực tiếp được giá tốt hơn booking.com rất nhiều. Chắc chắn sẽ quay lại!',
    stars: 5,
    initials: 'NM',
    color: 'bg-sky-500',
  },
  {
    name: 'Trần Văn Hải',
    location: 'Hà Nội',
    text: 'Không gian yên tĩnh, không khí trong lành. Buổi sáng thức dậy ngắm mây là trải nghiệm không thể quên. Dịch vụ chu đáo, giá hợp lý.',
    stars: 5,
    initials: 'TH',
    color: 'bg-orange-500',
  },
  {
    name: 'Lê Thị Hoa',
    location: 'Đà Nẵng',
    text: 'Vị trí cực đẹp, đi bộ 5 phút là đến chợ. Phòng rộng, nội thất đẹp, giường êm. Check-in nhanh không phải chờ đợi. Strongly recommend!',
    stars: 5,
    initials: 'LH',
    color: 'bg-green-500',
  },
];

const STATS = [
  { value: '500+', label: 'Khách hài lòng', icon: Users },
  { value: '4.9/5', label: 'Đánh giá trung bình', icon: Star },
  { value: '10', label: 'Phòng đặc sắc', icon: BedDouble },
  { value: '15 phút', label: 'Phản hồi tư vấn', icon: Clock },
];

const LOCATION_POINTS = [
  { icon: MapPin, text: '5 phút đến Chợ Đà Lạt' },
  { icon: MapPin, text: '10 phút đến Hồ Xuân Hương' },
  { icon: MapPin, text: '15 phút đến Vườn hoa Đà Lạt' },
  { icon: MapPin, text: '30 phút đến Sân bay Liên Khương' },
];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const homepageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'Homestay Đà Lạt',
  description: 'Homestay tại Đà Lạt — đặt phòng trực tiếp, giá tốt nhất, không qua trung gian.',
  url: SITE_URL,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Đà Lạt',
    addressRegion: 'Lâm Đồng',
    addressCountry: 'VN',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'reservations',
    availableLanguage: 'Vietnamese',
  },
};

export default async function HomePage() {
  const rooms = await getFeaturedRooms();

  return (
    <>
      <Script
        id="homepage-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
      />
      {/* ──────────────────────────────────────────── HERO */}
      <section className="relative min-h-[92vh] flex items-center text-white overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80')" }}
        />
        {/* Gradient overlay — left heavy for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-800/40" />
        {/* Bottom fade for stats strip */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950/60 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 w-full py-24">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="animate-fade-in inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <CheckCircle size={14} className="text-green-400" />
              <span>Đặt trực tiếp — Giá tốt nhất đảm bảo</span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-in-up text-5xl md:text-6xl font-extrabold leading-[1.1] mb-5 tracking-tight">
              Nghỉ dưỡng tuyệt vời<br />
              <span className="text-sky-400">tại Đà Lạt</span>
            </h1>
            <p className="animate-fade-in-up delay-100 text-slate-300 text-lg leading-relaxed mb-8 max-w-lg">
              Không qua trung gian, không phí hoa hồng. Đặt phòng trực tiếp
              và nhận giá tốt nhất cùng ưu đãi dành riêng cho bạn.
            </p>

            {/* Trust badges */}
            <div className="animate-fade-in-up delay-200 flex flex-wrap gap-4 mb-10">
              {[
                { icon: Star, text: '4.9/5 trên 200+ đánh giá' },
                { icon: ShieldCheck, text: 'Thanh toán an toàn' },
                { icon: Clock, text: 'Xác nhận tức thì' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-sm text-slate-300">
                  <Icon size={13} className="text-sky-400" />
                  {text}
                </div>
              ))}
            </div>

            {/* Search widget */}
            <div className="animate-fade-in-up delay-300">
              <SearchWidget />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── STATS STRIP */}
      <section className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center py-6 px-4 text-center">
                <Icon size={18} className="text-sky-500 mb-2" />
                <span className="text-2xl font-extrabold text-slate-800">{value}</span>
                <span className="text-xs text-slate-500 mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── FEATURED ROOMS */}
      {rooms.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sky-500 text-sm font-semibold uppercase tracking-widest mb-1">Lựa chọn hàng đầu</p>
              <h2 className="text-3xl font-extrabold text-slate-800">Phòng nổi bật</h2>
              <p className="text-slate-500 mt-1.5">Được khách hàng yêu thích và đánh giá cao nhất</p>
            </div>
            <Link
              href="/rooms"
              className="hidden sm:inline-flex items-center gap-1.5 text-sky-600 text-sm font-semibold hover:text-sky-700 transition-colors"
            >
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/rooms"
              className="inline-flex items-center gap-1.5 bg-sky-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition-colors"
            >
              Xem tất cả phòng <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────── WHY BOOK DIRECT */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sky-500 text-sm font-semibold uppercase tracking-widest mb-1">Lợi ích độc quyền</p>
            <h2 className="text-3xl font-extrabold text-slate-800">Tại sao đặt trực tiếp?</h2>
            <p className="text-slate-500 mt-2 max-w-xl mx-auto">
              Bỏ qua OTA, đặt thẳng với chúng tôi để nhận ưu đãi tốt nhất và dịch vụ cá nhân hóa.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHY_DIRECT.map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
              >
                <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center mb-5`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── AMENITIES */}
      <section id="amenities" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sky-500 text-sm font-semibold uppercase tracking-widest mb-1">Đầy đủ tiện nghi</p>
            <h2 className="text-3xl font-extrabold text-slate-800">Tiện nghi & Dịch vụ</h2>
            <p className="text-slate-500 mt-2">Mọi thứ bạn cần cho kỳ nghỉ hoàn hảo</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {AMENITIES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="group flex items-start gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-sky-200 hover:shadow-md transition-all duration-200 cursor-default"
              >
                <div className="h-11 w-11 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 group-hover:bg-sky-100 transition-colors">
                  <Icon size={20} className="text-sky-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{label}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── TESTIMONIALS */}
      <section className="bg-sky-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sky-500 text-sm font-semibold uppercase tracking-widest mb-1">Khách hàng nói gì</p>
            <h2 className="text-3xl font-extrabold text-slate-800">Đánh giá thực tế</h2>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={18} className="text-amber-400 fill-amber-400" />
              ))}
              <span className="text-slate-600 text-sm ml-2 font-medium">4.9/5 trên 200+ đánh giá</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, location, text, stars, initials, color }) => (
              <div
                key={name}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                {/* Text */}
                <p className="text-slate-600 text-sm leading-relaxed mb-5 italic">
                  &ldquo;{text}&rdquo;
                </p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                  <div className={`h-9 w-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{name}</p>
                    <p className="text-slate-400 text-xs">{location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── LOCATION */}
      <section id="location" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sky-500 text-sm font-semibold uppercase tracking-widest mb-1">Dễ dàng di chuyển</p>
              <h2 className="text-3xl font-extrabold text-slate-800 mb-4">Vị trí thuận tiện</h2>
              <p className="text-slate-500 leading-relaxed mb-7">
                Homestay nằm ngay trung tâm Đà Lạt, bước chân ra là chạm được hơi sương mù, hoa
                anh đào và những con đường lãng mạn nhất thành phố ngàn hoa.
              </p>
              <ul className="space-y-3 mb-8">
                {LOCATION_POINTS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="h-7 w-7 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                      <Icon size={13} className="text-sky-500" />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
              <a
                href="https://maps.google.com/?q=Đà+Lạt,+Lâm+Đồng"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-sky-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-sky-700 transition-colors cursor-pointer"
              >
                <MapPin size={14} /> Xem đường đi trên Google Maps
              </a>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl h-80 border border-slate-200">
              <iframe
                title="Vị trí Homestay"
                className="w-full h-full border-0"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3899.7!2d108.438!3d11.9404!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317112fad2e3b071%3A0x9b0ef37ff3082cdb!2zxJDDoCBM4bqhdA!5e0!3m2!1svi!2svn!4v1"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── CTA */}
      <section id="contact" className="relative overflow-hidden py-24">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600 via-sky-500 to-orange-400" />
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />

        <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Star size={13} className="text-amber-300 fill-amber-300" />
            Hơn 500 khách đã tin tưởng đặt phòng trực tiếp
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Sẵn sàng đặt phòng?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Liên hệ trực tiếp hoặc đặt phòng online ngay hôm nay.
            Nhận ngay ưu đãi chỉ dành cho khách đặt trực tiếp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/rooms"
              className="inline-flex items-center justify-center gap-2 bg-white text-sky-600 font-bold px-8 py-3.5 rounded-xl hover:bg-sky-50 transition-colors shadow-lg shadow-sky-900/20 cursor-pointer"
            >
              <BedDouble size={16} />
              Xem phòng trống
            </Link>
            <a
              href="tel:0901234567"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/60 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/15 transition-colors cursor-pointer"
            >
              <Phone size={16} />
              Gọi 0901 234 567
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
