# BẢN YÊU CẦU SẢN PHẨM
## WEBSITE ĐẶT PHÒNG HOMESTAY TRỰC TIẾP
### Product Requirements Document (PRD)

| Trường | Nội dung |
|--------|----------|
| Phiên bản | v1.1 |
| Ngày tạo | Tháng 5 năm 2026 |
| Trạng thái | Draft - Chờ xác nhận |
| Stack công nghệ | Next.js 14 + NestJS + PostgreSQL |

---

## 1. Tổng Quan Dự Án

### 1.1 Mục Tiêu

Xây dựng website đặt phòng homestay trực tiếp (Direct Booking Website) nhằm giúp chủ homestay tiếp cận khách hàng mà không qua trung gian (OTA như Booking.com, Airbnb...), từ đó:

- Tiết kiệm phí hoa hồng 15–20% từ các nền tảng OTA
- Xây dựng thương hiệu riêng và cơ sở dữ liệu khách hàng
- Kiểm soát toàn bộ quy trình đặt phòng và trải nghiệm khách hàng
- Tối ưu hóa doanh thu thông qua quản lý giá linh hoạt theo mùa

### 1.2 Phạm Vi Dự Án

Hệ thống bao gồm hai phần chính:

- **Customer Portal** — Giao diện dành cho khách hàng tìm kiếm và đặt phòng
- **Admin Dashboard** — Hệ thống quản lý dành cho chủ homestay

### 1.3 Đối Tượng Người Dùng

| Vai trò | Mô tả | Mục tiêu chính |
|---------|-------|----------------|
| Khách hàng | Người dùng cuối muốn đặt phòng | Tìm kiếm, xem phòng, đặt và thanh toán nhanh chóng |
| Chủ homestay (Admin) | Người quản lý toàn bộ hệ thống | Quản lý đặt phòng, giá, thông tin khách, doanh thu |

---

## 2. Yêu Cầu Tính Năng — Customer Portal

### 2.1 Trang Chủ & Tìm Kiếm Phòng

#### 2.1.1 Mô tả tính năng

Khách hàng có thể tìm kiếm phòng theo các tiêu chí cụ thể ngay từ trang chủ.

#### 2.1.2 Yêu cầu chi tiết

- Search widget nổi bật trên hero banner với các trường tìm kiếm, hỗ trợ **2 chế độ đặt phòng**:
  - **Theo đêm:** Ngày check-in + Ngày check-out (date picker)
  - **Theo giờ:** Ngày + Giờ bắt đầu + Số giờ thuê (tối thiểu 2 tiếng, bất kỳ giờ nào trong ngày)
  - Số khách (adults/children, dropdown)
- Kết quả tìm kiếm hiển thị các phòng còn trống trong khoảng thời gian được chọn
- Filter/sort kết quả: theo giá tăng/giảm, loại phòng, tiện nghi
- Hiển thị trạng thái phòng: Còn phòng / Hết phòng / Chỉ còn X phòng
- Responsive design: tương thích mobile, tablet, desktop

### 2.2 Xem Bộ Sưu Tập Ảnh (Photo Gallery)

#### 2.2.1 Mô tả tính năng

Trang chi tiết phòng với bộ sưu tập ảnh chuyên nghiệp giúp khách hàng hình dung rõ không gian trước khi đặt.

#### 2.2.2 Yêu cầu chi tiết

- Lightbox gallery: click ảnh thumbnail mở full-screen viewer
- Navigation ảnh: prev/next bằng button hoặc phím mũi tên
- Grid layout chính: 1 ảnh lớn + 4 ảnh nhỏ (phong cách Airbnb)
- Lazy loading ảnh để tối ưu hiệu suất trang
- Mobile: swipe gesture để chuyển ảnh
- Hiển thị số thứ tự ảnh (ví dụ: 3/12)
- Alt text đầy đủ cho SEO và accessibility

### 2.3 Đặt Phòng & Thanh Toán Online

#### 2.3.1 Luồng đặt phòng

Hệ thống hỗ trợ **2 chế độ đặt phòng** với luồng tương tự nhau:

