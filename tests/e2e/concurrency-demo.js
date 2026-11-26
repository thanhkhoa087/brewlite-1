/**
 * Live Concurrency Demo Script (User A & User B đặt đồng thời các ly cuối cùng)
 * Cách chạy khi demo cho giảng viên:
 *   node tests/e2e/concurrency-demo.js [API_BASE_URL]
 * Mặc định: http://localhost:5000/api
 */

const API_BASE = (process.argv[2] || process.env.API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

async function registerUser(label) {
  const email = `concurrency_${label}_${Date.now()}@sgu.edu.vn`;
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'Password123',
      fullName: `Demo ${label}`,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Register ${label} failed: ${JSON.stringify(data)}`);
  return data.accessToken;
}

async function placeOrder(token, productId, quantity, label) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: [{ productId, size: 'S', quantity }],
      note: `Concurrency test from ${label}`,
    }),
  });
  const body = await res.json();
  return { label, status: res.status, body };
}

async function main() {
  console.log(`\n=== BREWLITE CONCURRENCY DEMO (${API_BASE}) ===`);
  const productsRes = await fetch(`${API_BASE}/products`);
  const products = await productsRes.json();
  const target = products.find((p) => p.id === 'prod-001') || products[0];

  console.log(`Sản phẩm kiểm thử: ${target.name} (${target.id})`);
  console.log(`Số ly tối đa hiện tại (tính từ kho nguyên liệu thô): ${target.stock} ly`);

  if (target.stock < 2) {
    console.log('Kho còn ít hơn 2 ly — hãy chạy lại `npm run seed` trước khi demo.');
    return;
  }

  const [tokenA, tokenB] = await Promise.all([registerUser('UserA'), registerUser('UserB')]);

  // Nếu kho còn nhiều hơn 2 ly, đặt trước để hạ tồn kho xuống đúng 2 ly cuối cùng
  const toDrain = target.stock - 2;
  if (toDrain > 0) {
    console.log(`Đang hạ tồn kho từ ${target.stock} ly xuống còn đúng 2 ly cuối cùng...`);
    const drain = await placeOrder(tokenA, target.id, toDrain, 'DrainSetup');
    if (drain.status !== 201) {
      throw new Error(`Không thể setup 2 ly cuối: ${JSON.stringify(drain.body)}`);
    }
  }

  console.log('-> Bắn ĐỒNG THỜI 2 request (User A mua 2 ly & User B mua 2 ly) tại cùng 1 thời điểm...');
  const results = await Promise.all([
    placeOrder(tokenA, target.id, 2, 'User A'),
    placeOrder(tokenB, target.id, 2, 'User B'),
  ]);

  for (const r of results) {
    console.log(`   [${r.label}] HTTP ${r.status} ->`, r.status === 201 ? `Order ${r.body.orderCode} (${r.body.status})` : r.body.message);
  }

  const afterRes = await fetch(`${API_BASE}/products/${target.id}`);
  const afterProduct = await afterRes.json();
  console.log(`Tồn kho còn lại sau tranh chấp đồng thời: ${afterProduct.stock} ly (KHÔNG ÂM KHO!)`);

  const statuses = results.map((r) => r.status).sort();
  if (statuses[0] === 201 && statuses[1] === 409 && afterProduct.stock === 0) {
    console.log('✅ KẾT QUẢ ĐẠT CHUẨN: Đúng 1 giao dịch thành công (201), 1 giao dịch bị chặn (409 Conflict), tồn kho = 0!\n');
  } else {
    console.error('❌ Kết quả ngoài mong đợi:', statuses, 'stock=', afterProduct.stock);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
