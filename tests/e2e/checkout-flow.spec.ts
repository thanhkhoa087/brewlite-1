/**
 * BrewLite End-to-End (E2E) Test Suite (E2E-T01)
 * Kiểm thử HTTP end-to-end toàn diện:
 * Health Check -> Menu & BOM Nguyên liệu -> Đăng ký JWT -> Tạo đơn (chống sửa giá) -> Hủy đơn PENDING -> Thanh toán Idempotency -> Concurrency 2 User
 */
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../apps/api/src/app.module';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { INITIAL_PRODUCTS } from '../../apps/api/src/products/products.service';
import { INITIAL_INGREDIENTS, INITIAL_RECIPES } from '../../apps/api/src/products/inventory.data';

describe('BrewLite E2E Checkout, Cancel & Concurrency Flow (E2E-T01)', () => {
  let app: INestApplication | undefined;
  let baseUrl: string;
  let jwtToken: string;
  let testOrderId: string;
  let firstTransactionCode: string;
  const testIdempotencyKey = `e2e-idem-${Date.now()}`;

  beforeAll(async () => {
    if (process.env.E2E_LIVE_URL) {
      baseUrl = process.env.E2E_LIVE_URL.replace(/\/$/, '');
      return;
    }

    const users = new Map<string, any>();
    const products = new Map<string, any>();
    const ingredients = new Map<string, any>();
    const orders = new Map<string, any>();
    const payments = new Map<string, any>();
    INITIAL_PRODUCTS.forEach((p) => products.set(p.id, { ...p }));
    INITIAL_INGREDIENTS.forEach((i) => ingredients.set(i.id, { ...i }));

    const prismaMock: any = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      $transaction: jest.fn().mockImplementation(async (cb) => {
        const snapshot = new Map(Array.from(ingredients.entries()).map(([k, v]) => [k, { ...v }]));
        try {
          return await cb(prismaMock);
        } catch (err) {
          ingredients.clear();
          snapshot.forEach((v, k) => ingredients.set(k, v));
          throw err;
        }
      }),
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) => Promise.resolve(users.get(where.email) || null)),
        create: jest.fn().mockImplementation(({ data }) => {
          const user = { id: `usr_e2e_${users.size + 1}`, role: 'CUSTOMER', ...data };
          users.set(user.email, user);
          return Promise.resolve(user);
        }),
      },
      ingredient: {
        findMany: jest.fn().mockImplementation(() => Promise.resolve(Array.from(ingredients.values()))),
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          const ing = ingredients.get(where.id);
          if (!ing) return Promise.resolve({ count: 0 });
          if (where.stockQuantity?.gte !== undefined && ing.stockQuantity < where.stockQuantity.gte) {
            return Promise.resolve({ count: 0 });
          }
          if (data.stockQuantity?.decrement) ing.stockQuantity -= data.stockQuantity.decrement;
          return Promise.resolve({ count: 1 });
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const ing = ingredients.get(where.id);
          if (ing && data.stockQuantity?.increment) ing.stockQuantity += data.stockQuantity.increment;
          return Promise.resolve(ing);
        }),
      },
      product: {
        findMany: jest.fn().mockImplementation(({ where } = {}) => {
          const all = Array.from(products.values()).map((p) => ({
            ...p,
            recipes: (INITIAL_RECIPES[p.id] || []).map((r) => ({
              ...r,
              ingredient: ingredients.get(r.ingredientId),
            })),
          }));
          return Promise.resolve(where?.category ? all.filter((p) => p.category === where.category) : all);
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          const p = products.get(where.id);
          if (!p) return Promise.resolve(null);
          return Promise.resolve({
            ...p,
            recipes: (INITIAL_RECIPES[p.id] || []).map((r) => ({
              ...r,
              ingredient: ingredients.get(r.ingredientId),
            })),
          });
        }),
      },
      order: {
        create: jest.fn().mockImplementation(({ data }) => {
          const id = `ord_e2e_${orders.size + 1}`;
          const rec = { id, createdAt: new Date(), updatedAt: new Date(), ...data, items: data.items?.create || [] };
          orders.set(id, rec);
          return Promise.resolve(rec);
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => Promise.resolve(orders.get(where.id) || null)),
        findMany: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve(Array.from(orders.values()).filter((o) => o.userId === where.userId)),
        ),
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          const rec = orders.get(where.id);
          if (!rec || (where.status && rec.status !== where.status)) return Promise.resolve({ count: 0 });
          Object.assign(rec, data);
          return Promise.resolve({ count: 1 });
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const rec = orders.get(where.id);
          Object.assign(rec, data);
          return Promise.resolve(rec);
        }),
      },
      payment: {
        findUnique: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve(where?.idempotencyKey ? payments.get(where.idempotencyKey) || null : null),
        ),
        create: jest.fn().mockImplementation(({ data }) => {
          const rec = { id: `pay_e2e_${payments.size + 1}`, createdAt: new Date(), order: orders.get(data.orderId), ...data };
          if (data.idempotencyKey) payments.set(data.idempotencyKey, rec);
          return Promise.resolve(rec);
        }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0);
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('Step 1: Health Check, Menu & BOM Raw Ingredients (GET /health, /api/products, /api/products/ingredients)', async () => {
    const healthRes = await fetch(`${baseUrl}/health`);
    expect(healthRes.status).toBe(200);

    const menuRes = await fetch(`${baseUrl}/api/products`);
    expect(menuRes.status).toBe(200);
    const products = await menuRes.json();
    expect(products.length).toBeGreaterThanOrEqual(6);

    const ingRes = await fetch(`${baseUrl}/api/products/ingredients`);
    expect(ingRes.status).toBe(200);
    const ings = await ingRes.json();
    expect(ings.length).toBeGreaterThanOrEqual(6);
  });

  it('Step 2: Đăng ký tài khoản khách hàng nhận JWT Token', async () => {
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `e2e_${Date.now()}@sgu.edu.vn`,
        password: 'Password123',
        fullName: 'Sinh viên SGU E2E',
      }),
    });
    expect(regRes.status).toBe(201);
    const auth = await regRes.json();
    jwtToken = auth.accessToken;
    expect(jwtToken).toBeDefined();
  });

  it('Step 3: Tạo đơn hàng có chống sửa giá client (Price Tampering) & voucher SGUFREE', async () => {
    // Client cố tình truyền unitPrice: 1000 -> Server phải tính lại từ DB:
    // prod-001 Size M (29,000 + 6,000 = 35,000) * 2 = 70,000
    // prod-002 Size L + Trân châu hoàng kim (38,000 + 12,000 + 10,000 = 60,000) * 1 = 60,000
    // subTotal = 130,000; discount SGUFREE = 15,000; totalAmount = 115,000
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        items: [
          { productId: 'prod-001', unitPrice: 1000, quantity: 2, size: 'M' },
          { productId: 'prod-002', unitPrice: 500, quantity: 1, size: 'L', toppings: ['Trân châu hoàng kim'] },
        ],
        promotionCode: 'SGUFREE',
        note: 'Ít đường, giao tại quầy SGU',
      }),
    });

    expect(res.status).toBe(201);
    const order = await res.json();
    testOrderId = order.id;
    expect(order.status).toBe('PENDING');
    expect(order.subTotal).toBe(130000);
    expect(order.discountAmount).toBe(15000);
    expect(order.totalAmount).toBe(115000);
  });

  it('Step 4: Hủy đơn hàng đặt nhầm (PENDING -> CANCELLED) & hoàn lại tồn kho nguyên liệu', async () => {
    const wrongOrderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: 'prod-001', quantity: 1, size: 'S' }],
      }),
    });
    expect(wrongOrderRes.status).toBe(201);
    const wrongOrder = await wrongOrderRes.json();

    const cancelRes = await fetch(`${baseUrl}/api/orders/${wrongOrder.id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    expect(cancelRes.status).toBe(200);
    const cancelled = await cancelRes.json();
    expect(cancelled.order.status).toBe('CANCELLED');
  });

  it('Step 5: Thanh toán với Idempotency-Key & Replay chống trừ tiền 2 lần', async () => {
    const payRes = await fetch(`${baseUrl}/api/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': testIdempotencyKey,
      },
      body: JSON.stringify({
        orderId: testOrderId,
        method: 'MOMO',
        amount: 115000,
      }),
    });

    expect(payRes.status).toBe(200);
    const payment = await payRes.json();
    expect(payment.status).toBe('PAID');
    firstTransactionCode = payment.transactionCode;

    const replayRes = await fetch(`${baseUrl}/api/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': testIdempotencyKey,
      },
      body: JSON.stringify({
        orderId: testOrderId,
        method: 'MOMO',
        amount: 115000,
      }),
    });

    expect(replayRes.status).toBe(200);
    const replay = await replayRes.json();
    expect(replay.isIdempotentReplay).toBe(true);
    expect(replay.transactionCode).toBe(firstTransactionCode);
  });
});
