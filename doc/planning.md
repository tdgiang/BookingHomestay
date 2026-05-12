# KẾ HOẠCH THỰC HIỆN DỰ ÁN
## Website Đặt Phòng Homestay Trực Tiếp

| Trường | Nội dung |
|--------|----------|
| Phiên bản | v1.0 |
| Ngày lập | 2026-05-06 |
| Dựa trên | PRD v1.1 |
| Stack thực tế | Next.js 16 + NestJS 11 + Prisma 7 + PostgreSQL + Redis |

---

## 1. Quyết Định Kỹ Thuật Đã Xác Nhận

| Hạng mục | Quyết định |
|----------|------------|
| Quản lý phòng | Từng phòng riêng lẻ (không nhóm theo loại) |
| Giá theo giờ | Thay đổi theo khung giờ + từng phòng |
| Xác nhận thanh toán | Cả 2: thủ công (admin UI) + webhook ngân hàng tự động |
| Chính sách hủy | Admin xử lý case by case, không hard-code |
| Lưu trữ ảnh | Local (multer), migrate S3 sau |
| Frontend | Next.js 16 (bỏ qua ghi chú Next.js 14 trong PRD) |

---

## 2. Kiến Trúc Tổng Thể

```
┌─────────────────────┐      REST API       ┌──────────────────────┐
│   Next.js 16        │ ◄──────────────────► │   NestJS 11          │
│                     │                      │                      │
│  (marketing)/       │                      │  /api/v1/rooms       │
│  (auth)/            │                      │  /api/v1/bookings    │
│  cms/               │                      │  /api/v1/payments    │
│  (booking)/         │                      │  /api/v1/guests      │
└─────────────────────┘                      │  /api/v1/admin/*     │
                                             └──────────┬───────────┘
                                                        │
                                          ┌─────────────┼─────────────┐
                                          │             │             │
                                     PostgreSQL      Redis         uploads/
                                     (primary)      (cache)       (images)
```

### Frontend Route Groups

| Route Group | Mục đích | Auth |
|-------------|----------|------|
| `(marketing)/` | Trang chủ, danh sách phòng, chi tiết phòng, bản đồ | Public |
| `(booking)/` | Luồng đặt phòng 5 bước, trang xác nhận, QR thanh toán | Public |
| `(auth)/` | Login admin | Public |
| `cms/` | Admin dashboard, calendar, pricing, CRM, quản lý phòng | JWT (Admin) |

### Backend Modules

| Module | Chức năng |
|--------|-----------|
| `RoomsModule` | CRUD phòng, upload ảnh, availability check |
| `BookingsModule` | Tạo/quản lý đặt phòng, tính giá, check trùng lịch |
| `GuestsModule` | CRM khách hàng, lịch sử đặt phòng |
| `PaymentsModule` | Khởi tạo GD, webhook ngân hàng, confirm thủ công |
| `PricingModule` | Quản lý bảng giá (đêm/giờ/mùa/cuối tuần) |
| `AuthModule` | JWT auth cho admin (đã có sẵn) |
| `NotificationsModule` | Email queue (BullMQ), WebSocket realtime |
| `UploadsModule` | Multer local storage, serve static files |

---

## 3. Database Schema

### 3.1 Prisma Schema