| Bước | Tên bước | Theo đêm | Theo giờ |
|------|----------|----------|----------|
| 1 | Chọn phòng & thời gian | Chọn ngày check-in / check-out | Chọn ngày + giờ bắt đầu + số giờ (≥ 2 tiếng) |
| 2 | Xem tóm tắt | Số đêm, giá/đêm, tổng tiền, chính sách hủy | Số giờ, giá/giờ, tổng tiền, chính sách hủy |
| 3 | Nhập thông tin khách | Họ tên + Số điện thoại (bắt buộc); yêu cầu đặc biệt (tùy chọn) | Họ tên + Số điện thoại (bắt buộc); yêu cầu đặc biệt (tùy chọn) |
| 4 | Thanh toán | Chuyển khoản ngân hàng (thanh toán trước 100%) | Chuyển khoản ngân hàng (thanh toán trước 100%) |
| 5 | Xác nhận | Trang success + hiển thị thông tin booking | Trang success + hiển thị thông tin booking |

> **Lưu ý:** Khách vãng lai không cần đăng ký tài khoản. Chỉ cần Họ tên + SĐT là đặt phòng được.

#### 2.3.2 Phương thức thanh toán

- **Chuyển khoản ngân hàng** — phương thức duy nhất được hỗ trợ:
  - Hiển thị QR code VietQR + thông tin tài khoản ngân hàng
  - Nội dung chuyển khoản tự động điền sẵn mã booking
  - Khách phải thanh toán **100% trước** khi xác nhận đặt phòng (không hỗ trợ đặt cọc)
  - Admin xác nhận thanh toán thủ công hoặc tích hợp webhook ngân hàng để tự động xác nhận

#### 2.3.3 Yêu cầu bảo mật thanh toán

- HTTPS bắt buộc toàn trang
- Rate limiting để tránh spam đặt phòng
- Mã booking unique, không đoán được (UUID hoặc format HSB-YYYYMMDD-XXXX)
- Xác nhận đặt phòng hiển thị ngay trên trang sau khi submit (không phụ thuộc email)

### 2.4 Xem Bản Đồ Vị Trí

#### 2.4.1 Yêu cầu chi tiết

- Tích hợp Google Maps hoặc Mapbox hiển thị vị trí chính xác của homestay
- Pin marker với popup hiển thị tên homestay và ảnh đại diện
- Nút "Xem đường đi" mở Google Maps app (deep link)
- Hiển thị các điểm tham quan lân cận (tùy chọn: bán kính 1–5km)
- Bản đồ tương tác: zoom, pan, đổi chế độ view (map/satellite)
- Static map preview trên trang listing để tăng tốc load

---

## 3. Yêu Cầu Tính Năng — Admin Dashboard

### 3.1 Dashboard Tổng Quan

Trang chủ admin hiển thị KPI nhanh và các hành động cần xử lý ngay:

- Thống kê hôm nay: số check-in, check-out, đặt phòng mới
- Doanh thu: tháng này vs tháng trước (biểu đồ line/bar)
- Tỷ lệ lấp đầy phòng (Occupancy Rate) theo tuần/tháng
- Danh sách task cần xử lý: đặt phòng chờ xác nhận, tin nhắn chưa đọc
- Quick actions: Thêm đặt phòng thủ công, Block ngày, Cập nhật giá

### 3.2 Lịch Quản Lý Phòng (Booking Calendar)

#### 3.2.1 Mô tả

Giao diện lịch trực quan (dạng Gantt/Timeline) giúp admin nắm toàn bộ trạng thái phòng theo ngày.

#### 3.2.2 Yêu cầu chi tiết

- View modes: Theo ngày / Theo tuần / Theo tháng
- Màu sắc phân biệt trạng thái:
  - 🔵 Xanh lam: Đã đặt (confirmed)
  - 🟠 Cam: Đặt chờ xác nhận (pending)
  - ⬛ Xám: Blocked / Bảo trì
  - ⬜ Trắng: Còn trống
- Click vào booking bar: xem chi tiết đặt phòng (tên khách, SĐT, ghi chú)
- Drag & drop để dời ngày check-in/check-out (với cảnh báo xác nhận)
- Thêm booking thủ công trực tiếp từ lịch (modal popup)
- Block ngày: chọn range ngày và block nhiều phòng cùng lúc
- Export lịch ra file Excel hoặc PDF

### 3.3 Quản Lý Giá Theo Mùa

