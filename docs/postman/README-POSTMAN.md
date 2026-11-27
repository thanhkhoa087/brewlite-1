# Hướng Dẫn Kiểm Thử Back-end Với Postman (Demo Nghiệm Thu)

Thư mục này chứa bộ Collection và Environment Postman đã cấu hình sẵn **URL Production thật**, Test Script (`pm.test`) và JSON Payload cho toàn bộ 3 vai trò (**Khách hàng**, **Barista**, **Quản lý**).

- **Backend Production (Render):** `https://api-brewlite.onrender.com` (`base_url = https://api-brewlite.onrender.com/api`)
- **Frontend Production (Vercel):** `https://brewlite-web-fawn.vercel.app`

## 1. Cách Import & Chạy Ngay trong Postman
1. Mở ứng dụng **Postman** (Desktop hoặc Web).
2. Bấm **Import** và chọn 2 tệp trong `docs/postman/`:
   - `BrewLite-Assignment2.postman_collection.json`
   - `BrewLite-Production.postman_environment.json` *(hoặc `BrewLite-Local.postman_environment.json` khi test máy local)*
3. Ở góc trên bên phải Postman, chọn Environment **`BrewLite - Production (Render + Vercel)`** *(kể cả quên chọn Environment, Collection đã có sẵn biến mặc định trỏ tới Render nên vẫn chạy được ngay)*.
4. Bấm chạy thử request **`1. Public -> GET Health Check`** trước (nếu Render Free đang ngủ, chờ ~30s đến khi trả `200 OK`).
5. Bấm chuột phải vào Collection **`BrewLite Assignment 2 - Full API Test (Customer, Barista & Manager)`** → chọn **Run collection** → bấm **Run** để chạy tự động toàn bộ **40 request kiểm thử**.

## 2. Danh mục Kiểm thử (3 Vai trò: Khách hàng, Barista & Quản lý)

| Nhóm | Phạm vi kiểm thử | Kết quả mong đợi (Assert) |
| :--- | :--- | :--- |
| **1. Public (Menu & BOM)** | Health Check, Danh sách Menu, Lọc theo danh mục, Chi tiết `prod-001`, Kho nguyên liệu thô | HTTP `200 OK`, DB `up`, số ly bán được tự tính theo định lượng BOM |
| **2. Auth JWT (3 Roles)** | Đăng ký User A/B (`CUSTOMER`), Login sai mật khẩu (`401`), Login **Barista** (`barista@brewlite.vn`), Login **Quản lý** (`manager@brewlite.vn`) | Cấp đúng JWT & đúng `role` (`CUSTOMER`, `BARISTA`, `MANAGER`), tự lưu token |
| **3. Khách hàng (Bảo mật & Hủy đơn)** | Chặn thiếu JWT (`401`), Chống sửa giá (`unitPrice=1000` → server tính `70,000đ`), User B hủy trộm đơn User A (`403`), Hủy `PENDING → CANCELLED` hoàn kho, Hủy lại lần 2 (`400`), Đặt `999` ly vượt tồn kho (`409`) | Chặn đúng mọi tình huống gian lận, sai quyền và bán vượt kho |
| **4. Khách hàng (Checkout & Thanh toán)** | Đặt đơn kèm voucher `SGUFREE` (-15,000đ), Thanh toán lần 1 (`PAID`), Replay cùng `Idempotency-Key` (`isIdempotentReplay: true`), Khách cố hủy đơn đã `PAID` (`400`), Thanh toán `INSUFFICIENT_FUNDS` (`400` & tự chuyển `CANCELLED`), Xem chi tiết & lịch sử đơn | Không trừ tiền 2 lần, đơn thanh toán lỗi tự hủy & hoàn nguyên liệu |
| **5. Phân quyền RBAC** | Khách hàng cố gọi `GET /orders` (xem toàn quán) hoặc `PATCH /orders/:id/status` | Bị chặn **HTTP `403 Forbidden`** |
| **6. Barista (KDS)** | Xem toàn bộ đơn, lọc `status=PAID`, nhảy cóc `PAID → COMPLETED` (`400`), chuyển đúng quy trình `PAID → PREPARING → COMPLETED`, cố hủy đơn đã `COMPLETED` (`400`) | Đúng State Machine, không cho nhảy cóc hay hủy đơn đã hoàn thành |
| **7. Quản lý (Manager)** | Xem toàn bộ đơn quán, kiểm tra tồn kho BOM (`>= 0`), chuyển trạng thái `PREPARING` và hủy đơn đang `PREPARING → CANCELLED` kèm hoàn kho | Quản lý có toàn quyền giám sát và xử lý hủy đơn sự cố hoàn nguyên liệu |

## 3. Demo Concurrency (2 User tranh mua cùng lúc những ly cuối)
```cmd
node tests/e2e/concurrency-demo.js https://api-brewlite.onrender.com/api
```
Đúng **1 request thành công (`201 Created`)**, **1 request bị chặn (`409 Conflict`)**, tồn kho cuối `= 0` (không bán âm kho).