```prisma
enum BookingType {
  NIGHTLY
  HOURLY
}

enum BookingStatus {
  PENDING       // Chờ xác nhận thanh toán
  CONFIRMED     // Đã xác nhận
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
}

enum PriceType {
  BASE_NIGHTLY      // Giá đêm thường
  WEEKEND_NIGHTLY   // Giá đêm cuối tuần
  SEASONAL_NIGHTLY  // Giá đêm mùa cao điểm
  HOURLY            // Giá theo giờ (theo khung giờ)
}

model Room {
  id          String   @id @default(uuid())
  name        String   // VD: "Phòng 101", "Phòng Hoa Sen"
  description String?
  capacity    Int      // Sức chứa tối đa
  area        Float?   // Diện tích m²
  floor       Int?
  amenities   String[] // ["WiFi", "AC", "TV", ...]
  images      String[] // Đường dẫn local, ảnh[0] là ảnh đại diện
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  bookings    Booking[]
  prices      RoomPrice[]

  @@map("rooms")
}

model RoomPrice {
  id          String    @id @default(uuid())
  roomId      String
  room        Room      @relation(fields: [roomId], references: [id])
  priceType   PriceType
  price       Float     // Giá VND

  // Áp dụng cho date range (seasonal, override)
  startDate   DateTime?
  endDate     DateTime?

  // Áp dụng cho ngày trong tuần (0=CN, 1=T2...6=T7)
  // null = áp dụng tất cả các ngày
  daysOfWeek  Int[]

  // Chỉ dùng cho HOURLY: khung giờ áp dụng
  hourFrom    Int?  // 0-23
  hourTo      Int?  // 0-23 (exclusive)

  // Giảm giá lưu trú dài (chỉ cho NIGHTLY)
  minNights   Int?    // VD: 7 (ở từ 7 đêm trở lên)
  discount    Float?  // VD: 0.10 = giảm 10%

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("room_prices")
}

model Guest {
  id        String    @id @default(uuid())
  fullName  String
  phone     String    // Bắt buộc, unique identifier thực tế
  email     String?
  notes     String?   // Ghi chú nội bộ (chỉ admin thấy)
  tags      String[]  // ["VIP", "Khách quen", "Khách nhóm"]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  bookings  Booking[]

  @@map("guests")
}

model Booking {
  id            String        @id @default(uuid())
  bookingCode   String        @unique // Format: HSB-YYYYMMDD-XXXX
  roomId        String
  room          Room          @relation(fields: [roomId], references: [id])
  guestId       String
  guest         Guest         @relation(fields: [guestId], references: [id])

  bookingType   BookingType
  checkIn       DateTime      // Ngày + giờ check-in
  checkOut      DateTime      // Ngày + giờ check-out
  durationHours Int?          // Chỉ có giá trị khi bookingType = HOURLY

  adults        Int           @default(1)
  children      Int           @default(0)
  specialRequest String?

  status        BookingStatus @default(PENDING)
  totalPrice    Float
  source        String        @default("direct") // "direct" | "manual" (admin tạo tay)

  internalNote  String?       // Ghi chú nội bộ admin
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  deletedAt     DateTime?

  payment       Payment?

  @@map("bookings")
}

model Payment {
  id          String        @id @default(uuid())
  bookingId   String        @unique
  booking     Booking       @relation(fields: [bookingId], references: [id])
  amount      Float
  method      String        @default("bank_transfer")
  status      PaymentStatus @default(PENDING)
  bankRef     String?       // Mã tham chiếu ngân hàng
  paidAt      DateTime?
  confirmedBy String?       // adminId nếu xác nhận thủ công
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("payments")
}
```

### 3.2 Logic Tính Giá

```
NIGHTLY booking:
  1. Lấy các RoomPrice của phòng theo priceType ưu tiên:
     SEASONAL > WEEKEND > BASE_NIGHTLY
  2. Với mỗi đêm, tìm giá phù hợp nhất (date range + dayOfWeek)
  3. Nếu số đêm >= minNights → áp dụng discount

HOURLY booking:
  1. Lấy RoomPrice priceType = HOURLY của phòng
  2. Tìm khung giờ phù hợp (hourFrom <= giờ bắt đầu < hourTo)
  3. Tổng = giá/giờ × số giờ (tối thiểu 2 giờ)
```

---

## 4. API Endpoints

### Public (không cần JWT)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/rooms` | Danh sách phòng + filter (dates, type, guests) |
| GET | `/api/v1/rooms/:id` | Chi tiết phòng + availability + pricing |
| GET | `/api/v1/rooms/:id/availability` | Check phòng trống theo date range/giờ |
| GET | `/api/v1/rooms/:id/pricing` | Tính giá cho date/giờ cụ thể |
| POST | `/api/v1/bookings` | Tạo đặt phòng mới (guest không cần account) |
| GET | `/api/v1/bookings/code/:bookingCode` | Tra cứu đặt phòng theo booking code |
| POST | `/api/v1/payments/webhook` | Webhook nhận callback từ ngân hàng |