#### 3.3.1 Cấu trúc giá

| Loại giá | Ví dụ áp dụng | Tính năng |
|----------|---------------|-----------|
| Giá theo đêm — thường (Base Rate) | Ngày thường trong tuần | Giá mặc định cho từng loại phòng |
| Giá theo đêm — cuối tuần | Thứ 6, 7, Chủ nhật | % markup tự động hoặc giá cứng |
| Giá theo đêm — mùa cao điểm | Hè, Lễ Tết, dịp đặc biệt | Thiết lập theo date range cụ thể |
| Giá theo đêm — lưu trú dài | Ở 7+ đêm, giảm 10% | Discount tự động theo số đêm |
| **Giá theo giờ** | Thuê ngắn hạn, tối thiểu 2 tiếng | Cấu hình riêng theo từng loại phòng, áp dụng mọi khung giờ |

#### 3.3.2 Yêu cầu chi tiết

- Giao diện calendar heatmap hiển thị mức giá từng ngày
- Bulk pricing: cập nhật giá cho nhiều ngày cùng lúc
- Preview: xem khách hàng sẽ thấy giá như thế nào trước khi lưu
- Lịch sử thay đổi giá: ai thay đổi, thay đổi gì, lúc nào
- Tích hợp: áp dụng pricing rules tự động cho availability calendar

### 3.4 Quản Lý Thông Tin Khách Hàng (CRM)

#### 3.4.1 Danh sách khách hàng

- Bảng danh sách với filter: tên, SĐT, email, ngày đặt, trạng thái
- Xem lịch sử đặt phòng của từng khách (số lần ở, tổng chi tiêu)
- Tag khách: VIP, Khách quen, Khách nhóm...
- Export danh sách ra Excel/CSV

#### 3.4.2 Chi tiết đặt phòng

- Thông tin cá nhân: Họ tên, CCCD/Passport (tùy chọn), SĐT, email
- Chi tiết booking: phòng, ngày, số khách, tổng tiền, trạng thái thanh toán
- Ghi chú nội bộ (chỉ admin thấy): yêu cầu đặc biệt, ghi chú phục vụ
- Thay đổi trạng thái booking: Confirmed / Checked-in / Checked-out / Cancelled
- Gửi email/SMS nhắc nhở check-in tự động (T-1 ngày)

### 3.5 Quản Lý Phòng & Tiện Nghi

- CRUD thông tin phòng: tên, mô tả, sức chứa, diện tích, tầng
- Upload ảnh: kéo thả, sắp xếp thứ tự, đặt ảnh đại diện
- Danh sách tiện nghi chuẩn (checkbox): WiFi, AC, TV, bếp, bãi đỗ xe...
- Tiện nghi tùy chỉnh: thêm tiện nghi riêng của homestay
- Quản lý loại phòng (Room Type): Phòng đơn, Đôi, Gia đình, Suite...

---

## 4. Luồng Người Dùng (User Stories)

### 4.1 Luồng Khách Hàng Đặt Phòng

#### Epic US-001: Tìm kiếm và xem phòng

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| US-001 | Là khách hàng, tôi muốn tìm kiếm phòng theo ngày để biết phòng nào đang trống. | Hiển thị kết quả trong <2 giây; Chỉ hiện phòng còn trống; Hiển thị giá đúng kỳ |
| US-002 | Là khách hàng, tôi muốn xem nhiều ảnh của phòng để đưa ra quyết định đặt phòng. | Gallery load trong <3 giây; Xem được tối thiểu 8 ảnh; Zoom ảnh full-screen |
| US-003 | Là khách hàng, tôi muốn xem vị trí homestay trên bản đồ để biết cách di chuyển đến. | Bản đồ hiển thị đúng vị trí; Có nút "Chỉ đường"; Mobile-friendly |

