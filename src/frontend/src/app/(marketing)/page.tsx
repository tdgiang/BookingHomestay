import { SearchWidget } from '@/components/marketing/search-widget';
import { RoomCard } from '@/components/marketing/room-card';
import { serverApi } from '@/lib/api';
import { Room } from '@/lib/rooms';
import { Wifi, Wind, Tv, MapPin, ShieldCheck, HeartHandshake } from 'lucide-react';

async function getFeaturedRooms(): Promise<Room[]> {
  try {
    const res = await serverApi().get('/rooms', { params: { limit: 3 } });
    return res.data.data?.items ?? [];
  } catch {
    return [];
  }
}

const AMENITIES = [
  { icon: Wifi, label: 'WiFi tốc độ cao', desc: 'Miễn phí toàn khu' },
  { icon: Wind, label: 'Điều hòa', desc: 'Mỗi phòng riêng biệt' },
  { icon: Tv, label: 'TV Smart', desc: 'Netflix, YouTube' },
  { icon: MapPin, label: 'Vị trí đắc địa', desc: 'Trung tâm thành phố' },
  { icon: ShieldCheck, label: 'An toàn', desc: 'Camera 24/7' },
  { icon: HeartHandshake, label: 'Thân thiện', desc: 'Hỗ trợ tận tình' },
];

export default async function HomePage() {
  const rooms = await getFeaturedRooms();

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 bg-center bg-cover"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80')" }}
        />
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Nghỉ dưỡng thoải mái<br />
            <span className="text-blue-400">Đặt trực tiếp, tiết kiệm hơn</span>
          </h1>
          <p className="text-slate-300 text-lg mb-10 max-w-xl">
            Không qua trung gian, không phí hoa hồng. Đặt phòng ngay hôm nay
            để có mức giá tốt nhất.
          </p>
          <SearchWidget />
        </div>
      </section>

      {/* Featured rooms */}
      {rooms.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Phòng nổi bật</h2>
              <p className="text-slate-500 mt-1">Được khách hàng yêu thích nhất</p>
            </div>
            <a href="/rooms" className="text-blue-600 text-sm font-medium hover:underline">
              Xem tất cả →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </section>
      )}

      {/* Amenities */}
      <section id="amenities" className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Tiện nghi & Dịch vụ</h2>
          <p className="text-slate-500 text-center mb-10">Mọi thứ bạn cần cho kỳ nghỉ hoàn hảo</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {AMENITIES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location / Map */}
      <section id="location" className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Vị trí thuận tiện</h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              Homestay nằm tại trung tâm Đà Lạt, cách chợ Đà Lạt 5 phút đi bộ,
              cách hồ Xuân Hương 10 phút, thuận tiện di chuyển đến các điểm tham quan.
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">📍 5 phút đến Chợ Đà Lạt</li>
              <li className="flex items-center gap-2">🌊 10 phút đến Hồ Xuân Hương</li>
              <li className="flex items-center gap-2">🌺 15 phút đến Vườn hoa</li>
              <li className="flex items-center gap-2">✈️ 30 phút đến Sân bay Liên Khương</li>
            </ul>
            <a
              href="https://maps.google.com/?q=Đà+Lạt,+Lâm+Đồng"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 text-blue-600 font-medium text-sm hover:underline"
            >
              <MapPin size={15} /> Xem đường đi trên Google Maps
            </a>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg h-72 bg-slate-200">
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
      </section>

      {/* CTA */}
      <section id="contact" className="bg-blue-600 text-white py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Sẵn sàng đặt phòng?</h2>
          <p className="text-blue-100 mb-8">
            Liên hệ trực tiếp hoặc đặt phòng online ngay hôm nay.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/rooms"
              className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Xem phòng trống
            </a>
            <a
              href="tel:0901234567"
              className="inline-block border border-white/50 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Gọi 0901 234 567
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
