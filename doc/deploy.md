# Hướng Dẫn Deploy VPS — Homestay Booking

## Kiến Trúc Production

```
                         ┌──────────────────────────┐
Internet (80/443)  ──►   │  Nginx (reverse proxy)   │
                         └────────────┬─────────────┘
                                      │
                    ┌─────────────────┼──────────────────┐
                    ▼                                    ▼
          homestay.com (→ :3000)          api.homestay.com (→ :4000)
          ┌──────────────────┐           ┌────────────────────┐
          │ Frontend (Next)  │           │  Backend (NestJS)  │
          └──────────────────┘           └─────────┬──────────┘
                                                   │
                                    ┌──────────────┼──────────────┐
                                    ▼                             ▼
                             PostgreSQL (:5432)          Redis (:6379)
                             (internal only)             (internal only)
```

**Stack:** Ubuntu 22.04 LTS · Docker 26+ · Docker Compose v2 · Nginx · Certbot (Let's Encrypt)

---

## Phần 1 — Yêu Cầu VPS

| Hạng mục | Tối thiểu | Khuyến nghị |
|----------|-----------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 2 GB | 4 GB |
| Disk | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Băng thông | 100 Mbps | 200 Mbps |

**Nhà cung cấp gợi ý:** DigitalOcean, Vultr, Linode, Hetzner, hoặc các VPS Việt Nam (Viettel IDC, VNPT).

---

## Phần 2 — Chuẩn Bị VPS

### 2.1 Kết nối lần đầu & cập nhật hệ thống

```bash
# Kết nối SSH bằng root
ssh root@<IP_VPS>

# Cập nhật hệ thống
apt update && apt upgrade -y
apt install -y curl git wget unzip ufw fail2ban
```

### 2.2 Tạo user deploy (không dùng root)

```bash
adduser deploy
usermod -aG sudo deploy

# Copy SSH key từ root sang deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Test đăng nhập bằng user mới (mở terminal khác)
ssh deploy@<IP_VPS>
```

### 2.3 Cấu hình firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh          # port 22
ufw allow http         # port 80
ufw allow https        # port 443
ufw enable

# Kiểm tra
ufw status verbose
```

> ⚠️ **Không mở port 4000 hay 3000 ra ngoài** — tất cả traffic đi qua Nginx.

### 2.4 Cài Docker & Docker Compose

```bash
# Cài Docker chính thức
curl -fsSL https://get.docker.com | sh

# Thêm user deploy vào group docker
usermod -aG docker deploy

# Đăng xuất và đăng nhập lại để nhận quyền group
exit
ssh deploy@<IP_VPS>

# Kiểm tra
docker --version          # Docker version 26.x.x
docker compose version    # Docker Compose version v2.x.x
```

---

## Phần 3 — Cấu Hình Domain & Nginx

### 3.1 Trỏ DNS

Vào DNS manager của domain, thêm 2 bản ghi A:

| Subdomain | Type | Value |
|-----------|------|-------|
| `homestay.com` (hoặc `@`) | A | `<IP_VPS>` |
| `api.homestay.com` | A | `<IP_VPS>` |
| `www.homestay.com` | A | `<IP_VPS>` |

> Đợi DNS propagate (~5–30 phút). Kiểm tra: `nslookup api.homestay.com`

### 3.2 Cài Nginx & Certbot

```bash
# Cài Nginx
sudo apt install -y nginx

# Cài Certbot
sudo apt install -y certbot python3-certbot-nginx

# Kiểm tra Nginx hoạt động
sudo systemctl status nginx
```

### 3.3 Cấu hình Nginx ban đầu (HTTP, để lấy SSL)

```bash
sudo nano /etc/nginx/sites-available/homestay
```

Dán nội dung sau:

```nginx
# Frontend
server {
    listen 80;
    server_name homestay.com www.homestay.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 80;
    server_name api.homestay.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support cho Socket.IO
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

```bash
# Kích hoạt config
sudo ln -s /etc/nginx/sites-available/homestay /etc/nginx/sites-enabled/
sudo nginx -t          # Kiểm tra cú pháp
sudo systemctl reload nginx
```

### 3.4 Lấy SSL certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d homestay.com -d www.homestay.com -d api.homestay.com \
  --non-interactive --agree-tos -m admin@homestay.com
```

Certbot sẽ tự động cập nhật file Nginx để thêm HTTPS. Sau đó chỉnh thêm:

```bash
sudo nano /etc/nginx/sites-available/homestay
```

Thay thế toàn bộ nội dung bằng config HTTPS đầy đủ sau:

```nginx
# ── Redirect HTTP → HTTPS ─────────────────────────────────────────────────────
server {
    listen 80;
    server_name homestay.com www.homestay.com api.homestay.com;
    return 301 https://$host$request_uri;
}

# ── Frontend ──────────────────────────────────────────────────────────────────
server {
    listen 443 ssl http2;
    server_name homestay.com www.homestay.com;

    ssl_certificate     /etc/letsencrypt/live/homestay.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/homestay.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Bảo mật headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    # Cache static Next.js assets
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}

# ── Backend API ───────────────────────────────────────────────────────────────
server {
    listen 443 ssl http2;
    server_name api.homestay.com;

    ssl_certificate     /etc/letsencrypt/live/homestay.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/homestay.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000" always;

    # Upload file tối đa 20MB
    client_max_body_size 20M;

    # WebSocket cho Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 3.5 Tự động gia hạn SSL

```bash
# Kiểm tra cronjob đã được Certbot thêm tự động
sudo systemctl status certbot.timer

# Test thủ công
sudo certbot renew --dry-run
```

---

## Phần 4 — Clone Code & Cấu Hình Môi Trường

### 4.1 Clone repository

```bash
# Tạo thư mục deploy
mkdir -p /home/deploy/apps
cd /home/deploy/apps

# Clone repo (thay bằng URL repo của bạn)
git clone https://github.com/your-username/homestay.git
cd homestay
```

> Nếu repo private: [tạo deploy key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys) hoặc dùng Personal Access Token.

### 4.2 Tạo file .env cho production

```bash
nano /home/deploy/apps/homestay/.env
```

Dán và điền đầy đủ các giá trị:

```dotenv
# ── Database ──────────────────────────────────────────────────────────────────
POSTGRES_DB=homestay
POSTGRES_USER=admin
POSTGRES_PASSWORD=<MẬT_KHẨU_MẠNH_DB>

# ── Redis ─────────────────────────────────────────────────────────────────────
REDIS_PASSWORD=<MẬT_KHẨU_MẠNH_REDIS>

# ── JWT ───────────────────────────────────────────────────────────────────────
# Tạo bằng: openssl rand -base64 48
JWT_SECRET=<SECRET_64_CHARS>
JWT_EXPIRATION=900
JWT_REFRESH_SECRET=<SECRET_64_CHARS_KHÁC>
JWT_REFRESH_EXPIRATION=604800

# ── NextAuth ──────────────────────────────────────────────────────────────────
# Tạo bằng: openssl rand -base64 33
AUTH_SECRET=<SECRET_44_CHARS>

# ── URLs ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=https://api.homestay.com
NEXT_PUBLIC_SITE_URL=https://homestay.com
CORS_ORIGIN=https://homestay.com,https://www.homestay.com

# ── Rate limiting ─────────────────────────────────────────────────────────────
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

**Tạo secret ngẫu nhiên:**

```bash
# JWT_SECRET và JWT_REFRESH_SECRET
openssl rand -base64 48

# AUTH_SECRET (NextAuth)
openssl rand -base64 33
```

### 4.3 Bảo vệ file .env

```bash
chmod 600 /home/deploy/apps/homestay/.env
```

---

## Phần 5 — Deploy Lần Đầu

### 5.1 Build và khởi động toàn bộ stack

```bash
cd /home/deploy/apps/homestay

# Build tất cả images (lần đầu mất 5-10 phút)
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# Theo dõi logs trong khi khởi động
docker compose -f docker-compose.prod.yml logs -f
```

### 5.2 Kiểm tra trạng thái containers

```bash
docker compose -f docker-compose.prod.yml ps
```

Kết quả mong đợi:

```
NAME                  STATUS          PORTS
homestay_postgres     healthy         5432/tcp
homestay_redis        healthy         6379/tcp
homestay_backend      healthy         0.0.0.0:4000->4000/tcp
homestay_frontend     Up              0.0.0.0:3000->3000/tcp
```

### 5.3 Kiểm tra ứng dụng

```bash
# Kiểm tra backend
curl https://api.homestay.com/api/v1/rooms

# Kiểm tra frontend
curl -I https://homestay.com

# Xem logs backend
docker compose -f docker-compose.prod.yml logs backend --tail=50

# Xem logs frontend
docker compose -f docker-compose.prod.yml logs frontend --tail=50
```

### 5.4 Tạo tài khoản admin đầu tiên

```bash
# Kết nối vào backend container
docker exec -it homestay_backend sh

# Hoặc dùng Prisma Studio từ host (cần thêm port tạm thời)
# Khuyến nghị: gọi API trực tiếp
curl -X POST https://api.homestay.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@homestay.com","password":"MatKhau@2024","firstName":"Admin","lastName":"Homestay"}'
```

> Sau khi tạo, vào database đổi `role` thành `ADMIN`:

```bash
docker exec -it homestay_postgres psql -U admin -d homestay \
  -c "UPDATE users SET role='ADMIN' WHERE email='admin@homestay.com';"
```

---

## Phần 6 — Cập Nhật Code (Redeploy)

### 6.1 Workflow cập nhật thông thường

```bash
cd /home/deploy/apps/homestay

# Pull code mới
git pull origin master

# Rebuild và restart (downtime ~30-60 giây)
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# Theo dõi quá trình
docker compose -f docker-compose.prod.yml logs -f --tail=100
```

### 6.2 Zero-downtime update (nâng cao)

Để giảm downtime, update từng service riêng:

```bash
# Chỉ rebuild backend
docker compose -f docker-compose.prod.yml --env-file .env up -d --build backend

# Chỉ rebuild frontend
docker compose -f docker-compose.prod.yml --env-file .env up -d --build frontend
```

### 6.3 Rollback khi có lỗi

```bash
# Xem lịch sử commits
git log --oneline -10

# Quay về commit trước
git checkout <COMMIT_HASH>
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

---

## Phần 7 — Backup Dữ Liệu

### 7.1 Backup database thủ công

```bash
# Tạo thư mục backup
mkdir -p /home/deploy/backups

# Backup PostgreSQL
docker exec homestay_postgres pg_dump -U admin homestay \
  | gzip > /home/deploy/backups/homestay_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup thư mục uploads
tar -czf /home/deploy/backups/uploads_$(date +%Y%m%d_%H%M%S).tar.gz \
  $(docker volume inspect homestay_uploads_data --format '{{.Mountpoint}}')
```

### 7.2 Tự động backup hàng ngày (cron)

```bash
crontab -e
```

Thêm dòng sau để backup lúc 2:00 sáng mỗi ngày:

```cron
0 2 * * * docker exec homestay_postgres pg_dump -U admin homestay | gzip > /home/deploy/backups/db_$(date +\%Y\%m\%d).sql.gz && find /home/deploy/backups -name "db_*.sql.gz" -mtime +14 -delete
```

> Giữ backup 14 ngày gần nhất, xóa cũ hơn tự động.

### 7.3 Restore từ backup

```bash
# Restore database
gunzip -c /home/deploy/backups/homestay_20260512_020000.sql.gz \
  | docker exec -i homestay_postgres psql -U admin homestay
```

---

## Phần 8 — Giám Sát (Monitoring)

### 8.1 Xem logs realtime

```bash
# Tất cả services
docker compose -f docker-compose.prod.yml logs -f

# Chỉ backend
docker compose -f docker-compose.prod.yml logs -f backend

# Chỉ frontend
docker compose -f docker-compose.prod.yml logs -f frontend

# N dòng gần nhất
docker compose -f docker-compose.prod.yml logs --tail=200 backend
```

### 8.2 Kiểm tra tài nguyên

```bash
# CPU và RAM của containers
docker stats --no-stream

# Disk usage
df -h
docker system df
```

### 8.3 Health check tự động

Backend tích hợp health check trong `docker-compose.prod.yml`. Xem trạng thái:

```bash
docker inspect homestay_backend | grep -A5 '"Health"'
```

### 8.4 Script kiểm tra nhanh

Tạo file `/home/deploy/check.sh`:

```bash
#!/bin/bash
echo "=== Container Status ==="
docker compose -f /home/deploy/apps/homestay/docker-compose.prod.yml ps

echo ""
echo "=== API Health ==="
curl -s https://api.homestay.com/api/v1/rooms | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK -', d.get('data',{}).get('meta',{}).get('total',0), 'rooms')" 2>/dev/null || echo "API ERROR"

echo ""
echo "=== Disk ==="
df -h / | tail -1

echo ""
echo "=== Memory ==="
free -h | grep Mem
```

```bash
chmod +x /home/deploy/check.sh
./check.sh
```

---

## Phần 9 — Xử Lý Sự Cố

### 9.1 Container không start được

```bash
# Xem log lỗi
docker compose -f docker-compose.prod.yml logs backend --tail=100

# Xem lý do container exit
docker inspect homestay_backend | grep -A3 '"ExitCode"'

# Restart service cụ thể
docker compose -f docker-compose.prod.yml restart backend
```

### 9.2 Lỗi kết nối database

```bash
# Kiểm tra postgres đang chạy
docker exec homestay_postgres pg_isready -U admin -d homestay

# Kiểm tra biến môi trường
docker exec homestay_backend env | grep DATABASE_URL

# Kết nối thủ công vào DB
docker exec -it homestay_postgres psql -U admin -d homestay
```

### 9.3 Lỗi kết nối Redis

```bash
# Kiểm tra Redis
docker exec homestay_redis redis-cli -a $REDIS_PASSWORD ping

# Xem logs Redis
docker compose -f docker-compose.prod.yml logs redis --tail=50
```

### 9.4 Hết dung lượng disk

```bash
# Xóa Docker images/containers cũ không dùng
docker system prune -a --volumes

# Xóa logs cũ của Docker (cẩn thận)
sudo find /var/lib/docker/containers -name "*.log" -exec truncate -s 0 {} \;
```

### 9.5 Lỗi SSL certificate

```bash
# Gia hạn thủ công
sudo certbot renew --force-renewal

# Reload Nginx sau khi gia hạn
sudo systemctl reload nginx
```

### 9.6 Lỗi migration Prisma khi deploy

Nếu backend log báo migration failed:

```bash
# Chạy migrate thủ công bên trong container
docker exec -it homestay_backend sh
npx prisma migrate deploy
exit
```

---

## Phần 10 — Tối Ưu Bổ Sung (Tùy Chọn)

### 10.1 Giới hạn log size Docker

Thêm vào `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
```

### 10.2 Bật swap (cho VPS 2GB RAM)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 10.3 Cấu hình Nginx cache cho uploads

Thêm vào server block `api.homestay.com`:

```nginx
location /uploads/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_cache_valid 200 24h;
    add_header Cache-Control "public, max-age=86400";
    proxy_set_header Host $host;
}
```

### 10.4 Rate limiting tầng Nginx

Thêm vào đầu file `/etc/nginx/nginx.conf` trong block `http {}`:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
```

Thêm vào server block API:

```nginx
location /api/v1/bookings {
    limit_req zone=api burst=10 nodelay;
    proxy_pass http://127.0.0.1:4000;
    # ... các proxy_set_header khác
}
```

---

## Tóm Tắt Lệnh Thường Dùng

```bash
# Đường dẫn project
APP=/home/deploy/apps/homestay

# Xem trạng thái
docker compose -f $APP/docker-compose.prod.yml ps

# Xem logs
docker compose -f $APP/docker-compose.prod.yml logs -f [service]

# Deploy mới
cd $APP && git pull && docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# Restart service
docker compose -f $APP/docker-compose.prod.yml restart [backend|frontend]

# Backup DB
docker exec homestay_postgres pg_dump -U admin homestay | gzip > ~/backups/db_$(date +%Y%m%d).sql.gz

# Vào container
docker exec -it homestay_backend sh
docker exec -it homestay_postgres psql -U admin -d homestay

# Dọn dẹp Docker
docker system prune -a
```

---

## Checklist Deploy Lần Đầu

- [ ] VPS đã cập nhật hệ thống, cài Docker, cấu hình firewall
- [ ] DNS đã trỏ đúng IP cho `homestay.com` và `api.homestay.com`
- [ ] Nginx cài xong, SSL certificate đã lấy từ Let's Encrypt
- [ ] File `.env` đã điền đầy đủ, secrets ngẫu nhiên, quyền `600`
- [ ] `docker compose up --build` thành công, 4 containers đều `healthy`/`Up`
- [ ] `curl https://api.homestay.com/api/v1/rooms` trả về dữ liệu
- [ ] `https://homestay.com` hiển thị trang chủ bình thường
- [ ] Tạo tài khoản admin và set `role = ADMIN` trong DB
- [ ] Kiểm tra WebSocket: notification bell hoạt động trong `/cms`
- [ ] Cấu hình cron backup tự động
- [ ] `certbot renew --dry-run` không báo lỗi