#### Epic US-002: Đặt phòng & thanh toán

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| US-004 | Là khách vãng lai, tôi muốn đặt phòng chỉ cần nhập Họ tên và SĐT mà không cần đăng ký tài khoản. | Chỉ 2 trường bắt buộc (Họ tên + SĐT); Không có bước tạo tài khoản; Hoàn thành đặt phòng trong <3 bước |
| US-005 | Là khách hàng, tôi muốn thuê phòng theo giờ (tối thiểu 2 tiếng) để linh hoạt hơn khi không cần ở cả đêm. | Chọn được giờ bắt đầu bất kỳ; Tối thiểu 2 tiếng; Hiển thị giá/giờ và tổng tiền rõ ràng |
| US-006 | Là khách hàng, tôi muốn thanh toán bằng chuyển khoản ngân hàng và thấy QR code ngay để chuyển tiền nhanh. | QR code VietQR hiển thị ngay sau bước xác nhận; Nội dung CK điền sẵn; Trang xác nhận booking hiển thị sau khi submit |

### 4.2 Luồng Admin Quản Lý

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| US-007 | Là admin, tôi muốn thấy toàn bộ đặt phòng trên lịch để quản lý không bị trùng. | Calendar real-time; Màu sắc phân biệt trạng thái; Click để xem chi tiết |
| US-008 | Là admin, tôi muốn cập nhật giá cho dịp lễ để tối ưu doanh thu. | Chọn date range dễ dàng; Preview trước khi lưu; Áp dụng ngay lập tức |
| US-009 | Là admin, tôi muốn xem lịch sử và thông tin khách để phục vụ tốt hơn. | Tìm kiếm theo tên/SĐT; Xem lịch sử đặt phòng; Export ra Excel |
| US-010 | Là admin, tôi muốn nhận thông báo khi có đặt phòng mới để xác nhận kịp thời. | Notification realtime; Email alert cho admin; Hiển thị trong dashboard |

---

## 5. Kiến Trúc Hệ Thống & Công Nghệ

### 5.1 Tổng Quan Kiến Trúc

Hệ thống được xây dựng theo mô hình monorepo với 2 ứng dụng chính, giao tiếp qua REST API:

#### Frontend — Next.js 14 (App Router)

- Customer Portal (SSR/SSG)
- Admin Dashboard (CSR)
- TailwindCSS + shadcn/ui
- React Query (data fetching)
- Zustand (state management)

#### Backend — NestJS (TypeScript)

- REST API (versioned /api/v1)
- JWT Authentication
- Prisma ORM
- BullMQ (email queue)
- WebSocket (realtime notify)

#### Database

- PostgreSQL 16 (primary DB)
- Redis (session & cache)

#### Services / Infra

- Cloudinary / S3 (ảnh)
- Resend / SendGrid (email tùy chọn)
- **Chuyển khoản ngân hàng** — VietQR để generate QR; webhook ngân hàng (tùy chọn) để tự động xác nhận
- Vercel / Railway (hosting)

### 5.2 Database Schema (Chính)

