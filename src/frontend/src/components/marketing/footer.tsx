export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 mt-auto">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="text-white font-bold text-lg mb-2">🏡 Homestay</div>
          <p className="text-sm leading-relaxed">
            Không gian nghỉ dưỡng yên tĩnh, đặt phòng trực tiếp không qua trung gian.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Liên kết</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/rooms" className="hover:text-white transition-colors">Danh sách phòng</a></li>
            <li><a href="/#location" className="hover:text-white transition-colors">Vị trí</a></li>
            <li><a href="/#contact" className="hover:text-white transition-colors">Liên hệ</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Liên hệ</h4>
          <ul className="space-y-2 text-sm">
            <li>📞 0901 234 567</li>
            <li>✉️ info@homestay.vn</li>
            <li>📍 Đà Lạt, Lâm Đồng</li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-8 pt-6 border-t border-slate-800 text-xs text-center">
        © {new Date().getFullYear()} Homestay. Đặt phòng trực tiếp, tiết kiệm hơn.
      </div>
    </footer>
  );
}