### Admin (cần JWT + Role.ADMIN)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/admin/dashboard` | KPI: check-in hôm nay, doanh thu, occupancy rate |
| GET | `/api/v1/admin/rooms` | Danh sách phòng (bao gồm inactive) |
| POST | `/api/v1/admin/rooms` | Thêm phòng mới |
| PATCH | `/api/v1/admin/rooms/:id` | Cập nhật thông tin phòng |
| DELETE | `/api/v1/admin/rooms/:id` | Soft delete phòng |
| POST | `/api/v1/admin/rooms/:id/images` | Upload ảnh (multipart/form-data) |
| DELETE | `/api/v1/admin/rooms/:id/images` | Xóa ảnh |
| GET | `/api/v1/admin/bookings` | Danh sách booking (filter: status, date, room) |
| POST | `/api/v1/admin/bookings` | Tạo booking thủ công |
| PATCH | `/api/v1/admin/bookings/:id` | Cập nhật status, ghi chú nội bộ |
| DELETE | `/api/v1/admin/bookings/:id` | Hủy booking (soft delete) |
| PATCH | `/api/v1/admin/bookings/:id/block` | Block ngày (nhiều phòng cùng lúc) |
| GET | `/api/v1/admin/guests` | Danh sách khách + filter + export |
| GET | `/api/v1/admin/guests/:id` | Chi tiết khách + lịch sử đặt phòng |
| PATCH | `/api/v1/admin/guests/:id` | Cập nhật tags, ghi chú |
| GET | `/api/v1/admin/pricing` | Xem bảng giá tất cả phòng |
| POST | `/api/v1/admin/pricing` | Thêm rule giá mới |
| PATCH | `/api/v1/admin/pricing/:id` | Sửa rule giá |
| DELETE | `/api/v1/admin/pricing/:id` | Xóa rule giá |
| PATCH | `/api/v1/admin/payments/:id/confirm` | Xác nhận thanh toán thủ công |

---

## 5. Frontend — Màn Hình Chính

### Customer Portal

| Route | Màn hình | Tính năng chính |
|-------|----------|-----------------|
| `/` | Trang chủ | Hero + Search widget (đêm/giờ) + danh sách phòng nổi bật |
| `/rooms` | Danh sách phòng | Search results, filter/sort, availability badge |
| `/rooms/[id]` | Chi tiết phòng | Gallery lightbox, thông tin, amenities, bản đồ, booking widget |
| `/booking/[roomId]` | Bước 1: Chọn thời gian | Date/time picker, số khách, xem giá realtime |
| `/booking/[roomId]/info` | Bước 2: Thông tin khách | Họ tên, SĐT, yêu cầu đặc biệt |
| `/booking/[roomId]/payment` | Bước 3: Thanh toán | Tóm tắt đặt phòng, QR VietQR, hướng dẫn CK |
| `/booking/success` | Xác nhận thành công | Booking code, thông tin đặt phòng, nút chia sẻ |
| `/booking/lookup` | Tra cứu đặt phòng | Nhập booking code, xem trạng thái |

### Admin Dashboard (`/cms/`)

| Route | Màn hình | Tính năng chính |
|-------|----------|-----------------|
| `/cms` | Dashboard | KPI cards, doanh thu chart, task list (pending bookings) |
| `/cms/calendar` | Lịch đặt phòng | Gantt timeline, màu trạng thái, click/drag, thêm booking |
| `/cms/bookings` | Danh sách booking | Bảng filter, thay đổi status, export |
| `/cms/bookings/[id]` | Chi tiết booking | Thông tin đầy đủ, confirm payment, ghi chú nội bộ |
| `/cms/rooms` | Quản lý phòng | CRUD, upload ảnh, toggle active |
| `/cms/rooms/[id]` | Chi tiết/Edit phòng | Form, drag-drop ảnh, amenities checkbox |
| `/cms/pricing` | Bảng giá | Calendar heatmap, thêm/sửa rule giá (đêm/giờ/mùa) |
| `/cms/guests` | CRM khách hàng | Bảng filter, lịch sử, tags, export Excel |
| `/cms/guests/[id]` | Chi tiết khách | Profile, lịch sử đặt phòng, tổng chi tiêu |

