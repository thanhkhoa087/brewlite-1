# Hướng Dẫn Kiểm Thử Back-end Với Postman (Demo Nghiệm Thu)

Thư mục này chứa bộ Collection và Environment Postman đã chuẩn bị sẵn Test Script (`pm.test`) và JSON Payload cho buổi chấm bài Assignment 2.

## 1. Cách Import vào Postman
1. Mở ứng dụng **Postman** (Desktop hoặc VS Code Extension).
2. Bấm **Import** và chọn 3 tệp trong `docs/postman/`:
   - `BrewLite-Assignment2.postman_collection.json`
   - `BrewLite-Local.postman_environment.json` (`base_url = http://localhost:5000/api`)
   - `BrewLite-Production.postman_environment.json` (`base_url = https://api-brewlite.onrender.com/api`)
3. Chọn Environment ở góc trên bên phải (**BrewLite - Local** hoặc **BrewLite - Production**).

## 2. Kịch bản Demo 5 tình huống trọng tâm khi Giảng viên kiểm tra

| STT | Tình huống kiểm thử | Request trong Collection | Kết quả mong đợi (Assert) |
| :-: | :--- | :--- | :--- |
| **1** | **Tồn kho theo định lượng nguyên liệu thô (BOM)** | `GET /api/products` và `GET /api/products/ingredients` | Kho lưu nguyên liệu thô (`500g` cà phê, `2000ml` sữa...); API tự động tính số ly tối đa có thể bán theo công thức (`10g` cà phê + `40ml` sữa = `1` ly → `50` ly). |
| **2** | **Chống sửa giá từ Client (Price Tampering)** | `POST /api/orders` (cố tình gửi `"unitPrice": 1000`) | HTTP `201 Created`, nhưng Backend **bỏ qua hoàn toàn giá client gửi lên** và tự tính lại từ Database (`29.000 + Size M 6.000 = 35.000 × 2 = 70.000đ`). |
| **3** | **Hủy đơn hàng đặt nhầm (`PENDING → CANCELLED`)** | `PATCH /api/orders/{{order_to_cancel}}/cancel` | HTTP `200 OK`, đơn chuyển sang `CANCELLED` và **hoàn lại đúng định lượng nguyên vật liệu** về bảng `ingredients` (chưa làm hoàn tiền tự động trong phạm vi bài tập). |
| **4** | **Kiểm tra vượt tồn kho (Overselling)** | `POST /api/orders` với `"quantity": 999` | HTTP `409 Conflict` báo nguyên liệu không đủ, transaction rollback hoàn toàn, tồn kho không bị âm. |
| **5** | **Tranh chấp đồng thời (Concurrency – 2 User mua cùng lúc 2 ly cuối)** | Chạy `node tests/e2e/concurrency-demo.js` (hoặc Postman Collection Runner với 2 Virtual Users) | Đúng **1 request thành công (`201 Created`)**, **1 request bị chặn (`409 Conflict`)**, tồn kho cuối `= 0` (tuyệt đối không bán âm kho). |
| **6** | **Thanh toán mô phỏng & Idempotency Replay** | Gửi `POST /api/payments/process` 2 lần cùng `Idempotency-Key` | Lần 1: `PAID` + sinh `transactionCode`. Lần 2: `isIdempotentReplay: true`, trả đúng `transactionCode` cũ, không trừ tiền 2 lần. |
