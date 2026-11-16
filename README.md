# BrewLite – Lite Order & Restaurant System

> **Môn học:** Công nghệ Phần mềm | **Học kỳ:** I – Năm học 2026–2027  
> **Khoa Công nghệ Thông tin – Trường Đại học Sài Gòn (SGU)**  
> **Ngăn xếp công nghệ:** Next.js (Mobile-first PWA), NestJS (Modular Monolith), PostgreSQL, Docker, GitHub Actions CI/CD.

---

## 1. Tổng quan Dự án (Project Overview)
**BrewLite** là hệ thống tinh gọn dành cho các chuỗi quán đồ uống (cà phê & trà sữa) giúp khách hàng dễ dàng xem menu, tùy biến thức uống, đặt hàng và thanh toán trực tuyến mô phỏng ngay trên trình duyệt di động hoặc cài đặt PWA mà không cần tải ứng dụng từ Store.

### Luồng nghiệp vụ cốt lõi:
$$\text{Xem menu} \longrightarrow \text{Chọn tùy chọn (Size/Topping)} \longrightarrow \text{Giỏ hàng} \longrightarrow \text{Đặt đơn} \longrightarrow \text{Thanh toán (Idempotency)} \longrightarrow \text{Theo dõi đơn}$$

---

## 2. Cấu trúc Thư mục Monorepo (Repository Structure)

```text
brewlite/
├── apps/
│   ├── web/                     # Frontend Next.js mobile-first PWA
│   └── api/                     # Backend NestJS RESTful API
├── docs/
│   ├── requirements/            # Task 1: Bối cảnh, SRS, Use-case checkout
│   ├── diagrams/                # Task 2 & 3: Activity, Sequence, Class, Deployment PUML & SVG
│   ├── architecture/            # Task 3: Tài liệu kiến trúc C4 & các bản ghi ADR
│   │   └── adr/
│   ├── traceability-matrix.md   # Phần 8: Ma trận truy vết yêu cầu (FR/NFR -> Code -> Test)
│   ├── deployment.md            # Hướng dẫn chi tiết triển khai Production
│   └── sprint-retro.md          # Đánh giá Sprint 1 & Sprint 2 Review / Retrospective
├── tests/                       # Task 5: Kịch bản kiểm thử tích hợp và E2E
│   └── e2e/
├── .github/
│   └── workflows/
│       ├── ci.yml               # Task 4.4: Quality Gate CI Pipeline (Lint -> Test -> Build)
│       └── cd.yml               # Task 5.3: Production CD Pipeline & Rollback
├── docker-compose.yml           # Khởi chạy toàn bộ hệ thống Web, API, Postgres tại Local
├── .env.example                 # Mẫu cấu hình biến môi trường
└── README.md                    # Tài liệu hướng dẫn toàn diện
```

---

## 3. Quy ước Phát triển (Development Workflow)

### 3.1. Chiến lược Phân nhánh (Branching Strategy)
- `main`: Nhánh production ổn định, luôn sẵn sàng phát hành. Chỉ nhận merge từ `develop` qua Pull Request được phê duyệt.
- `develop`: Nhánh tích hợp chính cho toàn bộ các tính năng trong Sprint.
- `feature/<tên-tính-năng>`: Nhánh làm việc của từng thành viên (ví dụ: `feature/order-idempotency`, `feature/cart-drawer`).

### 3.2. Quy ước Commit (Conventional Commits)
- `feat:` Thêm tính năng mới (ví dụ: `feat(api): implement mock payment with idempotency key`).
- `fix:` Sửa lỗi (ví dụ: `fix(web): resolve mobile hydration mismatch`).
- `docs:` Thay đổi tài liệu hoặc sơ đồ UML (ví dụ: `docs(diagrams): add sequence checkout diagram`).
- `test:` Bổ sung hoặc sửa đổi kịch bản kiểm thử (ví dụ: `test(api): add integration test for order creation`).
- `ci:` Thay đổi cấu hình pipeline GitHub Actions.

### 3.3. Định nghĩa Hoàn thành (Definition of Done - DoD)
Một User Story hoặc Task được xem là hoàn thành (Done) khi và chỉ khi:
1. Mã nguồn tuân thủ coding standard, không có lỗi TypeScript compilation.
2. 100% kịch bản Unit Test và Integration Test liên quan đều PASS.
3. Pipeline CI trên GitHub Actions thực thi xanh (Green Checkmark).
4. Đã cập nhật tài liệu ma trận truy vết (`traceability-matrix.md`) và đặc tả tương ứng.
5. Code được review và phê duyệt (Approved) bởi ít nhất 1 thành viên trước khi merge.

---

## 4. Hướng dẫn Cài đặt & Khởi chạy (Getting Started)

### Cách 1: Khởi chạy nhanh bằng Docker Compose (Khuyến nghị)
Yêu cầu: Đã cài đặt Docker và Docker Compose trên máy.
```bash
# 1. Sao chép biến môi trường
cp .env.example .env

# 2. Khởi động toàn bộ Web, API và PostgreSQL chỉ với 1 lệnh
docker compose up --build -d

# 3. Kiểm tra trạng thái các container
docker compose ps

# 4. Xem logs thời gian thực
docker compose logs -f
```
- Frontend Web PWA: `http://localhost:3000`
- Backend API REST: `http://localhost:5000/api`
- Health Check Endpoint: `http://localhost:5000/health`

### Cách 2: Chạy trực tiếp trên máy phát triển (Local Node.js)
Yêu cầu: Node.js v20+, PostgreSQL đang chạy tại cổng 5432.
```bash
# Cài đặt dependencies
cd apps/api && npm install
cd ../web && npm install

# Thiết lập database & seed dữ liệu mẫu đồ uống
cd ../api
npx prisma migrate dev --name init
npm run seed

# Chạy Backend (cổng 5000)
npm run start:dev

# Mở terminal khác và chạy Frontend (cổng 3000)
cd ../web
npm run dev
```

---

## 5. Kiểm thử & Quality Gate (Testing)

```bash
# 1. Chạy linter kiểm tra chuẩn mã nguồn
cd apps/api && npm run lint
cd ../web && npm run lint

# 2. Chạy Unit Test backend
cd apps/api && npm test

# 3. Chạy Integration Test cho đơn hàng và thanh toán
cd apps/api && npm run test:integration

# 4. Chạy End-to-End (E2E) Test luồng đặt món
cd ../../tests/e2e && npm test
```

---

## 6. Hướng dẫn Triển khai & Rollback (Production & Rollback)
- **Triển khai Production:** Được tự động hóa hoàn toàn thông qua file `.github/workflows/cd.yml`. Mỗi khi tag phiên bản (ví dụ: `git tag v1.0.0 && git push origin v1.0.0`), pipeline CD sẽ build Docker Image, kiểm tra Smoke test và cập nhật cloud service.
- **Quy trình Rollback:** Nếu Health Check sau triển khai thất bại, pipeline CD tự động phát lệnh dừng và hoàn nguyên container image về tag ổn định liền kề (`latest-stable`) mà không làm gián đoạn dịch vụ.