---

## 6. Roadmap Thực Hiện

### Phase 1 — Foundation & Admin Auth (Tuần 1)
**Backend:**
- [x] Thiết kế và migrate Prisma schema (Room, RoomPrice, Guest, Booking, Payment)
- [x] `UploadsModule` — multer local storage, serve `/uploads` static
- [x] `RoomsModule` — CRUD admin, upload ảnh, soft delete
- [x] Seed data: 5-10 phòng mẫu + bảng giá cơ bản

**Frontend:**
- [x] Scaffold Next.js 16 project trong `src/frontend/`
- [x] Setup NextAuth v5, Tailwind v4, shadcn/ui, React Query, Zustand
- [x] Layout CMS: sidebar, header, breadcrumb
- [x] `/cms/rooms` — CRUD phòng + upload ảnh drag-drop

---

### Phase 2 — Customer Portal: Hiển Thị Phòng (Tuần 2)
**Backend:**
- [x] `PricingModule` — CRUD pricing rules, tính giá cho date/giờ cụ thể
- [x] `RoomsModule` — public endpoints: availability check, pricing preview

**Frontend:**
- [x] Layout marketing: header, footer, responsive
- [x] `/` — Trang chủ + Search widget (2 chế độ: đêm/giờ)
- [x] `/rooms` — Danh sách phòng, filter, sort
- [x] `/rooms/[id]` — Chi tiết phòng: gallery lightbox, amenities, booking widget
- [x] Tích hợp Google Maps / Mapbox cho vị trí homestay

---

### Phase 3 — Booking Flow & Thanh Toán (Tuần 3–4)
**Backend:**
- [x] `GuestsModule` — tìm hoặc tạo guest theo phone
- [x] `BookingsModule` — tạo booking public (check trùng lịch, tính giá, sinh booking code)
- [x] `PaymentsModule` — tạo payment record, webhook endpoint, confirm thủ công
- [x] Generate QR VietQR (static hoặc API VietQR)

**Frontend:**
- [x] `/booking/[roomId]` — Bước 1: chọn thời gian + số khách + preview giá realtime
- [x] `/booking/[roomId]/info` — Bước 2: form thông tin khách (react-hook-form + zod)
- [x] `/booking/[roomId]/payment` — Bước 3: QR VietQR + hướng dẫn chuyển khoản
- [x] `/booking/success` — Trang xác nhận + booking code
- [x] `/booking/lookup` — Tra cứu trạng thái đặt phòng

---

### Phase 4 — Admin Dashboard & Calendar (Tuần 5–6)
**Backend:**
- [x] `DashboardModule` — KPIs, occupancy rate, doanh thu
- [x] Booking calendar data endpoint (dạng events per room per day)
- [x] Block ngày API
- [x] Tạo booking thủ công (admin)

**Frontend:**
- [x] `/cms` — Dashboard: KPI cards, chart doanh thu (Recharts), task list
- [x] `/cms/calendar` — Gantt/Timeline calendar (thư viện: react-big-calendar hoặc custom)
- [x] `/cms/bookings` — Bảng quản lý booking, filter status, confirm payment
- [x] `/cms/pricing` — Calendar heatmap giá, form thêm/sửa rule giá

---

