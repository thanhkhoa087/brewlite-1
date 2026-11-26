import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { INITIAL_PRODUCTS } from '../src/products/products.service';
import { INITIAL_INGREDIENTS, INITIAL_RECIPES } from '../src/products/inventory.data';

describe('BrewLite API Integration Tests (Price Security, BOM, Concurrency, Cancel & Idempotency)', () => {
  let app: INestApplication;
  let tokenUserA: string;
  let tokenUserB: string;
  let createdOrderId: string;

  const users = new Map<string, any>();
  const products = new Map<string, any>();
  const ingredients = new Map<string, any>();
  const orders = new Map<string, any>();
  const payments = new Map<string, any>();

  const buildMockPrisma = () => {
    let txQueue: Promise<any> = Promise.resolve();
    const prismaMock: any = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      $transaction: jest.fn().mockImplementation((cb) => {
        const run = async () => {
          const snapshot = new Map(
            Array.from(ingredients.entries()).map(([k, v]) => [k, { ...v }]),
          );
          try {
            return await cb(prismaMock);
          } catch (err) {
            ingredients.clear();
            snapshot.forEach((v, k) => ingredients.set(k, v));
            throw err;
          }
        };
        const next = txQueue.then(run, run);
        txQueue = next.catch(() => undefined);
        return next;
      }),
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve(where.email ? users.get(where.email) || null : null),
        ),
        create: jest.fn().mockImplementation(({ data }) => {
          const user = { id: `usr_${users.size + 1}`, role: 'CUSTOMER', ...data };
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
          return Promise.resolve(
            where?.category ? all.filter((p) => p.category === where.category) : all,
          );
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
          const id = `ord_${orders.size + 1}`;
          const rec = {
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
            items: data.items?.create || [],
          };
          orders.set(id, rec);
          return Promise.resolve(rec);
        }),
        findUnique: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve(orders.get(where.id) || null),
        ),
        findMany: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve(Array.from(orders.values()).filter((o) => o.userId === where.userId)),
        ),
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          const rec = orders.get(where.id);
          if (!rec || (where.status && rec.status !== where.status)) {
            return Promise.resolve({ count: 0 });
          }
          Object.assign(rec, data);
          return Promise.resolve({ count: 1 });
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const rec = orders.get(where.id);
          if (!rec) throw new Error('Not found');
          Object.assign(rec, data);
          return Promise.resolve(rec);
        }),
      },
      payment: {
        findUnique: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve(where?.idempotencyKey ? payments.get(where.idempotencyKey) || null : null),
        ),
        create: jest.fn().mockImplementation(({ data }) => {
          const rec = {
            id: `pay_${payments.size + 1}`,
            createdAt: new Date(),
            order: orders.get(data.orderId),
            ...data,
          };
          if (data.idempotencyKey) payments.set(data.idempotencyKey, rec);
          return Promise.resolve(rec);
        }),
      },
    };
    return prismaMock;
  };

  beforeAll(async () => {
    INITIAL_PRODUCTS.forEach((p) => products.set(p.id, { ...p }));
    INITIAL_INGREDIENTS.forEach((i) => ingredients.set(i.id, { ...i }));

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(buildMockPrisma())
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('NFR-04 / SMK-T01: GET /health should return HTTP 200 ok', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('FR-01 & BOM: GET /api/products & /api/products/ingredients compute sellable cups from raw stock', async () => {
    const res = await request(app.getHttpServer()).get('/api/products').expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(6);
    const coffee = res.body.find((p: any) => p.id === 'prod-001');
    expect(coffee.stock).toBe(50); // 500g / 10g = 50 cups

    const ingRes = await request(app.getHttpServer()).get('/api/products/ingredients').expect(200);
    expect(ingRes.body.length).toBe(INITIAL_INGREDIENTS.length);
  });

  it('FR-04: Register User A & User B to obtain JWT tokens', async () => {
    const regA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'userA@sgu.edu.vn', password: 'Password123', fullName: 'User A' })
      .expect(201);
    tokenUserA = regA.body.accessToken;

    const regB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'userB@sgu.edu.vn', password: 'Password123', fullName: 'User B' })
      .expect(201);
    tokenUserB = regB.body.accessToken;
  });

  it('NFR-02 / SEC-T01: POST /api/orders without JWT returns 401 Unauthorized', async () => {
    await request(app.getHttpServer())
      .post('/api/orders')
      .send({ items: [{ productId: 'prod-001', quantity: 1 }] })
      .expect(401);
  });

  it('SEC-PRICE / INT-T01: POST /api/orders ignores tampered client unitPrice and deducts raw ingredients', async () => {
    const beforeCoffee = ingredients.get('ing-coffee').stockQuantity;

    // Client attempts price tampering: sends unitPrice: 1000 instead of 29,000 + 6,000 (Size M) = 35,000
    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        items: [{ productId: 'prod-001', unitPrice: 1000, quantity: 2, size: 'M' }],
        promotionCode: 'SGUFREE',
      })
      .expect(201);

    expect(res.body.status).toBe('PENDING');
    expect(res.body.subTotal).toBe(70000); // 35,000 * 2 (server price!)
    expect(res.body.discountAmount).toBe(15000);
    expect(res.body.totalAmount).toBe(55000);
    expect(ingredients.get('ing-coffee').stockQuantity).toBe(beforeCoffee - 20);
    createdOrderId = res.body.id;
  });

  it('CANCEL (PENDING -> CANCELLED): PATCH /api/orders/:id/cancel cancels order & restores ingredients', async () => {
    const orderToCancel = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ items: [{ productId: 'prod-001', quantity: 2, size: 'S' }] })
      .expect(201);

    const coffeeAfterOrder = ingredients.get('ing-coffee').stockQuantity;

    const cancelRes = await request(app.getHttpServer())
      .patch(`/api/orders/${orderToCancel.body.id}/cancel`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);

    expect(cancelRes.body.order.status).toBe('CANCELLED');
    expect(ingredients.get('ing-coffee').stockQuantity).toBe(coffeeAfterOrder + 20);

    // Paying a cancelled order must be rejected
    await request(app.getHttpServer())
      .post('/api/payments/process')
      .send({ orderId: orderToCancel.body.id, method: 'MOMO', amount: 58000 })
      .expect(400);
  });

  it('FR-06 / INT-T02 & INT-T03: POST /api/payments/process pays once and replays on same Idempotency-Key', async () => {
    const idemKey = 'idem-integration-uuid-001';
    const first = await request(app.getHttpServer())
      .post('/api/payments/process')
      .set('Idempotency-Key', idemKey)
      .send({ orderId: createdOrderId, method: 'MOMO', amount: 1 }) // tampered amount also ignored!
      .expect(200);

    expect(first.body.status).toBe('PAID');
    expect(first.body.amount).toBe(55000);

    const replay = await request(app.getHttpServer())
      .post('/api/payments/process')
      .set('Idempotency-Key', idemKey)
      .send({ orderId: createdOrderId, method: 'MOMO', amount: 55000 })
      .expect(200);

    expect(replay.body.isIdempotentReplay).toBe(true);
    expect(replay.body.transactionCode).toBe(first.body.transactionCode);
  });

  it('OVERSELL & CONCURRENCY: 11 > 10 returns 409; User A & User B concurrently buying last 2 cups -> 1x 201, 1x 409', async () => {
    // Set coffee to 100g = max 10 cups
    ingredients.get('ing-coffee').stockQuantity = 100;
    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ items: [{ productId: 'prod-001', quantity: 11, size: 'S' }] })
      .expect(409);

    // Set coffee to 20g = last 2 cups
    ingredients.get('ing-coffee').stockQuantity = 20;
    const [resA, resB] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ items: [{ productId: 'prod-001', quantity: 2, size: 'S' }] }),
      request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ items: [{ productId: 'prod-001', quantity: 2, size: 'S' }] }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);
    expect(ingredients.get('ing-coffee').stockQuantity).toBe(0);
  });
});
