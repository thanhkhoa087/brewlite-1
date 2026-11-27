# Tài Liệu Triển Khai Hệ Thống BrewLite (Deployment Guide)

> **Repository GitHub:** `https://github.com/thanhkhoa087/brewlite-1`

## 1. Tổng quan Kiến trúc Môi trường Triển khai
Hệ thống BrewLite được thiết kế phân tách rõ ràng 3 vùng môi trường (**Local Dev**, **CI/CD**, và **Production Cloud PaaS**), triển khai trên **Vercel** (Frontend Next.js PWA), **Render** (Backend NestJS Docker container) và **Managed PostgreSQL** trong mạng riêng.

### 1.1. Bảng phân vùng môi trường

| Thành phần | Môi trường Local Dev | Môi trường CI (GitHub Actions) | Môi trường Production (Cloud PaaS) |
| :--- | :--- | :--- | :--- |
| **Frontend Web** | Next.js Dev/Docker (`localhost:3000`) | Lint, Unit Test & Next.js Build | Vercel Edge (`https://brewlite-web-fawn.vercel.app`, gồm `/` và `/barista`) |
| **Backend API** | NestJS Dev/Docker (`localhost:5000`) | Lint, Unit, Integration & E2E Test | Render Web Service (`https://api-brewlite.onrender.com/api`) |
| **Health Check** | `http://localhost:5000/health` | Integration & E2E Assertion | `https://api-brewlite.onrender.com/health` |
| **Cơ sở dữ liệu** | PostgreSQL 16 (`localhost:5433 -> 5432`) | PostgreSQL 16 Service Container | Managed PostgreSQL 16 (Private VPC, không public) |
| **Giao thức** | HTTP (`http://localhost:*`) | Internal Loopback | HTTPS / TLS 1.3 (Port 443) |
| **Bảo mật Secrets** | File `.env` cục bộ (`.gitignore`) | GitHub Actions Secrets | PaaS Environment Variables Dashboard |

---

## 2. Thiết lập Biến môi trường (Environment Variables)

### 2.1. Backend (`apps/api/.env` - không commit lên Git)
```bash
NODE_ENV=production
PORT=5000
API_PREFIX=api

# Kết nối cơ sở dữ liệu PostgreSQL (Internal VPC URL)
DATABASE_URL="postgresql://<user>:<password>@<internal-host>:5432/brewlite_prod?sslmode=require"

# Khóa bí mật JWT (đặt trong GitHub Secrets / PaaS Dashboard)
JWT_SECRET="<strong-random-32+-char-secret>"
JWT_EXPIRES_IN="7d"
```

### 2.2. Frontend (`apps/web/.env.production`)
```bash
NEXT_PUBLIC_API_URL="https://api-brewlite.onrender.com/api"
NEXT_PUBLIC_APP_NAME="BrewLite"
```

### 2.3. GitHub Actions Secrets cần cấu hình cho CD (`.github/workflows/cd.yml`)
- `PROD_DATABASE_URL`: Chuỗi kết nối PostgreSQL Production để chạy `npx prisma migrate deploy`.
- `PROD_DEPLOY_HOOK`: Render Deploy Hook URL để kích hoạt triển khai Backend.
- `VERCEL_DEPLOY_HOOK`: Vercel Deploy Hook URL để kích hoạt triển khai Frontend (tùy chọn).
- `PROD_API_URL`: URL gốc của Backend API Production (mặc định `https://api-brewlite.onrender.com`).
- `PROD_ROLLBACK_HOOK`: Webhook hoàn nguyên bản triển khai ổn định trước đó khi Smoke Test thất bại.

---

## 3. Giám sát & Health Check
- **Health Check Endpoint:** `GET /health`
- **Mẫu phản hồi HTTP 200 OK:**
```json
{
  "status": "ok",
  "timestamp": "2026-10-31T11:55:00.000Z",
  "uptime": 12845.32,
  "info": {
    "database": {
      "status": "up"
    },
    "service": "brewlite-api",
    "version": "1.0.0"
  }
}
```

---

## 4. Quy trình Rollback khi Triển khai Thất bại (Rollback Procedure)
1. **Phát hiện lỗi tự động:** Sau khi pipeline CD triển khai phiên bản mới, job `smoke-test` gọi `GET /health` tối đa 5 lần liên tiếp (mỗi lần cách nhau 10 giây). Nếu không nhận được HTTP `200 OK`, job chuyển sang trạng thái **FAILURE** và kích hoạt bước rollback.
2. **Rollback trên Cloud PaaS (Render / Vercel):**
   - **Tự động:** Gọi `PROD_ROLLBACK_HOOK` trong bước `Trigger Rollback on Failure` của `.github/workflows/cd.yml`.
   - **Thủ công trên Render Dashboard:** Vào **Events / Deploys** → chọn bản deploy ổn định liền trước (ví dụ tag `v1.0.0`) → nhấn **Rollback to this deploy**.
3. **Rollback bằng Docker Image Tag (GHCR / VPS):**
   ```bash
   # Pull lại image bản ổn định trước đó từ GitHub Container Registry
   docker pull ghcr.io/thanhkhoa087/brewlite-1/brewlite-api:<previous-tag>
   docker pull ghcr.io/thanhkhoa087/brewlite-1/brewlite-web:<previous-tag>

   # Khởi động lại dịch vụ với tag ổn định
   docker compose up -d --no-build
   ```
4. **An toàn dữ liệu (Backward-compatible Migrations):** Mọi Prisma migration trong `apps/api/prisma/migrations/` được thiết kế chỉ bổ sung schema tương thích ngược, đảm bảo việc rollback container ứng dụng không gây mất dữ liệu giao dịch.