### Phase 5 — CRM & Notifications (Tuần 7–8)
**Backend:**
- [x] `GuestsModule` — admin endpoints: filter (search + tags), lịch sử đặt phòng, export CSV
- [x] `NotificationsModule` — BullMQ email queue (nhắc check-in T-1)
- [x] WebSocket gateway (`/notifications`) — real-time notify khi có booking mới
- [x] Audit log interceptor cho hành động admin (POST/PATCH/DELETE /admin/*)

**Frontend:**
- [x] `/cms/guests` + `/cms/guests/[id]` — CRM đầy đủ (list, filter, tags, export, detail + history)
- [x] Notification bell realtime trên admin header (Socket.IO)
- [x] Export CSV (booking, guests)

---

### Phase 6 — Testing, SEO & Deployment (Tuần 9–10)
- [x] Unit tests backend (services, repositories) — 374 tests, 28 suites
- [x] E2E tests booking flow (Playwright) — `src/frontend/e2e/` (homepage, rooms, booking-flow)
- [x] SSR/SSG cho `/rooms` và `/rooms/[id]` — `/rooms` chuyển thành server component với SSR
- [x] Open Graph tags, sitemap.xml, JSON-LD structured data — layout.tsx, generateMetadata, /sitemap.xml, /robots.txt, JSON-LD homepage + room detail
- [x] Performance audit: LCP < 2.5s, API p95 < 300ms — next.config: image optimization AVIF/WebP, bundle tree-shaking, standalone output; backend: gzip compression, Redis-backed cache, 6 Prisma DB indexes (rooms, bookings, guests)
- [x] CORS, Helmet.js, rate limiting review — Helmet v8 + CSP headers, CORS multi-origin support
- [x] Production deployment — Dockerfile (backend + frontend standalone), docker-compose.prod.yml, vercel.json, GitHub Actions CI (.github/workflows/ci.yml), .env.example files

---

## 7. Các Thư Viện Bổ Sung Cần Cài

### Backend (`src/backend/`)

| Package | Mục đích |
|---------|----------|
| `@nestjs/bullmq` + `bullmq` | Email queue |
| `@nestjs/websockets` + `socket.io` | Realtime notifications |
| `multer` + `@types/multer` | Upload file local |
| `@nestjs/serve-static` | Serve thư mục `uploads/` |
| `exceljs` | Export Excel |

### Frontend (`src/frontend/`)

| Package | Mục đích |
|---------|----------|
| `@tanstack/react-query` | Data fetching + cache |
| `zustand` | State management (booking flow) |
| `react-big-calendar` hoặc `@fullcalendar/react` | Admin booking calendar |
| `recharts` | Chart doanh thu dashboard |
| `react-dropzone` | Upload ảnh drag-drop |
| `yet-another-react-lightbox` | Gallery lightbox |
| `react-map-gl` hoặc `@react-google-maps/api` | Bản đồ |
| `xlsx` hoặc `exceljs` | Export Excel client-side |
| `date-fns` | Xử lý date/time |
| `qrcode.react` | Hiển thị QR VietQR |

---

## 8. Quy Ước Code

### Booking Code Format
```
HSB-YYYYMMDD-XXXX
VD: HSB-20260506-A3F2
```
Generate: `HSB-${date}-${nanoid(4).toUpperCase()}`

### Availability Check Logic
Khi tạo booking, phải kiểm tra không có booking nào của cùng phòng mà:
```
existingBooking.checkIn < newCheckOut AND existingBooking.checkOut > newCheckIn
AND existingBooking.status NOT IN ['CANCELLED']
```

### Giá Ưu Tiên (Priority)
```
SEASONAL_NIGHTLY (có date range cụ thể)
  > WEEKEND_NIGHTLY (daysOfWeek: [5,6,0])
  > BASE_NIGHTLY (mặc định)

HOURLY (tìm khung giờ phù hợp hourFrom <= hour < hourTo)
```

### Image Storage
```
uploads/rooms/{roomId}/{uuid}.{ext}
Serve tại: GET /uploads/rooms/{roomId}/{filename}
```

---

## 9. Rủi Ro & Giải Pháp

| Rủi ro | Giải pháp |
|--------|-----------|
| Booking trùng lịch khi nhiều user đặt cùng lúc | Dùng DB transaction + unique constraint hoặc pessimistic locking |
| Webhook ngân hàng giả mạo | Verify signature header, whitelist IP ngân hàng |
| Giá tính sai khi có nhiều pricing rules | Unit test kỹ pricing service, log giá tại thời điểm tạo booking |
| Upload ảnh quá lớn | Giới hạn 5MB/file, tối đa 20 ảnh/phòng, resize bằng sharp |
| Local storage mất dữ liệu khi deploy | Document rõ migration path sang S3 (chỉ đổi storage adapter) |
