# Báo Cáo Sprint Review & Sprint Retrospective (Hệ Thống BrewLite)

## 1. Sprint 1 Review & Retrospective
- **Thời gian Sprint 1:** Tuần 1 - Tuần 2
- **Sprint Goal:** Tạo nền tảng kỹ thuật, tài liệu có kiểm soát phiên bản, thiết lập CI cơ bản và hoàn thành MVP đầu tiên cho luồng xem menu đồ uống.

### 1.1. Kết quả đạt được (Sprint 1 Review)
- Thiết lập hoàn tất repository Monorepo với cấu trúc `apps/web`, `apps/api`, `docs`.
- Triển khai toàn bộ tài liệu đặc tả: Context & Scope, SRS rút gọn, Use-case checkout, Sơ đồ UML (Activity, Sequence, Class, Deployment) và các ADRs.
- Hoàn thành MVP Sprint 1:
  - Backend API NestJS: `GET /products`, `GET /products/:id`, seeding dữ liệu mẫu đồ uống.
  - Frontend Next.js mobile-first: Màn hình menu thức uống, lọc theo danh mục, trạng thái loading skeleton, empty state và error handler.
- Pipeline CI đầu tiên trên GitHub Actions: tự động chạy `Install -> Lint -> Unit Test -> Build` khi có Pull Request vào `main`/`develop`.

### 1.2. Đánh giá cải tiến (Sprint 1 Retrospective)
- **What went well:** Đạt đúng mục tiêu Sprint, cấu trúc mã nguồn rõ ràng, tài liệu hóa kỹ thuật chi tiết giúp thành viên phối hợp trơn tru.
- **What could be improved:** Thời gian chạy CI bước đầu hơi lâu do chưa bật bộ nhớ đệm cache npm packages.
- **Action Items:** Bổ sung cache `actions/cache@v4` cho bước `npm install` trong workflow CI.

---

## 2. Sprint 2 Review & Retrospective
- **Thời gian Sprint 2:** Tuần 3 - Tuần 4
- **Sprint Goal:** Hoàn thành luồng nghiệp vụ end-to-end (Chi tiết món, Giỏ hàng, Đặt đơn, Thanh toán mô phỏng với Idempotency, Theo dõi đơn), tự động hóa đóng gói Docker và triển khai CD lên môi trường Production.

### 2.1. Kết quả đạt được (Sprint 2 Review)
- Hoàn thành trọn vẹn luồng nghiệp vụ end-to-end:
  - Chọn size (S/M/L) và topping, tính tổng tiền tự động trong giỏ hàng.
  - Đăng ký/Đăng nhập và cấp JWT Token an toàn.
  - Tạo đơn hàng có kiểm tra tồn kho và transaction PostgreSQL.
  - Xử lý thanh toán mô phỏng với cơ chế `Idempotency-Key` ngăn chặn trừ tiền 2 lần.
  - Trang theo dõi trạng thái đơn hàng (`PENDING` -> `PAID` -> `PREPARING` -> `COMPLETED`) và trang lịch sử đơn.
- Tích hợp & Kiểm thử:
  - Bộ Unit test và Integration test cho các API cốt lõi.
  - Kịch bản End-to-End (E2E) mô phỏng toàn bộ hành trình người dùng.
  - Endpoint `GET /health` kiểm tra trạng thái hoạt động của API và database.
- Đóng gói & Triển khai:
  - `docker-compose.yml` cho phép khởi chạy trọn vẹn toàn bộ hệ sinh thái (Web + API + DB) chỉ bằng 1 lệnh duy nhất.
  - Pipeline CD tự động build Docker Image, tag commit SHA, kiểm tra smoke test và hỗ trợ rollback khi lỗi.

### 2.2. Đánh giá cải tiến (Sprint 2 Retrospective)
- **What went well:** Sản phẩm chạy thực tế ổn định, giao diện PWA mượt mà trên điện thoại di động, pipeline CI/CD vận hành tự động không cần can thiệp thủ công.
- **What could be improved:** Cần bổ sung thêm thông báo đẩy (Web Push Notifications) để khách hàng nhận được thông báo ngay khi nhân viên pha chế hoàn tất đồ uống mà không cần F5 trình duyệt.
- **Action Items:** Đưa tính năng Web Push Notification và KDS (Kitchen Display System) vào Backlog của phiên bản v1.1.
