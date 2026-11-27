# BrewLite – Assignment 2 (Requirements to Deployment)

> **Môn học:** Công nghệ Phần mềm – Khoa CNTT, Trường ĐH Sài Gòn (HK I, 2026–2027)  
> **Công nghệ:** Next.js (Mobile-first PWA) • NestJS • PostgreSQL + Prisma • Docker • GitHub Actions CI/CD

Hệ thống đặt đồ uống tinh gọn theo luồng:  
`Xem menu → Tùy biến (Size/Topping) → Giỏ hàng → Đặt đơn (BOM & Concurrency Lock) → Thanh toán (Idempotency) → Theo dõi / Hủy đơn`

## Liên kết chính
- **Repository:** https://github.com/thanhkhoa087/brewlite-1
- **Release v1.0.0:** https://github.com/thanhkhoa087/brewlite-1/releases/tag/v1.0.0
- **Frontend Production (HTTPS):** https://brewlite-web-fawn.vercel.app
- **Trang Quầy Barista KDS:** https://brewlite-web-fawn.vercel.app/barista (`barista@brewlite.vn` / `Barista@123`)
- **Backend API Production:** https://api-brewlite.onrender.com/api
- **Health Check:** https://api-brewlite.onrender.com/health

---

## Cấu trúc dự án

```text
brewlite/
├── apps/
│   ├── web/                # Next.js PWA (src/, tests/, public/icons/, Dockerfile)
│   └── api/                # NestJS API (auth, products/BOM, orders, payments, health, prisma/migrations/, test/, Dockerfile)
├── docs/
│   ├── requirements/       # Task 1: Context & Scope, SRS, Use-Case Checkout
│   ├── diagrams/           # Task 2 & 3: Use-Case, Activity, Sequence, Class, Deployment (.puml/.svg/.png)
│   ├── architecture/       # Task 3: C4 Architecture & ADR (001–005)
│   ├── postman/            # Postman Collection, Environments & hướng dẫn kiểm thử API
│   ├── traceability-matrix.md
│   ├── deployment.md
│   └── sprint-retro.md
├── tests/e2e/              # End-to-End HTTP test suite & Concurrency Demo Script
├── .github/workflows/      # ci.yml (Quality Gate) & cd.yml (Docker Push, Deploy, Smoke Test, Rollback)
├── docker-compose.yml
└── .env.example
```

---

## Khởi chạy nhanh (Local)

### Cách 1: Docker Compose (1 lệnh)
```bash
cp .env.example .env
docker compose up --build -d
```
- Web PWA: `http://localhost:3000` | API: `http://localhost:5000/api` | Health: `http://localhost:5000/health`

### Cách 2: Chạy trực tiếp bằng Node.js (v20+)
```bash
# Backend (port 5000)
cd apps/api && npm install && npx prisma generate && npx prisma migrate deploy && npm run seed && npm run start:dev

# Frontend (port 3000 - mở terminal mới)
cd apps/web && npm install && npm run dev
```

---

## Kiểm thử (Lint, Unit, Integration, E2E & Postman)

```bash
# Backend: Lint, Unit Test, Integration Test & Build
cd apps/api && npm run lint && npm test && npm run test:integration && npm run build

# Frontend: Lint, Unit Test & Build
cd apps/web && npm run lint && npm test && npm run build

# End-to-End (E2E) Test & Demo Concurrency (2 user đặt cùng 2 ly cuối)
cd tests/e2e && npm test
node tests/e2e/concurrency-demo.js http://localhost:5000/api
```

**Kiểm thử Back-end bằng Postman:** Import 3 tệp trong [`docs/postman/`](docs/postman/README-POSTMAN.md) (đã có sẵn biến `base_url`, JSON payload và `pm.test` cho đăng ký/đăng nhập, BOM nguyên liệu, chống sửa giá, vượt tồn kho `409`, hủy đơn `PENDING → CANCELLED`, thanh toán & Idempotency replay).

---

## Quy trình Git, CI/CD & Rollback
- **Branching & Commit:** `main` (production), `develop` (tích hợp), `feature/<tên>`; quy ước Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `ci:`).
- **CI (`.github/workflows/ci.yml`):** Tự động chạy `Install → Lint → Unit/Integration/E2E Test → Build` trên mọi PR/Push.
- **CD (`.github/workflows/cd.yml`):** Push vào `main` hoặc tag `v*.*.*` sẽ chạy lại CI → build & push Docker image lên `ghcr.io` → `prisma migrate deploy` → trigger deploy → gọi **Smoke Test `GET /health`** 5 lần.
- **Rollback:** Nếu Smoke Test thất bại, pipeline tự động dừng và gọi `PROD_ROLLBACK_HOOK` (hoặc khôi phục image tag ổn định liền trước từ `ghcr.io` / Render Dashboard). Xem chi tiết tại [`docs/deployment.md`](docs/deployment.md).
