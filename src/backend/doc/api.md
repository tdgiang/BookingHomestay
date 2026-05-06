# Tài liệu API - NestJS Boilerplate

Tài liệu này mô tả chi tiết các API endpoints có sẵn trong dự án. Tất cả các API đều có tiền tố mặc định là `/api/v1`.

## Cấu trúc phản hồi chung (Standard Response)

Mọi API đều trả về một cấu trúc JSON thống nhất:

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

---

## 🔐 Xác thực (Authentication)

Dự án sử dụng chiến lược JWT (JSON Web Token). Các route yêu cầu xác thực phải gửi token qua Header:
`Authorization: Bearer <your_token>`

### 1. Đăng ký tài khoản (Register)
- **Endpoint**: `POST /auth/register`
- **Xác thực**: Public
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123",
    "firstName": "Nguyen",
    "lastName": "An"
  }
  ```
- **Phản hồi**: Thông tin người dùng vừa tạo (không bao gồm password).

### 2. Đăng nhập (Login)
- **Endpoint**: `POST /auth/login`
- **Xác thực**: Public
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```
- **Phản hồi**: `accessToken` dùng cho các yêu cầu sau này.

---

## 👤 Quản lý người dùng (Users)

Tất cả các route dưới đây đều yêu cầu **JWT Authentication**.

### 1. Lấy danh sách người dùng (Find All)
- **Endpoint**: `GET /users`
- **Query Parameters (Hỗ trợ phân trang, lọc, tìm kiếm)**:
  - `page`: Số trang (mặc định: 1)
  - `limit`: Số bản ghi mỗi trang (mặc định: 10)
  - `sortBy`: Trường cần sắp xếp (vd: `email`, `createdAt`)
  - `sortOrder`: `asc` hoặc `desc`
  - `search`: Tìm kiếm theo email hoặc tên
  - `isActive`: Lọc theo trạng thái (`true`/`false`)
- **Phản hồi**: Danh sách người dùng và thông tin phân trang (meta).

### 2. Lấy chi tiết người dùng (Find One)
- **Endpoint**: `GET /users/:id`
- **Phản hồi**: Thông tin chi tiết của 1 người dùng.

### 3. Tạo người dùng mới (Create)
- **Endpoint**: `POST /users`
- **Body**: Giống API Đăng ký.
- **Phản hồi**: Thông tin người dùng vừa tạo.

### 4. Cập nhật người dùng (Update)
- **Endpoint**: `PATCH /users/:id`
- **Body**: Các trường cần cập nhật (email, firstName, lastName, isActive, password).
- **Phản hồi**: Thông tin người dùng sau khi cập nhật.

### 5. Xóa người dùng (Delete)
- **Endpoint**: `DELETE /users/:id`
- **Phản hồi**: Thông tin người dùng vừa bị xóa.

---

## 📦 Quản lý sản phẩm (Products)

### 1. Lấy danh sách sản phẩm (Find All)
- **Endpoint**: `GET /products`
- **Xác thực**: Public
- **Query Parameters**:
  - `page`: Số trang (mặc định: 1)
  - `limit`: Số bản ghi mỗi trang (mặc định: 10)
  - `sortBy`: Trường cần sắp xếp (vd: `name`, `price`, `createdAt`)
  - `sortOrder`: `asc` hoặc `desc`
  - `search`: Tìm kiếm theo tên hoặc mô tả
  - `category`: Lọc theo danh mục
  - `isActive`: Lọc theo trạng thái (`true`/`false`)
- **Phản hồi**: Danh sách sản phẩm và thông tin phân trang.

### 2. Lấy chi tiết sản phẩm (Find One)
- **Endpoint**: `GET /products/:id`
- **Xác thực**: Public
- **Phản hồi**: Thông tin chi tiết của sản phẩm.

### 3. Tạo sản phẩm mới (Create)
- **Endpoint**: `POST /products`
- **Xác thực**: JWT Authentication
- **Body**:
  ```json
  {
    "name": "Tên sản phẩm",
    "description": "Mô tả sản phẩm",
    "price": 100000,
    "stock": 50,
    "category": "Electronics"
  }
  ```
- **Phản hồi**: Thông tin sản phẩm vừa tạo.

### 4. Cập nhật sản phẩm (Update)
- **Endpoint**: `PATCH /products/:id`
- **Xác thực**: JWT Authentication
- **Body**: Các trường cần cập nhật (name, description, price, stock, category, isActive).
- **Phản hồi**: Thông tin sản phẩm sau khi cập nhật.

### 5. Xóa sản phẩm (Delete)
- **Endpoint**: `DELETE /products/:id`
- **Xác thực**: JWT Authentication
- **Phản hồi**: Thông tin sản phẩm vừa bị xóa.

---

## 🛡️ Bảo mật & Hiệu năng
- **Rate Limiting**: Giới hạn 10 yêu cầu trong mỗi 60 giây (có thể cấu hình trong `.env`).
- **Caching**: Các API lấy danh sách và chi tiết người dùng/sản phẩm đã được tích hợp Redis cache (TTL 60 giây).
- **CORS**: Đã cấu hình cho phép truy cập từ các domain được chỉ định trong `.env`.
