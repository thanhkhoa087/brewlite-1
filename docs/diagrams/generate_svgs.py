import os
import shutil

DIAGRAMS_DIR = r"d:\Assignment 2\brewlite\docs\diagrams"
REPORT_DIR = r"d:\Assignment 2\report"
TEMPLATE_DIR = r"d:\Assignment 2\template\Assigment_template_SGU"

def save_to_all(filename, content):
    for d in [DIAGRAMS_DIR, REPORT_DIR, TEMPLATE_DIR]:
        if os.path.exists(d):
            with open(os.path.join(d, filename), "w", encoding="utf-8") as f:
                f.write(content)

def generate_sequence_svg():
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 950 780" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI', Arial, sans-serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#2c3e50" />
    </marker>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#27ae60" />
    </marker>
    <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#c0392b" />
    </marker>
  </defs>

  <!-- Title -->
  <text x="475" y="32" font-size="18" font-weight="bold" text-anchor="middle" fill="#1e293b">SƠ ĐỒ TRÌNH TỰ (SEQUENCE DIAGRAM) - USE-CASE THANH TOÁN BREWLITE</text>

  <!-- Lifeline Boxes -->
  <!-- Customer -->
  <rect x="30" y="55" width="120" height="42" rx="8" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>
  <text x="90" y="81" font-size="13" font-weight="bold" text-anchor="middle" fill="#1e293b">Customer</text>
  <line x1="90" y1="97" x2="90" y2="740" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4"/>

  <!-- Next.js UI -->
  <rect x="220" y="55" width="130" height="42" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
  <text x="285" y="81" font-size="13" font-weight="bold" text-anchor="middle" fill="#1e40af">Next.js UI (PWA)</text>
  <line x1="285" y1="97" x2="285" y2="740" stroke="#93c5fd" stroke-width="1.5" stroke-dasharray="4"/>

  <!-- NestJS API -->
  <rect x="420" y="55" width="130" height="42" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
  <text x="485" y="81" font-size="13" font-weight="bold" text-anchor="middle" fill="#166534">NestJS API Core</text>
  <line x1="485" y1="97" x2="485" y2="740" stroke="#86efac" stroke-width="1.5" stroke-dasharray="4"/>

  <!-- PostgreSQL Database -->
  <rect x="620" y="55" width="130" height="42" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
  <text x="685" y="81" font-size="13" font-weight="bold" text-anchor="middle" fill="#92400e">PostgreSQL DB</text>
  <line x1="685" y1="97" x2="685" y2="740" stroke="#fcd34d" stroke-width="1.5" stroke-dasharray="4"/>

  <!-- Payment Service -->
  <rect x="800" y="55" width="130" height="42" rx="8" fill="#fce7f3" stroke="#db2777" stroke-width="1.5"/>
  <text x="865" y="81" font-size="13" font-weight="bold" text-anchor="middle" fill="#9d174d">Mock Payment GW</text>
  <line x1="865" y1="97" x2="865" y2="740" stroke="#f472b6" stroke-width="1.5" stroke-dasharray="4"/>

  <!-- Step 1: Add to cart & initiate checkout -->
  <line x1="90" y1="125" x2="285" y2="125" stroke="#2c3e50" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="187" y="118" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e293b">1. Bấm "Tiến hành đặt hàng"</text>

  <!-- Step 2: Next.js creates Order -->
  <rect x="275" y="138" width="20" height="60" fill="#bfdbfe" stroke="#3b82f6"/>
  <line x1="285" y1="150" x2="485" y2="150" stroke="#2c3e50" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="385" y="144" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e293b">2. POST /api/orders (Bearer JWT, items, note)</text>

  <!-- Step 3: Auth & Transaction -->
  <rect x="475" y="145" width="20" height="150" fill="#bbf7d0" stroke="#22c55e"/>
  <line x1="485" y1="175" x2="685" y2="175" stroke="#2c3e50" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="585" y="169" font-size="10" text-anchor="middle" fill="#334155">3. BEGIN TX: SELECT stock FOR UPDATE</text>

  <line x1="685" y1="205" x2="485" y2="205" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3" marker-end="url(#arrow)"/>
  <text x="585" y="199" font-size="10" text-anchor="middle" fill="#475569">4. Stock available (Đủ hàng)</text>

  <line x1="485" y1="230" x2="685" y2="230" stroke="#2c3e50" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="585" y="224" font-size="10" font-weight="bold" text-anchor="middle" fill="#1e293b">5. Trừ kho &amp; INSERT order (PENDING) &amp; COMMIT</text>

  <line x1="485" y1="255" x2="285" y2="255" stroke="#27ae60" stroke-width="1.3" stroke-dasharray="3" marker-end="url(#arrow-green)"/>
  <text x="385" y="249" font-size="10" font-weight="bold" text-anchor="middle" fill="#15803d">201 Created { orderId: "ord_101", amount: 65000, status: "PENDING" }</text>

  <!-- Step 4: Process Payment with Idempotency -->
  <line x1="90" y1="290" x2="285" y2="290" stroke="#2c3e50" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="187" y="283" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e293b">6. Chọn MoMo &amp; sinh Idempotency-Key</text>

  <line x1="285" y1="315" x2="485" y2="315" stroke="#2563eb" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="385" y="308" font-size="11" font-weight="bold" text-anchor="middle" fill="#1d4ed8">7. POST /api/payments/process (Header: Idempotency-Key)</text>

  <!-- Idempotency Group Box -->
  <rect x="360" y="335" width="560" height="260" rx="6" fill="#f8fafc" stroke="#64748b" stroke-width="1" stroke-dasharray="4"/>
  <text x="375" y="352" font-size="11" font-weight="bold" fill="#0f172a">ALT [Kiểm tra Idempotency trong bảng Payment (PostgreSQL)]</text>

  <!-- Branch 1: Idempotency Replay -->
  <text x="380" y="375" font-size="10" font-weight="bold" fill="#0284c7">[Key đã tồn tại: Client Retry do mạng chậm]</text>
  <line x1="485" y1="390" x2="285" y2="390" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3" marker-end="url(#arrow)"/>
  <text x="385" y="384" font-size="10" text-anchor="middle" fill="#0369a1">200 OK (Trả về kết quả cũ - Tránh trừ tiền lần 2)</text>

  <!-- Branch 2: New Payment -->
  <line x1="360" y1="410" x2="920" y2="410" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2"/>
  <text x="380" y="428" font-size="10" font-weight="bold" fill="#15803d">[Giao dịch mới: Xử lý qua Mock Gateway]</text>

  <line x1="485" y1="445" x2="865" y2="445" stroke="#db2777" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="675" y="439" font-size="10" text-anchor="middle" fill="#be185d">8. Mock Charge Request { orderId, amount, method: 'MOMO' }</text>

  <line x1="865" y1="475" x2="485" y2="475" stroke="#db2777" stroke-width="1.3" stroke-dasharray="3" marker-end="url(#arrow)"/>
  <text x="675" y="469" font-size="10" text-anchor="middle" fill="#be185d">9. Charge Response { success: true, txId: 'TX-9988' }</text>

  <line x1="485" y1="510" x2="685" y2="510" stroke="#16a34a" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="585" y="504" font-size="10" text-anchor="middle" fill="#15803d">10. UPDATE order: PAID, INSERT Payment (COMPLETED, key)</text>

  <line x1="485" y1="550" x2="285" y2="550" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="3" marker-end="url(#arrow-green)"/>
  <text x="385" y="544" font-size="10" font-weight="bold" text-anchor="middle" fill="#15803d">11. 200 OK { status: 'PAID', txCode: 'TX-9988' }</text>

  <!-- Step 5: Order Tracking -->
  <line x1="285" y1="630" x2="90" y2="630" stroke="#27ae60" stroke-width="1.5" marker-end="url(#arrow-green)"/>
  <text x="187" y="623" font-size="11" font-weight="bold" text-anchor="middle" fill="#166534">12. Hiển thị "Đặt hàng thành công &amp; Theo dõi đơn"</text>

  <line x1="90" y1="670" x2="285" y2="670" stroke="#64748b" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="187" y="663" font-size="10" text-anchor="middle" fill="#475569">13. State Machine: PENDING -> PAID -> PREPARING -> COMPLETED</text>

  <rect x="75" y="700" width="800" height="25" rx="5" fill="#f1f5f9" stroke="#cbd5e1"/>
  <text x="475" y="717" font-size="11" text-anchor="middle" fill="#475569">✓ Đạt chuẩn: Trừ kho trong Transaction, Idempotency lưu trong PostgreSQL Payment, State chuẩn 4 bước</text>
</svg>'''
    save_to_all("sequence-checkout.svg", svg)
    print("Generated sequence-checkout.svg")

def generate_activity_svg():
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 840" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI', Arial, sans-serif;">
  <defs>
    <marker id="act-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
    </marker>
  </defs>

  <!-- Title -->
  <text x="450" y="30" font-size="17" font-weight="bold" text-anchor="middle" fill="#0f172a">SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM) - QUY TRÌNH ĐẶT MÓN &amp; THANH TOÁN</text>

  <!-- Swimlanes -->
  <!-- Khách hàng -->
  <rect x="20" y="55" width="270" height="760" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <rect x="20" y="55" width="270" height="35" fill="#e2e8f0" stroke="#cbd5e1"/>
  <text x="155" y="78" font-size="13" font-weight="bold" text-anchor="middle" fill="#1e293b">Khách hàng (Customer)</text>

  <!-- Next.js Web UI -->
  <rect x="290" y="55" width="310" height="760" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.5"/>
  <rect x="290" y="55" width="310" height="35" fill="#e0f2fe" stroke="#bae6fd"/>
  <text x="445" y="78" font-size="13" font-weight="bold" text-anchor="middle" fill="#0369a1">Giao diện PWA (Next.js UI)</text>

  <!-- Backend & Database -->
  <rect x="600" y="55" width="280" height="760" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
  <rect x="600" y="55" width="280" height="35" fill="#dcfce7" stroke="#bbf7d0"/>
  <text x="740" y="78" font-size="13" font-weight="bold" text-anchor="middle" fill="#15803d">NestJS Backend &amp; PostgreSQL</text>

  <!-- Start Node -->
  <circle cx="155" cy="115" r="10" fill="#0f172a"/>
  
  <!-- Step 1: Open app & Browse Menu -->
  <line x1="155" y1="125" x2="155" y2="150" stroke="#334155" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <rect x="75" y="150" width="160" height="36" rx="8" fill="#ffffff" stroke="#475569"/>
  <text x="155" y="172" font-size="11" text-anchor="middle">1. Xem Menu thực đơn</text>

  <!-- Step 2: Customize món -->
  <line x1="155" y1="186" x2="155" y2="210" stroke="#334155" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <rect x="65" y="210" width="180" height="36" rx="8" fill="#ffffff" stroke="#475569"/>
  <text x="155" y="232" font-size="11" text-anchor="middle">2. Tùy biến Size, đường, đá, topping</text>

  <!-- Step 3: Add to cart -->
  <line x1="155" y1="246" x2="155" y2="270" stroke="#334155" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <rect x="75" y="270" width="160" height="36" rx="8" fill="#ffffff" stroke="#475569"/>
  <text x="155" y="292" font-size="11" text-anchor="middle">3. Thêm giỏ &amp; bấm Đặt hàng</text>

  <!-- Cross to UI: Check auth -->
  <line x1="235" y1="288" x2="365" y2="288" stroke="#334155" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <!-- Decision: Auth? -->
  <polygon points="445,270 495,290 445,310 395,290" fill="#fef08a" stroke="#ca8a04"/>
  <text x="445" y="294" font-size="9" font-weight="bold" text-anchor="middle">Đã đăng nhập?</text>

  <!-- No Auth branch -->
  <line x1="395" y1="290" x2="235" y2="340" stroke="#dc2626" stroke-width="1.2" marker-end="url(#act-arrow)"/>
  <rect x="75" y="330" width="160" height="32" rx="6" fill="#fef2f2" stroke="#ef4444"/>
  <text x="155" y="350" font-size="10" text-anchor="middle" fill="#991b1b">POST /api/auth/login</text>
  <line x1="155" y1="362" x2="365" y2="390" stroke="#334155" stroke-width="1.2" marker-end="url(#act-arrow)"/>

  <!-- Auth Yes branch: Gửi POST /api/orders -->
  <line x1="445" y1="310" x2="445" y2="375" stroke="#16a34a" stroke-width="1.2" marker-end="url(#act-arrow)"/>
  <rect x="365" y="375" width="160" height="34" rx="8" fill="#ffffff" stroke="#0284c7"/>
  <text x="445" y="396" font-size="10" text-anchor="middle">4. Gửi POST /api/orders</text>

  <!-- Cross to Backend: Check & Deduct Stock in TX -->
  <line x1="525" y1="392" x2="650" y2="392" stroke="#334155" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <rect x="640" y="375" width="200" height="36" rx="8" fill="#ffffff" stroke="#16a34a"/>
  <text x="740" y="397" font-size="10" text-anchor="middle">5. Check &amp; Trừ tồn kho (FOR UPDATE)</text>

  <!-- Decision: In Stock? -->
  <line x1="740" y1="411" x2="740" y2="440" stroke="#334155" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <polygon points="740,440 785,460 740,480 695,460" fill="#fef08a" stroke="#ca8a04"/>
  <text x="740" y="464" font-size="9" font-weight="bold" text-anchor="middle">Còn hàng?</text>

  <!-- Out of Stock -->
  <line x1="695" y1="460" x2="525" y2="460" stroke="#dc2626" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <rect x="365" y="445" width="160" height="30" rx="6" fill="#fef2f2" stroke="#ef4444"/>
  <text x="445" y="464" font-size="10" fill="#b91c1c" text-anchor="middle">Báo lỗi hết hàng &amp; Rollback TX</text>

  <!-- In Stock: Create Pending Order & Commit TX -->
  <line x1="740" y1="480" x2="740" y2="515" stroke="#16a34a" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <rect x="650" y="515" width="180" height="34" rx="8" fill="#ffffff" stroke="#16a34a"/>
  <text x="740" y="536" font-size="10" text-anchor="middle">6. Lưu Đơn (PENDING) &amp; Commit</text>

  <!-- Cross to UI: Payment Selection & Generate Key -->
  <line x1="650" y1="532" x2="525" y2="532" stroke="#334155" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <rect x="365" y="515" width="160" height="34" rx="8" fill="#ffffff" stroke="#0284c7"/>
  <text x="445" y="536" font-size="10" text-anchor="middle">Sinh Idempotency-Key (UUIDv4)</text>

  <!-- Customer selects payment -->
  <line x1="365" y1="532" x2="235" y2="532" stroke="#334155" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <rect x="65" y="515" width="170" height="34" rx="8" fill="#ffffff" stroke="#475569"/>
  <text x="150" y="536" font-size="10" text-anchor="middle">Chọn MoMo/Thẻ &amp; Thanh toán</text>

  <!-- Send POST /api/payments/process -->
  <line x1="150" y1="549" x2="150" y2="590" stroke="#334155" stroke-width="1.2"/>
  <line x1="150" y1="590" x2="640" y2="590" stroke="#334155" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <rect x="640" y="575" width="200" height="36" rx="8" fill="#ffffff" stroke="#db2777"/>
  <text x="740" y="597" font-size="10" text-anchor="middle">7. POST /api/payments/process</text>

  <!-- Decision: Charge Success? -->
  <line x1="740" y1="611" x2="740" y2="635" stroke="#334155" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <polygon points="740,635 785,655 740,675 695,655" fill="#fef08a" stroke="#ca8a04"/>
  <text x="740" y="659" font-size="9" font-weight="bold" text-anchor="middle">Trừ tiền OK?</text>

  <!-- Payment Failed -->
  <line x1="695" y1="655" x2="525" y2="655" stroke="#dc2626" stroke-width="1.2" marker-end="url(#act-arrow)"/>
  <rect x="365" y="640" width="160" height="30" rx="6" fill="#fef2f2" stroke="#ef4444"/>
  <text x="445" y="659" font-size="10" fill="#b91c1c" text-anchor="middle">Báo lỗi &amp; hoàn lại kho tạm</text>

  <!-- Payment Success -->
  <line x1="740" y1="675" x2="740" y2="705" stroke="#16a34a" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <rect x="640" y="705" width="200" height="34" rx="8" fill="#ffffff" stroke="#16a34a"/>
  <text x="740" y="726" font-size="10" text-anchor="middle">Order: PAID &amp; Lưu DB Payment</text>

  <!-- Back to UI: Clear cart & Show tracking -->
  <line x1="640" y1="722" x2="525" y2="722" stroke="#16a34a" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <rect x="365" y="705" width="160" height="34" rx="8" fill="#ffffff" stroke="#0284c7"/>
  <text x="445" y="726" font-size="10" text-anchor="middle">Xóa giỏ &amp; Theo dõi GET /api/orders</text>

  <!-- Back to Customer: Nhận đồ uống -->
  <line x1="365" y1="722" x2="235" y2="722" stroke="#16a34a" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <rect x="75" y="705" width="160" height="34" rx="8" fill="#ffffff" stroke="#475569"/>
  <text x="155" y="726" font-size="10" text-anchor="middle">Nhận đồ uống tại quầy</text>

  <!-- End Node -->
  <line x1="155" y1="739" x2="155" y2="770" stroke="#334155" stroke-width="1.5" marker-end="url(#act-arrow)"/>
  <circle cx="155" cy="780" r="11" fill="none" stroke="#0f172a" stroke-width="2"/>
  <circle cx="155" cy="780" r="6" fill="#0f172a"/>
</svg>'''
    save_to_all("activity-checkout.svg", svg)
    print("Generated activity-checkout.svg")

def generate_class_svg():
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 660" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI', Arial, sans-serif;">
  <!-- Title -->
  <text x="480" y="28" font-size="17" font-weight="bold" text-anchor="middle" fill="#0f172a">SƠ ĐỒ LỚP MIỀN NGHIỆP VỤ (DOMAIN CLASS DIAGRAM) - BREWLITE</text>

  <!-- Class User -->
  <rect x="30" y="50" width="185" height="155" rx="6" fill="#f8fafc" stroke="#475569" stroke-width="1.2"/>
  <rect x="30" y="50" width="185" height="26" fill="#e2e8f0" stroke="#475569" stroke-width="1.2"/>
  <text x="122" y="68" font-size="12" font-weight="bold" text-anchor="middle">User</text>
  <text x="40" y="92" font-size="10" fill="#334155">- id: String</text>
  <text x="40" y="108" font-size="10" fill="#334155">- email: String</text>
  <text x="40" y="124" font-size="10" fill="#334155">- fullName: String</text>
  <text x="40" y="140" font-size="10" fill="#334155">- role: UserRole</text>
  <text x="40" y="156" font-size="10" fill="#334155">- loyaltyPoints: Int</text>
  <line x1="30" y1="168" x2="215" y2="168" stroke="#cbd5e1"/>
  <text x="40" y="186" font-size="10" fill="#1e293b">+ register(), login()</text>

  <!-- Class Order -->
  <rect x="295" y="50" width="200" height="185" rx="6" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.2"/>
  <rect x="295" y="50" width="200" height="26" fill="#bae6fd" stroke="#0284c7" stroke-width="1.2"/>
  <text x="395" y="68" font-size="12" font-weight="bold" text-anchor="middle">Order</text>
  <text x="305" y="92" font-size="10" fill="#0369a1">- id: String</text>
  <text x="305" y="108" font-size="10" fill="#0369a1">- orderCode: String</text>
  <text x="305" y="124" font-size="10" fill="#0369a1">- promotionId: String</text>
  <text x="305" y="140" font-size="10" fill="#0369a1">- subTotal: Decimal</text>
  <text x="305" y="156" font-size="10" fill="#0369a1">- totalAmount: Decimal</text>
  <text x="305" y="172" font-size="10" fill="#0369a1">- status: OrderStatus</text>
  <line x1="295" y1="184" x2="495" y2="184" stroke="#bae6fd"/>
  <text x="305" y="200" font-size="10" fill="#0c4a6e">+ calculateTotal(): Decimal</text>
  <text x="305" y="214" font-size="10" fill="#0c4a6e">+ cancel(): Void</text>

  <!-- Class OrderItem -->
  <rect x="575" y="50" width="185" height="175" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.2"/>
  <rect x="575" y="50" width="185" height="26" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.2"/>
  <text x="667" y="68" font-size="12" font-weight="bold" text-anchor="middle">OrderItem</text>
  <text x="585" y="92" font-size="10" fill="#15803d">- id: String</text>
  <text x="585" y="108" font-size="10" fill="#15803d">- size: String (S, M, L)</text>
  <text x="585" y="124" font-size="10" fill="#15803d">- sweetLevel: Int</text>
  <text x="585" y="140" font-size="10" fill="#15803d">- iceLevel: Int</text>
  <text x="585" y="156" font-size="10" fill="#15803d">- quantity: Int</text>
  <text x="585" y="172" font-size="10" fill="#15803d">- itemTotal: Decimal</text>
  <line x1="575" y1="184" x2="760" y2="184" stroke="#bbf7d0"/>
  <text x="585" y="202" font-size="10" fill="#14532d">+ computeItemTotal()</text>

  <!-- Class Product -->
  <rect x="575" y="300" width="185" height="160" rx="6" fill="#fffbeb" stroke="#d97706" stroke-width="1.2"/>
  <rect x="575" y="300" width="185" height="26" fill="#fde68a" stroke="#d97706" stroke-width="1.2"/>
  <text x="667" y="318" font-size="12" font-weight="bold" text-anchor="middle">Product</text>
  <text x="585" y="342" font-size="10" fill="#92400e">- id: String</text>
  <text x="585" y="358" font-size="10" fill="#92400e">- name: String</text>
  <text x="585" y="374" font-size="10" fill="#92400e">- category: String</text>
  <text x="585" y="390" font-size="10" fill="#92400e">- basePrice: Decimal</text>
  <text x="585" y="406" font-size="10" fill="#92400e">- stock: Int</text>
  <line x1="575" y1="418" x2="760" y2="418" stroke="#fde68a"/>
  <text x="585" y="434" font-size="10" fill="#78350f">+ checkAvailability()</text>
  <text x="585" y="448" font-size="10" fill="#78350f">+ deductStock(qty)</text>

  <!-- Class Payment -->
  <rect x="295" y="310" width="200" height="170" rx="6" fill="#fdf2f8" stroke="#db2777" stroke-width="1.2"/>
  <rect x="295" y="310" width="200" height="26" fill="#fbcfe8" stroke="#db2777" stroke-width="1.2"/>
  <text x="395" y="328" font-size="12" font-weight="bold" text-anchor="middle">Payment</text>
  <text x="305" y="352" font-size="10" fill="#9d174d">- id: String</text>
  <text x="305" y="368" font-size="10" fill="#9d174d">- amount: Decimal</text>
  <text x="305" y="384" font-size="10" fill="#9d174d">- method: PaymentMethod</text>
  <text x="305" y="400" font-size="10" fill="#9d174d">- status: PaymentStatus</text>
  <text x="305" y="416" font-size="10" fill="#9d174d">- idempotencyKey: String</text>
  <text x="305" y="432" font-size="10" fill="#9d174d">- transactionCode: String</text>
  <line x1="295" y1="444" x2="495" y2="444" stroke="#fbcfe8"/>
  <text x="305" y="460" font-size="10" fill="#831843">+ processPayment()</text>

  <!-- Class Promotion -->
  <rect x="30" y="275" width="185" height="140" rx="6" fill="#f3e8ff" stroke="#9333ea" stroke-width="1.2"/>
  <rect x="30" y="275" width="185" height="26" fill="#e9d5ff" stroke="#9333ea" stroke-width="1.2"/>
  <text x="122" y="293" font-size="12" font-weight="bold" text-anchor="middle">Promotion</text>
  <text x="40" y="317" font-size="10" fill="#6b21a8">- id: String</text>
  <text x="40" y="333" font-size="10" fill="#6b21a8">- code: String</text>
  <text x="40" y="349" font-size="10" fill="#6b21a8">- discountValue: Decimal</text>
  <text x="40" y="365" font-size="10" fill="#6b21a8">- isActive: Boolean</text>
  <line x1="30" y1="377" x2="215" y2="377" stroke="#e9d5ff"/>
  <text x="40" y="393" font-size="10" fill="#581c87">+ applyDiscount()</text>

  <!-- Class LoyaltyTransaction -->
  <rect x="30" y="465" width="210" height="150" rx="6" fill="#ecfeff" stroke="#0891b2" stroke-width="1.2"/>
  <rect x="30" y="465" width="210" height="26" fill="#cffafe" stroke="#0891b2" stroke-width="1.2"/>
  <text x="135" y="483" font-size="12" font-weight="bold" text-anchor="middle" fill="#155e75">LoyaltyTransaction</text>
  <text x="40" y="507" font-size="10" fill="#164e63">- id: String</text>
  <text x="40" y="523" font-size="10" fill="#164e63">- userId: String</text>
  <text x="40" y="539" font-size="10" fill="#164e63">- orderId: String</text>
  <text x="40" y="555" font-size="10" fill="#164e63">- points: Int</text>
  <text x="40" y="571" font-size="10" fill="#164e63">- transactionType: String</text>
  <line x1="30" y1="583" x2="240" y2="583" stroke="#a5f3fc"/>
  <text x="40" y="599" font-size="10" fill="#155e75">+ calculatePoints(amount)</text>

  <!-- Relationships -->
  <line x1="215" y1="110" x2="295" y2="110" stroke="#334155" stroke-width="1.5"/>
  <text x="225" y="104" font-size="10">1</text>
  <text x="275" y="104" font-size="10">0..*</text>
  <text x="240" y="125" font-size="9" fill="#64748b">places &gt;</text>

  <line x1="495" y1="110" x2="575" y2="110" stroke="#334155" stroke-width="1.5"/>
  <polygon points="495,110 503,105 511,110 503,115" fill="#334155"/>
  <text x="517" y="104" font-size="10">1</text>
  <text x="555" y="104" font-size="10">1..*</text>

  <line x1="667" y1="225" x2="667" y2="300" stroke="#334155" stroke-width="1.5"/>
  <text x="675" y="240" font-size="10">0..*</text>
  <text x="675" y="290" font-size="10">1</text>

  <line x1="395" y1="235" x2="395" y2="310" stroke="#334155" stroke-width="1.5"/>
  <text x="401" y="250" font-size="10">1</text>
  <text x="401" y="300" font-size="10">0..1</text>

  <line x1="295" y1="180" x2="215" y2="330" stroke="#9333ea" stroke-width="1.5"/>
  <text x="280" y="195" font-size="10" fill="#7e22ce">0..*</text>
  <text x="220" y="325" font-size="10" fill="#7e22ce">0..1</text>

  <!-- User to LoyaltyTransaction -->
  <polyline points="30,150 12,150 12,535 30,535" fill="none" stroke="#0891b2" stroke-width="1.5"/>
  <text x="15" y="142" font-size="9" fill="#0e7490">1</text>
  <text x="14" y="528" font-size="9" fill="#0e7490">0..*</text>

  <!-- Order to LoyaltyTransaction -->
  <polyline points="295,215 268,215 268,535 240,535" fill="none" stroke="#0891b2" stroke-width="1.5"/>
  <text x="272" y="210" font-size="9" fill="#0e7490">0..1</text>
  <text x="245" y="528" font-size="9" fill="#0e7490">0..*</text>
</svg>'''
    save_to_all("class-diagram.svg", svg)
    print("Generated class-diagram.svg")

def generate_deployment_svg():
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 720" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI', Arial, sans-serif;">
  <defs>
    <marker id="dep-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#1e293b" />
    </marker>
  </defs>

  <!-- Title -->
  <text x="480" y="28" font-size="17" font-weight="bold" text-anchor="middle" fill="#0f172a">SƠ ĐỒ TRIỂN KHAI (DEPLOYMENT DIAGRAM) - LOCAL, CI/CD &amp; PRODUCTION</text>

  <!-- Client Zone -->
  <rect x="25" y="55" width="230" height="175" rx="10" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
  <text x="40" y="78" font-size="12" font-weight="bold" fill="#334155">&lt;&lt;Device&gt;&gt; Khách hàng</text>
  <rect x="42" y="92" width="196" height="122" rx="8" fill="#ffffff" stroke="#94a3b8"/>
  <text x="140" y="114" font-size="11" font-weight="bold" text-anchor="middle" fill="#0f172a">Smartphone / Laptop</text>
  <rect x="55" y="128" width="170" height="74" rx="6" fill="#e0f2fe" stroke="#38bdf8"/>
  <text x="140" y="150" font-size="10" font-weight="bold" text-anchor="middle" fill="#0369a1">&lt;&lt;Browser / PWA&gt;&gt;</text>
  <text x="140" y="170" font-size="9" text-anchor="middle" fill="#0284c7">Next.js Client Bundle</text>
  <text x="140" y="188" font-size="9" text-anchor="middle" fill="#0284c7">Service Worker &amp; LocalStorage</text>

  <!-- Local Dev Boundary -->
  <rect x="25" y="248" width="230" height="135" rx="10" fill="#fff7ed" stroke="#f97316" stroke-width="1.5" stroke-dasharray="4"/>
  <text x="40" y="270" font-size="11.5" font-weight="bold" fill="#c2410c">&lt;&lt;Local Dev&gt;&gt; Docker Compose</text>
  <rect x="42" y="284" width="196" height="86" rx="6" fill="#ffffff" stroke="#fdba74"/>
  <text x="140" y="304" font-size="10" font-weight="bold" text-anchor="middle" fill="#9a3412">docker-compose.yml</text>
  <text x="140" y="324" font-size="9" text-anchor="middle" fill="#7c2d12">Web (:3000) -&gt; API (:5000)</text>
  <text x="140" y="342" font-size="9" text-anchor="middle" fill="#7c2d12">Postgres 16 (:5433 -&gt; :5432)</text>
  <text x="140" y="360" font-size="9" text-anchor="middle" fill="#7c2d12">Local .env (gitignored)</text>

  <!-- CI/CD Boundary -->
  <rect x="25" y="400" width="230" height="295" rx="10" fill="#fdf4ff" stroke="#d946ef" stroke-width="1.5" stroke-dasharray="4"/>
  <text x="40" y="424" font-size="12" font-weight="bold" fill="#86198f">&lt;&lt;CI/CD&gt;&gt; GitHub Actions</text>
  <text x="40" y="440" font-size="9.5" font-weight="bold" fill="#701a75">(thanhkhoa087/brewlite-1)</text>
  <rect x="42" y="452" width="196" height="122" rx="6" fill="#ffffff" stroke="#f0abfc"/>
  <text x="140" y="472" font-size="10" font-weight="bold" text-anchor="middle" fill="#701a75">CI Quality Gate (ci.yml)</text>
  <text x="140" y="492" font-size="9" text-anchor="middle" fill="#4a044e">1. npm ci &amp; Prisma Generate</text>
  <text x="140" y="510" font-size="9" text-anchor="middle" fill="#4a044e">2. ESLint (API &amp; Web)</text>
  <text x="140" y="528" font-size="9" text-anchor="middle" fill="#4a044e">3. Unit, Integration &amp; E2E Tests</text>
  <text x="140" y="546" font-size="9" text-anchor="middle" fill="#4a044e">4. Production Build Check</text>

  <rect x="42" y="584" width="196" height="98" rx="6" fill="#ffffff" stroke="#f0abfc"/>
  <text x="140" y="604" font-size="10" font-weight="bold" text-anchor="middle" fill="#701a75">CD Pipeline (cd.yml)</text>
  <text x="140" y="624" font-size="9" text-anchor="middle" fill="#4a044e">ghcr.io/.../brewlite-api &amp; web</text>
  <text x="140" y="642" font-size="9" text-anchor="middle" fill="#4a044e">Prisma Migrate + Deploy Hook</text>
  <text x="140" y="662" font-size="9" text-anchor="middle" fill="#15803d">Smoke Test: GET /health + Rollback</text>

  <!-- Production Cloud Platform -->
  <rect x="305" y="55" width="630" height="640" rx="12" fill="#f0fdf4" stroke="#22c55e" stroke-width="1.8"/>
  <text x="330" y="82" font-size="13" font-weight="bold" fill="#15803d">&lt;&lt;Production Cloud Platform&gt;&gt; (Vercel &amp; Render PaaS)</text>

  <!-- Frontend Container on Vercel -->
  <rect x="330" y="110" width="270" height="270" rx="8" fill="#ffffff" stroke="#38bdf8" stroke-width="1.5"/>
  <text x="465" y="135" font-size="11" font-weight="bold" text-anchor="middle" fill="#0284c7">&lt;&lt;Frontend Node&gt;&gt; Vercel Edge</text>
  <text x="465" y="155" font-size="10" font-weight="bold" text-anchor="middle" fill="#0369a1">brewlite-web.vercel.app</text>
  <line x1="330" y1="168" x2="600" y2="168" stroke="#e0f2fe"/>
  <rect x="350" y="180" width="230" height="180" rx="6" fill="#f0f9ff" stroke="#bae6fd"/>
  <text x="465" y="205" font-size="10" font-weight="bold" text-anchor="middle" fill="#0369a1">Next.js Web Service (PWA)</text>
  <text x="465" y="232" font-size="9" text-anchor="middle" fill="#0c4a6e">Edge Network • Port 443 (HTTPS)</text>
  <text x="465" y="257" font-size="9" text-anchor="middle" fill="#0c4a6e">SSL/TLS 1.3 Termination</text>
  <text x="465" y="282" font-size="9" text-anchor="middle" fill="#0c4a6e">Env: NEXT_PUBLIC_API_URL</text>
  <text x="465" y="307" font-size="9" text-anchor="middle" fill="#0c4a6e">SSR &amp; Client Hydration</text>

  <!-- Backend Container on Render -->
  <rect x="630" y="110" width="280" height="335" rx="8" fill="#ffffff" stroke="#22c55e" stroke-width="1.5"/>
  <text x="770" y="135" font-size="11" font-weight="bold" text-anchor="middle" fill="#16a34a">&lt;&lt;Backend Node&gt;&gt; Render Web Service</text>
  <text x="770" y="155" font-size="10" font-weight="bold" text-anchor="middle" fill="#15803d">api-brewlite.onrender.com</text>
  <line x1="630" y1="168" x2="910" y2="168" stroke="#dcfce7"/>
  <rect x="650" y="180" width="240" height="250" rx="6" fill="#f0fdf4" stroke="#bbf7d0"/>
  <text x="770" y="205" font-size="10" font-weight="bold" text-anchor="middle" fill="#15803d">NestJS Core REST Engine</text>
  <text x="770" y="228" font-size="9" text-anchor="middle" fill="#166534">Port 5000 (HTTPS/Express)</text>
  <text x="770" y="250" font-size="9" font-weight="bold" text-anchor="middle" fill="#166534">GET /health (DB Ping &amp; Uptime)</text>
  <text x="770" y="272" font-size="9" text-anchor="middle" fill="#166534">JWT Guard &amp; DTO Validation</text>
  <text x="770" y="295" font-size="9" text-anchor="middle" fill="#166534">Prisma Client ORM Engine</text>
  <text x="770" y="325" font-size="9" font-weight="bold" text-anchor="middle" fill="#15803d">PostgreSQL Idempotency Check</text>
  <text x="770" y="342" font-size="8.5" text-anchor="middle" fill="#166534">(Query Payment Table Directly)</text>
  <text x="770" y="375" font-size="9" text-anchor="middle" fill="#166534">Secrets: JWT_SECRET, DATABASE_URL</text>
  <text x="770" y="400" font-size="9" text-anchor="middle" fill="#166534">NestJS Logger -&gt; Cloud Logs</text>

  <!-- PostgreSQL Database Node -->
  <rect x="395" y="495" width="320" height="165" rx="8" fill="#ffffff" stroke="#eab308" stroke-width="1.2"/>
  <text x="555" y="522" font-size="11" font-weight="bold" text-anchor="middle" fill="#a16207">&lt;&lt;Database Cluster&gt;&gt; PostgreSQL 16</text>
  <rect x="415" y="538" width="280" height="102" rx="6" fill="#fffbeb" stroke="#fde68a"/>
  <text x="555" y="564" font-size="10" font-weight="bold" text-anchor="middle" fill="#854d0e">Port 5432 (Internal Private VPC)</text>
  <text x="555" y="588" font-size="9" text-anchor="middle" fill="#713f12">Persistent Storage: 10GB SSD Volume</text>
  <text x="555" y="612" font-size="9" text-anchor="middle" fill="#713f12">ACID Transactions &amp; Payment Table</text>

  <!-- External Mock Service -->
  <rect x="745" y="495" width="165" height="165" rx="8" fill="#ffffff" stroke="#ec4899"/>
  <text x="827" y="522" font-size="10" font-weight="bold" text-anchor="middle" fill="#be185d">&lt;&lt;External Service&gt;&gt;</text>
  <text x="827" y="558" font-size="9.5" text-anchor="middle" fill="#9d174d">Mock Payment</text>
  <text x="827" y="580" font-size="9.5" text-anchor="middle" fill="#9d174d">Gateway API</text>
  <text x="827" y="612" font-size="9" text-anchor="middle" fill="#9d174d">(MoMo / VNPAY / Card)</text>

  <!-- Arrows -->
  <line x1="255" y1="150" x2="330" y2="150" stroke="#1e293b" stroke-width="1.5" marker-end="url(#dep-arrow)"/>
  <text x="292" y="142" font-size="9" font-weight="bold" text-anchor="middle">HTTPS 443</text>

  <line x1="140" y1="383" x2="140" y2="400" stroke="#f97316" stroke-width="1.5" marker-end="url(#dep-arrow)"/>

  <line x1="600" y1="230" x2="630" y2="230" stroke="#1e293b" stroke-width="1.5" marker-end="url(#dep-arrow)"/>
  <text x="615" y="222" font-size="8" text-anchor="middle">API</text>

  <line x1="745" y1="445" x2="660" y2="495" stroke="#16a34a" stroke-width="1.5" marker-end="url(#dep-arrow)"/>
  <text x="725" y="472" font-size="8.5" fill="#15803d">TCP :5432</text>

  <line x1="827" y1="445" x2="827" y2="495" stroke="#be185d" stroke-width="1.5" marker-end="url(#dep-arrow)"/>

  <!-- CI to Prod Deploy -->
  <line x1="255" y1="620" x2="305" y2="620" stroke="#d946ef" stroke-width="1.5" stroke-dasharray="3" marker-end="url(#dep-arrow)"/>
  <text x="280" y="612" font-size="8" fill="#c026d3" font-weight="bold" text-anchor="middle">CD Hook</text>
</svg>'''
    save_to_all("deployment-diagram.svg", svg)
    print("Generated deployment-diagram.svg")

def generate_usecase_svgs():
    overview_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 560" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI', Arial, sans-serif;">
  <text x="440" y="30" font-size="17" font-weight="bold" text-anchor="middle" fill="#0f172a">SƠ ĐỒ USE-CASE TỔNG QUÁT HỆ THỐNG BREWLITE</text>
  <rect x="210" y="52" width="460" height="480" rx="10" fill="#f8fafc" stroke="#475569" stroke-width="1.8"/>
  <text x="440" y="76" font-size="13" font-weight="bold" text-anchor="middle" fill="#1e293b">Hệ Thống BrewLite</text>
  <circle cx="95" cy="150" r="16" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
  <line x1="95" y1="166" x2="95" y2="206" stroke="#0284c7" stroke-width="2"/>
  <line x1="75" y1="182" x2="115" y2="182" stroke="#0284c7" stroke-width="2"/>
  <line x1="95" y1="206" x2="78" y2="230" stroke="#0284c7" stroke-width="2"/>
  <line x1="95" y1="206" x2="112" y2="230" stroke="#0284c7" stroke-width="2"/>
  <text x="95" y="250" font-size="11" font-weight="bold" text-anchor="middle" fill="#0369a1">Khách hàng</text>
  <text x="95" y="265" font-size="9.5" text-anchor="middle" fill="#64748b">(Customer)</text>

  <circle cx="95" cy="355" r="14" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
  <line x1="95" y1="369" x2="95" y2="402" stroke="#16a34a" stroke-width="2"/>
  <line x1="78" y1="382" x2="112" y2="382" stroke="#16a34a" stroke-width="2"/>
  <line x1="95" y1="402" x2="80" y2="422" stroke="#16a34a" stroke-width="2"/>
  <line x1="95" y1="402" x2="110" y2="422" stroke="#16a34a" stroke-width="2"/>
  <text x="95" y="440" font-size="11" font-weight="bold" text-anchor="middle" fill="#15803d">Nhân viên quầy</text>

  <circle cx="785" cy="220" r="15" fill="#fce7f3" stroke="#db2777" stroke-width="2"/>
  <line x1="785" y1="235" x2="785" y2="270" stroke="#db2777" stroke-width="2"/>
  <line x1="767" y1="248" x2="803" y2="248" stroke="#db2777" stroke-width="2"/>
  <line x1="785" y1="270" x2="770" y2="292" stroke="#db2777" stroke-width="2"/>
  <line x1="785" y1="270" x2="800" y2="292" stroke="#db2777" stroke-width="2"/>
  <text x="785" y="310" font-size="11" font-weight="bold" text-anchor="middle" fill="#9d174d">Payment Gateway</text>

  <circle cx="785" cy="410" r="14" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
  <line x1="785" y1="424" x2="785" y2="456" stroke="#d97706" stroke-width="2"/>
  <line x1="768" y1="436" x2="802" y2="436" stroke="#d97706" stroke-width="2"/>
  <line x1="785" y1="456" x2="770" y2="476" stroke="#d97706" stroke-width="2"/>
  <line x1="785" y1="456" x2="800" y2="476" stroke="#d97706" stroke-width="2"/>
  <text x="785" y="495" font-size="11" font-weight="bold" text-anchor="middle" fill="#92400e">Quản lý cửa hàng</text>

  <ellipse cx="355" cy="115" rx="118" ry="22" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
  <text x="355" y="119" font-size="10.5" text-anchor="middle" fill="#0f172a">UC01: Xem menu &amp; danh mục</text>
  <ellipse cx="355" cy="170" rx="118" ry="22" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
  <text x="355" y="174" font-size="10.5" text-anchor="middle" fill="#0f172a">UC02: Tùy biến món &amp; Giỏ hàng</text>
  <ellipse cx="355" cy="225" rx="118" ry="22" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
  <text x="355" y="229" font-size="10.5" text-anchor="middle" fill="#0f172a">UC03: Đăng ký &amp; Đăng nhập (JWT)</text>
  <ellipse cx="355" cy="285" rx="122" ry="24" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
  <text x="355" y="289" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#92400e">UC04: Đặt &amp; thanh toán đơn hàng</text>
  <ellipse cx="560" cy="225" rx="92" ry="20" fill="#fdf2f8" stroke="#db2777" stroke-width="1.5"/>
  <text x="560" y="229" font-size="10" text-anchor="middle" fill="#9d174d">UC09: Xử lý thanh toán</text>
  <ellipse cx="560" cy="285" rx="92" ry="20" fill="#f3e8ff" stroke="#9333ea" stroke-width="1.5"/>
  <text x="560" y="289" font-size="10" text-anchor="middle" fill="#6b21a8">UC10: Áp dụng khuyến mãi</text>
  <ellipse cx="355" cy="345" rx="118" ry="22" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
  <text x="355" y="349" font-size="10.5" text-anchor="middle" fill="#0f172a">UC05: Theo dõi trạng thái đơn</text>
  <ellipse cx="355" cy="400" rx="118" ry="22" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
  <text x="355" y="404" font-size="10.5" text-anchor="middle" fill="#0f172a">UC06: Xem lịch sử đơn hàng</text>
  <ellipse cx="355" cy="455" rx="118" ry="22" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
  <text x="355" y="459" font-size="10.5" text-anchor="middle" fill="#15803d">UC07: Cập nhật tiến độ pha chế</text>
  <ellipse cx="545" cy="455" rx="105" ry="22" fill="#fffbeb" stroke="#d97706" stroke-width="1.5"/>
  <text x="545" y="459" font-size="10.5" text-anchor="middle" fill="#92400e">UC08: Quản lý menu &amp; Báo cáo</text>

  <line x1="120" y1="185" x2="237" y2="115" stroke="#334155" stroke-width="1.2"/>
  <line x1="120" y1="185" x2="237" y2="170" stroke="#334155" stroke-width="1.2"/>
  <line x1="120" y1="190" x2="237" y2="225" stroke="#334155" stroke-width="1.2"/>
  <line x1="120" y1="195" x2="233" y2="285" stroke="#d97706" stroke-width="1.6"/>
  <line x1="120" y1="200" x2="237" y2="345" stroke="#334155" stroke-width="1.2"/>
  <line x1="120" y1="205" x2="237" y2="400" stroke="#334155" stroke-width="1.2"/>
  <line x1="120" y1="395" x2="237" y2="455" stroke="#16a34a" stroke-width="1.3"/>
  <line x1="765" y1="245" x2="652" y2="225" stroke="#db2777" stroke-width="1.4"/>
  <line x1="765" y1="445" x2="650" y2="455" stroke="#d97706" stroke-width="1.4"/>
  <line x1="468" y1="272" x2="515" y2="243" stroke="#64748b" stroke-width="1.2" stroke-dasharray="4"/>
  <line x1="477" y1="285" x2="468" y2="285" stroke="#64748b" stroke-width="1.2" stroke-dasharray="4"/>
</svg>'''

    checkout_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 440" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI', Arial, sans-serif;">
  <text x="430" y="30" font-size="17" font-weight="bold" text-anchor="middle" fill="#0f172a">SƠ ĐỒ USE-CASE TRỌNG TÂM: ĐẶT VÀ THANH TOÁN ĐƠN HÀNG (UC04)</text>
  <rect x="190" y="52" width="480" height="360" rx="10" fill="#f8fafc" stroke="#475569" stroke-width="1.8"/>
  <text x="430" y="74" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#1e293b">Phạm vi Checkout &amp; Idempotent Payment</text>
  <text x="95" y="210" font-size="12" font-weight="bold" text-anchor="middle" fill="#0369a1">Khách hàng</text>
  <text x="765" y="265" font-size="11" font-weight="bold" text-anchor="middle" fill="#9d174d">Mock Payment</text>
  <ellipse cx="310" cy="150" rx="96" ry="24" fill="#dbeafe" stroke="#2563eb" stroke-width="1.6"/>
  <text x="310" y="154" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#1e40af">Tạo đơn hàng (PENDING)</text>
  <ellipse cx="310" cy="285" rx="96" ry="24" fill="#fce7f3" stroke="#db2777" stroke-width="1.6"/>
  <text x="310" y="289" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#9d174d">Xử lý thanh toán (Mock)</text>
  <ellipse cx="550" cy="105" rx="92" ry="18" fill="#ffffff" stroke="#64748b"/>
  <text x="550" y="109" font-size="10" text-anchor="middle">Xác thực phiên (JWT)</text>
  <ellipse cx="550" cy="155" rx="92" ry="18" fill="#ffffff" stroke="#64748b"/>
  <text x="550" y="159" font-size="10" text-anchor="middle">Kiểm tra &amp; trừ tồn kho</text>
  <ellipse cx="550" cy="230" rx="96" ry="18" fill="#ffffff" stroke="#db2777"/>
  <text x="550" y="234" font-size="10" text-anchor="middle">Kiểm tra Idempotency Key</text>
  <ellipse cx="550" cy="285" rx="96" ry="18" fill="#f0fdf4" stroke="#16a34a"/>
  <text x="550" y="289" font-size="10" text-anchor="middle" fill="#15803d">Cập nhật đơn PAID</text>
  <ellipse cx="550" cy="345" rx="96" ry="18" fill="#fef2f2" stroke="#ef4444"/>
  <text x="550" y="349" font-size="10" text-anchor="middle" fill="#b91c1c">Hủy đơn &amp; Hoàn tồn kho</text>
  <line x1="140" y1="200" x2="214" y2="150" stroke="#334155" stroke-width="1.5"/>
  <line x1="140" y1="215" x2="214" y2="285" stroke="#334155" stroke-width="1.5"/>
  <line x1="406" y1="285" x2="710" y2="265" stroke="#db2777" stroke-width="1.5"/>
  <line x1="400" y1="138" x2="462" y2="110" stroke="#64748b" stroke-dasharray="4"/>
  <line x1="406" y1="150" x2="458" y2="155" stroke="#64748b" stroke-dasharray="4"/>
  <line x1="400" y1="272" x2="458" y2="234" stroke="#64748b" stroke-dasharray="4"/>
  <line x1="406" y1="285" x2="454" y2="285" stroke="#16a34a" stroke-dasharray="4"/>
  <line x1="400" y1="300" x2="458" y2="342" stroke="#ef4444" stroke-dasharray="4"/>
</svg>'''

    with open(os.path.join(DIAGRAMS_DIR, "usecase-overview.svg"), "w", encoding="utf-8") as f:
        f.write(overview_svg)
    with open(os.path.join(DIAGRAMS_DIR, "usecase-checkout.svg"), "w", encoding="utf-8") as f:
        f.write(checkout_svg)
    print("Generated usecase-overview.svg & usecase-checkout.svg")

if __name__ == "__main__":
    generate_sequence_svg()
    generate_activity_svg()
    generate_class_svg()
    generate_deployment_svg()
    generate_usecase_svgs()
    print("All vector diagrams generated successfully.")
