# Ma Trận Truy Vết Yêu Cầu (Requirements Traceability Matrix - RTM)

Bảng ma trận truy vết thể hiện sự liên kết chặt chẽ và nhất quán xuyên suốt từ Yêu cầu nghiệp vụ (FR/NFR), Use-case/User Story, Thiết kế mô hình hóa, Mã nguồn thực thi (Code/API) đến Bộ kiểm thử nghiệm thu (Test Suites).

## 1. Truy vết Yêu cầu Chức năng (Functional Requirements Traceability)

| Mã yêu cầu | Use-case / User Story | Thiết kế / Sơ đồ liên quan | Code / API Component | Test Case ID & Phạm vi kiểm thử |
| :---: | :--- | :--- | :--- | :--- |
| **FR-01** | US-01: Xem menu và danh mục | `usecase-overview.puml`, `activity-checkout.puml`, `class-diagram.puml` | API: `GET /api/products`<br>UI: `page.tsx`, `CategoryFilter.tsx`, `ProductCard.tsx` | **API-T01:** Unit test `products.service.spec.ts` (lấy danh sách & lọc danh mục) |
| **FR-02** | US-02: Xem chi tiết món & Tùy biến | `activity-checkout.puml`, `class-diagram.puml` (`OrderItem`) | API: `GET /api/products/:id`<br>UI: `ProductDetailModal.tsx`, `pricing.mjs` | **UI-T01:** `apps/web/tests/pricing-and-cart.test.mjs` (test tính giá size S/M/L + topping) |
| **FR-03** | US-03: Quản lý giỏ hàng và tính tiền | `activity-checkout.puml`, `use-case-checkout.md` | UI: `CartContext.tsx`, `CartDrawer.tsx`, `pricing.mjs` | **UI-T02:** `apps/web/tests/pricing-and-cart.test.mjs` (test tổng tiền & mã giảm giá) |
| **FR-04** | US-04: Đăng ký & Đăng nhập (JWT) | `activity-checkout.puml`, `sequence-checkout.puml` | API: `POST /api/auth/register`, `POST /api/auth/login`<br>Guard: `jwt-auth.guard.ts`, `AuthModal.tsx` | **API-T02:** Unit test `auth.service.spec.ts` (hash Bcrypt & ký JWT token) |
| **FR-05** | UC-01: Khởi tạo đơn hàng & Kiểm kho | `use-case-checkout.md`, `sequence-checkout.puml`, `class-diagram.puml` | API: `POST /api/orders`<br>Service: `orders.service.ts` | **INT-T01:** `orders.service.spec.ts` & `orders-payments.integration.spec.ts` (transaction trừ kho, rollback khi hết hàng) |
| **FR-06** | UC-02: Xử lý thanh toán mô phỏng | `sequence-checkout.puml`, `class-diagram.puml` (`Payment`) | API: `POST /api/payments/process`<br>Service: `payments.service.ts`, `CheckoutModal.tsx` | **INT-T02:** `payments.service.spec.ts` & `orders-payments.integration.spec.ts` (chuyển trạng thái sang `PAID`, hoàn kho khi thất bại) |
| **FR-07** | US-05: Theo dõi tiến độ đơn hàng | `activity-checkout.puml`, `class-diagram.puml` | API: `GET /api/orders/:id`<br>UI: `OrderTracker.tsx` | **E2E-T01:** `tests/e2e/checkout-flow.spec.ts` (luồng end-to-end 5 bước tới trạng thái `PAID`) |
| **FR-08** | US-06: Xem lịch sử đơn hàng đã đặt | `class-diagram.puml` (`User` - `Order`) | API: `GET /api/orders/my-orders` (`/api/orders/me`)<br>UI: `OrderHistoryModal.tsx`, `Navbar.tsx` | **API-T03:** `orders.service.spec.ts` & `orders-payments.integration.spec.ts` (truy vấn đơn hàng theo `userId`) |
| **FR-09** | US-07: Áp dụng mã giảm giá | `class-diagram.puml` (`Promotion`) | Service: `orders.service.ts` (voucher `SGUFREE`)<br>UI: `CartDrawer.tsx`, `CheckoutModal.tsx` | **UNIT-T01:** `orders.service.spec.ts` (test trừ 15.000đ voucher `SGUFREE`) |
| **FR-10** | US-08: Tích điểm thành viên | `class-diagram.puml` (`LoyaltyTransaction`) | Schema: `apps/api/prisma/schema.prisma` (`LoyaltyTransaction`) | **DOC-T01:** Mô hình dữ liệu đã sẵn sàng; bảo lưu triển khai ở phiên bản mở rộng (Won't MVP) |

---

## 2. Truy vết Yêu cầu Phi chức năng (Non-Functional Requirements Traceability)

| Mã NFR | Thuộc tính chất lượng | Giải pháp kiến trúc / Cơ chế kỹ thuật | File hiện thực / Cấu hình | Minh chứng kiểm thử / Tiêu chí đạt |
| :---: | :--- | :--- | :--- | :--- |
| **NFR-01** | **Hiệu năng ($\le 300\text{ ms}$)** | Database Indexing (`@@index([category])`, `@unique` trên `orderCode`), tối ưu query Prisma, SSR/Static Optimization Next.js. | `apps/api/prisma/schema.prisma`<br>`apps/web/src/app/page.tsx` | **PERF-T01:** Kiểm chứng latency `GET /api/products` $\le 300\text{ ms}$, FCP $\le 1.8\text{ s}$. |
| **NFR-02** | **Bảo mật (Security)** | Hash Bcrypt salt 10, JWT Bearer Token (`ConfigService`), DTO `ValidationPipe`, `.gitignore` chặn lộ `.env`. | `apps/api/src/auth/auth.service.ts`<br>`apps/api/src/orders/dto/create-order.dto.ts`<br>`.env.example` | **SEC-T01:** `orders-payments.integration.spec.ts` xác nhận HTTP 401 khi thiếu JWT và HTTP 400 khi payload sai. |
| **NFR-03** | **Mobile-First PWA** | Web App Manifest, PWA icons (`192x192`, `512x512`), Responsive Mobile-First layout. | `apps/web/public/manifest.json`<br>`apps/web/public/icons/`<br>`apps/web/src/app/layout.tsx` | **LGT-T01:** Đạt chuẩn PWA installable, Accessibility $\ge 90/100$. |
| **NFR-04** | **Sẵn sàng (Reliability)** | Health check endpoint `GET /health` kiểm tra kết nối PostgreSQL (`SELECT 1`). | `apps/api/src/health/health.controller.ts` | **SMK-T01:** `orders-payments.integration.spec.ts` & `cd.yml` smoke test xác nhận HTTP 200 `{ status: "ok" }`. |
| **NFR-05** | **Khả năng triển khai** | Multi-stage Dockerfile, Docker Compose 1 lệnh, Prisma Migration, GitHub Actions CI/CD & Rollback. | `docker-compose.yml`<br>`apps/api/prisma/migrations/`<br>`.github/workflows/ci.yml`, `cd.yml` | **BLD-T01:** Build NestJS, Next.js và Docker image thành công trên CI/CD. |
| **NFR-06** | **Tính bất biến (Idempotency)** | Header `Idempotency-Key` (UUIDv4) kiểm tra trực tiếp trong bảng `Payment` PostgreSQL, chống trừ tiền trùng lặp. | `apps/api/src/payments/payments.service.ts` | **INT-T03:** `payments.service.spec.ts`, `orders-payments.integration.spec.ts` & `checkout-flow.spec.ts` kiểm chứng replay không trừ tiền 2 lần. |