| Entity | Các trường chính | Quan hệ |
|--------|-----------------|---------|
| Room | id, name, description, capacity, base_price, **hourly_price**, type, images[] | 1 Room → nhiều Booking, RoomPrice |
| Booking | id, room_id, guest_id, **booking_type (nightly/hourly)**, check_in, check_out, **duration_hours**, status, total_price, source | N Bookings → 1 Room, 1 Guest |
| Guest | id, full_name, **phone** (bắt buộc), email (tùy chọn), notes, tags[] | 1 Guest → nhiều Booking |
| RoomPrice | id, room_id, start_date, end_date, price, type (seasonal/weekend/**hourly**) | N RoomPrice → 1 Room |
| Payment | id, booking_id, amount, method (bank_transfer), status, bank_ref, paid_at | 1 Payment → 1 Booking |
| Admin | id, email, password_hash, role, last_login | Độc lập, quản lý toàn hệ thống |

### 5.3 API Endpoints Chính

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/v1/rooms | Lấy danh sách phòng (có filter theo ngày, loại phòng) |
| GET | /api/v1/rooms/:id | Chi tiết phòng + availability |
| POST | /api/v1/bookings | Tạo đặt phòng mới (public) |
| GET | /api/v1/bookings/:id | Xem trạng thái đặt phòng (by booking code) |
| POST | /api/v1/payments/initiate | Khởi tạo giao dịch thanh toán |
| POST | /api/v1/payments/callback | Webhook nhận kết quả từ payment gateway |
| GET | /api/v1/admin/bookings | Danh sách booking (Admin, cần JWT) |
| PATCH | /api/v1/admin/bookings/:id | Cập nhật trạng thái booking (Admin) |
| PUT | /api/v1/admin/pricing | Cập nhật bảng giá theo mùa (Admin) |

---

## 6. Yêu Cầu Phi Chức Năng (Non-Functional)

### 6.1 Hiệu Suất

| Tiêu chí | Mục tiêu |
|----------|----------|
| Thời gian load trang chủ | < 2.5 giây (LCP) |
| Thời gian phản hồi API | < 300ms (p95) |
| PageSpeed Score | >= 85 điểm (Mobile & Desktop) |
| Uptime SLA | 99.5% / tháng |
| Concurrent users | Tối thiểu 100 users đồng thời |

### 6.2 Bảo Mật

- HTTPS toàn trang (SSL/TLS)
- Rate limiting trên tất cả API endpoints (tránh DDoS)
- Input validation và SQL injection prevention (Prisma parameterized queries)
- CORS config chỉ cho phép domain của ứng dụng
- Helmet.js headers bảo mật cho NestJS
- Audit log: ghi lại mọi hành động của admin

### 6.3 SEO & Analytics

- Server-Side Rendering (SSR) cho trang phòng để Google index được
- Open Graph tags để share đẹp trên mạng xã hội
- Sitemap.xml tự động generate
- Tích hợp Google Analytics 4 hoặc Plausible
- Structured data (JSON-LD) cho rich snippets trên Google

### 6.4 Khả Năng Mở Rộng

- Multi-language: cấu trúc sẵn i18n (Tiếng Việt mặc định + Tiếng Anh)
- Multi-homestay: database schema thiết kế để sau có thể mở rộng nhiều cơ sở
- Review & Rating module: cấu trúc DB dự phòng cho tính năng đánh giá

---

## 7. Roadmap Phát Triển

| Giai đoạn | Thời gian | Deliverables |
|-----------|-----------|--------------|
| Phase 1 | Tuần 1–3 | Setup monorepo, Auth admin, CRUD phòng, Upload ảnh, DB schema |
| Phase 2 | Tuần 4–6 | Customer portal: trang chủ, search, trang chi tiết phòng, gallery, bản đồ |
| Phase 3 | Tuần 7–9 | Booking flow end-to-end, tích hợp thanh toán, email confirmation |
| Phase 4 | Tuần 10–12 | Admin dashboard, booking calendar, pricing management, CRM |
| Phase 5 | Tuần 13–14 | Testing, performance optimization, SEO, production deployment |
| Phase 6+ | Post-launch | Review system, multi-language, loyalty program, channel manager OTA |

---

## 8. Các Vấn Đề Cần Làm Rõ

Những câu hỏi sau cần được chủ homestay xác nhận trước khi bắt đầu development:

| # | Câu hỏi | Ghi chú |
|---|---------|---------|
| 1 | Có bao nhiêu loại phòng và bao nhiêu phòng tổng cộng? | Ảnh hưởng đến thiết kế DB và UI |
| 2 | Ngân hàng nào sẽ dùng để nhận chuyển khoản? Có muốn tích hợp webhook tự động xác nhận không? | Nếu không có webhook, admin xác nhận thủ công — cần quy trình rõ ràng |
| 3 | Chính sách hủy phòng là gì? (hoàn tiền như thế nào khi đã chuyển khoản?) | Cần hard-code vào UI và quy trình hoàn tiền thủ công |
| 4 | Giá theo giờ có khác nhau theo loại phòng không? Có áp dụng giá giờ cao điểm không? | Ảnh hưởng đến cấu trúc bảng RoomPrice |
| 5 | Admin có cần app mobile để quản lý không? | Nếu có, cần thêm giai đoạn React Native |
| 6 | Có muốn tích hợp channel manager (đồng bộ Booking.com) không? | Phức tạp, nên để Phase 6+ |
| 7 | Domain và hosting đã có chưa? Ngân sách monthly infrastructure? | Ảnh hưởng đến lựa chọn hosting plan |

---

*Tài liệu phiên bản v1.1 — cập nhật bổ sung: thuê theo giờ, thanh toán chuyển khoản, bỏ đặt cọc, đặt phòng không cần đăng ký. Mọi thay đổi tiếp theo sẽ được ghi nhận vào Change Log và có thể ảnh hưởng đến timeline.*
