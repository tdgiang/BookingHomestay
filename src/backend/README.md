# NestJS Production-Ready Boilerplate (Tiếng Việt)

Dự án này là một boilerplate NestJS sẵn sàng cho môi trường production, tích hợp Clean Architecture, Prisma ORM, Redis caching, JWT authentication và chuẩn hóa phản hồi API.

## Tính năng chính

- **Clean Architecture**: Tổ chức mã nguồn theo các lớp Domain, Application, Infrastructure và Interface.
- **Cấu trúc Modular**: Dễ dàng mở rộng và bảo trì.
- **Prisma ORM**: Truy cập cơ sở dữ liệu hiện đại, an toàn kiểu dữ liệu (type-safety) cho PostgreSQL.
- **Redis Cache**: Tích hợp sẵn bộ nhớ đệm giúp tối ưu hiệu năng.
- **JWT Authentication**: Bảo mật bằng JWT với global guard và decorator `@Public()`.
- **Global Exception Filter**: Chuẩn hóa phản hồi lỗi trên toàn ứng dụng.
- **Transform Interceptor**: Cấu trúc JSON phản hồi đồng nhất.
- **Logging**: Hệ thống ghi log mạnh mẽ với Winston.
- **Quản lý Cấu hình**: Xác thực biến môi trường bằng Joi.
- **Phân trang, Lọc, Sắp xếp, Tìm kiếm**: Các tiện ích xử lý dữ liệu tích hợp sẵn.

## Cấu trúc phản hồi chuẩn

Tất cả các phản hồi từ API luôn tuân theo cấu trúc sau:

```json
{
  "success": boolean,
  "statusCode": number,
  "timestamp": string,
  "path": string,
  "message": string,
  "data": any | null,
  "errors": any | null
}
```

## Bắt đầu dự án

### Yêu cầu hệ thống

- Node.js (v16+)
- PostgreSQL
- Redis

### Cài đặt

1.  **Clone repository** (hoặc copy boilerplate này).
2.  **Cài đặt dependencies**:
    ```bash
    npm install
    ```
3.  **Thiết lập biến môi trường**:
    Tạo file `.env` dựa trên `.env.example` (hoặc sử dụng file `.env` đã cung cấp).
4.  **Chạy database migration**:
    ```bash
    npx prisma migrate dev
    ```
5.  **Chạy ứng dụng**:
    ```bash
    npm run start:dev
    ```

## Tổng quan cấu trúc dự án

- `src/common`: Decorators, filters, guards, interceptors và DTO dùng chung.
- `src/config`: Cấu hình và xác thực biến môi trường.
- `src/modules`: Các module chức năng (Auth, Users).
  - `domain`: Thực thể (tùy chọn cho các trường hợp đơn giản).
  - `application`: Services và logic nghiệp vụ.
  - `infrastructure`: Tương tác dữ liệu (Repositories, Prisma).
  - `interface`: Controllers và DTOs.
- `src/prisma`: Prisma service và module.

## Danh sách API chính

### Auth
- `POST /api/v1/auth/register`: Đăng ký người dùng mới.
- `POST /api/v1/auth/login`: Đăng nhập và nhận mã JWT token.

### Users (Yêu cầu đăng nhập)
- `GET /api/v1/users`: Danh sách người dùng (hỗ trợ phân trang, lọc, tìm kiếm, sắp xếp).
- `GET /api/v1/users/:id`: Lấy chi tiết người dùng.
- `PATCH /api/v1/users/:id`: Cập nhật thông tin người dùng.
- `DELETE /api/v1/users/:id`: Xóa người dùng.

## Tham số truy vấn cho Phân trang & Lọc

- `page`: Số trang (mặc định: 1).
- `limit`: Số bản ghi mỗi trang (mặc định: 10).
- `sortBy`: Trường cần sắp xếp (mặc định: `createdAt`).
- `sortOrder`: `asc` hoặc `desc` (mặc định: `desc`).
- `search`: Chuỗi tìm kiếm theo email và tên.
- `isActive`: Lọc theo trạng thái hoạt động (true/false).
- `email`: Lọc chính xác theo email.

## Best Practices được áp dụng

- **Xác thực dữ liệu**: Sử dụng `class-validator` một cách nghiêm ngặt trong DTO.
- **Chuyển đổi dữ liệu**: Global transformation cho cả request và response.
- **Bảo mật**: Mã hóa mật khẩu bằng Bcrypt, quản lý phiên làm việc bằng JWT.
- **Hiệu năng**: Tích hợp Redis để sẵn sàng cho việc caching.
- **Khả năng bảo trì**: Thiết kế theo Clean Architecture và modular pattern.
