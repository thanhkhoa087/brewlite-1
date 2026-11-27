import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('OrdersService (Unit Test - Price Security, BOM Concurrency & Cancel)', () => {
  let service: OrdersService;
  let ingredientsDb: Map<string, { id: string; name: string; unit: string; stockQuantity: number }>;
  let ordersDb: Map<string, any>;

  const buildStatefulPrisma = () => {
    const productsDb = new Map<string, any>([
      [
        'prod-001',
        {
          id: 'prod-001',
          name: 'Cà phê Phin Sữa Tươi',
          category: 'Cà phê',
          basePrice: 29000,
          stock: 10,
          recipes: [
            { ingredientId: 'ing-coffee', quantityRequired: 10 },
            { ingredientId: 'ing-milk', quantityRequired: 40 },
          ],
        },
      ],
      [
        'prod-002',
        {
          id: 'prod-002',
          name: 'Trà Sữa Oolong Nướng',
          category: 'Trà sữa',
          basePrice: 38000,
          stock: 10,
          recipes: [
            { ingredientId: 'ing-oolong-tea', quantityRequired: 10 },
            { ingredientId: 'ing-milk', quantityRequired: 30 },
          ],
        },
      ],
    ]);

    const tx: any = {
      product: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          const p = productsDb.get(where.id);
          if (!p) return Promise.resolve(null);
          return Promise.resolve({
            ...p,
            recipes: p.recipes.map((r: any) => ({
              ...r,
              ingredient: ingredientsDb.get(r.ingredientId),
            })),
          });
        }),
      },
      ingredient: {
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          const ing = ingredientsDb.get(where.id);
          if (!ing) return Promise.resolve({ count: 0 });
          if (where.stockQuantity?.gte !== undefined && ing.stockQuantity < where.stockQuantity.gte) {
            return Promise.resolve({ count: 0 });
          }
          if (data.stockQuantity?.decrement) {
            ing.stockQuantity -= data.stockQuantity.decrement;
          }
          return Promise.resolve({ count: 1 });
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const ing = ingredientsDb.get(where.id);
          if (ing && data.stockQuantity?.increment) {
            ing.stockQuantity += data.stockQuantity.increment;
          }
          return Promise.resolve(ing);
        }),
      },
      order: {
        create: jest.fn().mockImplementation(({ data }) => {
          const id = `ord_${ordersDb.size + 1}`;
          const rec = { id, createdAt: new Date(), ...data, items: data.items?.create || [] };
          ordersDb.set(id, rec);
          return Promise.resolve(rec);
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => Promise.resolve(ordersDb.get(where.id) || null)),
        findMany: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve(Array.from(ordersDb.values()).filter((o) => o.userId === where.userId)),
        ),
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          const rec = ordersDb.get(where.id);
          if (!rec || (where.status && rec.status !== where.status)) {
            return Promise.resolve({ count: 0 });
          }
          Object.assign(rec, data);
          return Promise.resolve({ count: 1 });
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const rec = ordersDb.get(where.id);
          Object.assign(rec, data);
          return Promise.resolve(rec);
        }),
      },
    };

    let txQueue: Promise<any> = Promise.resolve();
    return {
      ...tx,
      $transaction: jest.fn().mockImplementation((cb) => {
        const run = async () => {
          const snapshot = new Map(
            Array.from(ingredientsDb.entries()).map(([k, v]) => [k, { ...v }]),
          );
          try {
            return await cb(tx);
          } catch (err) {
            ingredientsDb.clear();
            snapshot.forEach((v, k) => ingredientsDb.set(k, v));
            throw err;
          }
        };
        const next = txQueue.then(run, run);
        txQueue = next.catch(() => undefined);
        return next;
      }),
    };
  };

  beforeEach(async () => {
    ordersDb = new Map();
    // 100g coffee (10g/cup -> 10 cups), 2000ml milk (40ml/cup -> 50 cups), 200g oolong (20 cups)
    ingredientsDb = new Map([
      ['ing-coffee', { id: 'ing-coffee', name: 'Cà phê hạt Robusta', unit: 'g', stockQuantity: 100 }],
      ['ing-milk', { id: 'ing-milk', name: 'Sữa tươi thanh trùng', unit: 'ml', stockQuantity: 2000 }],
      ['ing-oolong-tea', { id: 'ing-oolong-tea', name: 'Lá trà Oolong nướng', unit: 'g', stockQuantity: 200 }],
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: buildStatefulPrisma(),
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('FR-05: should reject order when cart items array is empty', async () => {
    await expect(service.create('usr-1', { items: [] })).rejects.toThrow(BadRequestException);
  });

  it('SEC-PRICE: should IGNORE tampered client unitPrice and compute exact price from Database', async () => {
    // Client maliciously sends unitPrice: 1000 (instead of DB 29,000 + Size M 6,000 = 35,000)
    const result = await service.create('usr-1', {
      items: [
        { productId: 'prod-001', unitPrice: 1000, quantity: 2, size: 'M' }, // Server: 35,000 * 2 = 70,000
        { productId: 'prod-002', unitPrice: 999999, quantity: 1, size: 'S' }, // Server: 38,000 * 1 = 38,000
      ],
      note: 'Test anti price tampering',
    });

    expect(result.subTotal).toBe(35000 * 2 + 38000); // 108,000 (NOT 1000*2 + 999999)
    expect(result.totalAmount).toBe(108000);
    expect(result.status).toBe('PENDING');
    // Coffee deducted: 100g - 2*10g = 80g; Milk deducted: 2000 - (2*40 + 1*30) = 1890ml
    expect(ingredientsDb.get('ing-coffee')!.stockQuantity).toBe(80);
    expect(ingredientsDb.get('ing-milk')!.stockQuantity).toBe(1890);
  });

  it('OVERSELL: should reject ordering 11 cups when raw coffee only makes 10 cups (409 Conflict)', async () => {
    // Coffee has 100g => max 10 cups of prod-001 (10g/cup)
    await expect(
      service.create('usr-1', {
        items: [{ productId: 'prod-001', quantity: 11, size: 'S' }],
      }),
    ).rejects.toThrow(ConflictException);

    // Stock must remain untouched (no partial deduction, never negative)
    expect(ingredientsDb.get('ing-coffee')!.stockQuantity).toBe(100);
    expect(ingredientsDb.get('ing-milk')!.stockQuantity).toBe(2000);
  });

  it('CONCURRENCY: 2 users concurrently ordering last 2 cups -> 1 succeeds, 1 gets 409 Conflict, stock never negative', async () => {
    // Only 20g coffee left = exactly 2 cups of prod-001
    ingredientsDb.get('ing-coffee')!.stockQuantity = 20;

    const [resA, resB] = await Promise.allSettled([
      service.create('user-A', { items: [{ productId: 'prod-001', quantity: 2, size: 'S' }] }),
      service.create('user-B', { items: [{ productId: 'prod-001', quantity: 2, size: 'S' }] }),
    ]);

    const fulfilled = [resA, resB].filter((r) => r.status === 'fulfilled');
    const rejected = [resA, resB].filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(rejected[0].reason).toBeInstanceOf(ConflictException);
    expect(ingredientsDb.get('ing-coffee')!.stockQuantity).toBe(0);
  });

  it('CANCEL (PENDING -> CANCELLED): should cancel PENDING order and restore raw ingredients', async () => {
    const order = await service.create('usr-1', {
      items: [{ productId: 'prod-001', quantity: 3, size: 'S' }],
    });
    expect(ingredientsDb.get('ing-coffee')!.stockQuantity).toBe(70); // 100 - 30

    const cancelled = await service.cancelOrder(order.id, 'usr-1', 'CUSTOMER');
    expect(cancelled.order.status).toBe('CANCELLED');
    expect(ingredientsDb.get('ing-coffee')!.stockQuantity).toBe(100); // restored!

    // Cancelling again must fail with 400 BadRequest
    await expect(service.cancelOrder(order.id, 'usr-1', 'CUSTOMER')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('FR-09 / UNIT-T01: should apply SGUFREE promotion discount on server-computed subtotal', async () => {
    // prod-001 Size L = 29,000 + 12,000 = 41,000 -> -15,000 = 26,000
    const result = await service.create('usr-1', {
      items: [{ productId: 'prod-001', quantity: 1, size: 'L' }],
      promotionCode: 'SGUFREE',
    });

    expect(result.subTotal).toBe(41000);
    expect(result.discountAmount).toBe(15000);
    expect(result.totalAmount).toBe(26000);
  });

  it('FR-08 / API-T03: should return order history for user', async () => {
    await service.create('usr-1', {
      items: [{ productId: 'prod-001', quantity: 1, size: 'S' }],
    });
    const orders = await service.findByUser('usr-1');
    expect(orders.length).toBe(1);
    expect(orders[0].userId).toBe('usr-1');
  });

  it('BARISTA: should transition PENDING -> PAID -> PREPARING -> COMPLETED and reject invalid jump', async () => {
    const order = await service.create('usr-1', {
      items: [{ productId: 'prod-001', quantity: 1, size: 'S' }],
    });

    await expect(service.transitionStatus(order.id, 'COMPLETED')).rejects.toThrow(
      BadRequestException,
    );

    const paid = await service.transitionStatus(order.id, 'PAID');
    expect(paid.status).toBe('PAID');

    const preparing = await service.transitionStatus(order.id, 'PREPARING');
    expect(preparing.status).toBe('PREPARING');

    const completed = await service.transitionStatus(order.id, 'COMPLETED');
    expect(completed.status).toBe('COMPLETED');
  });

  it('BARISTA: should cancel PAID order and restore raw ingredients to inventory', async () => {
    const order = await service.create('usr-1', {
      items: [{ productId: 'prod-001', quantity: 2, size: 'S' }],
    });
    await service.transitionStatus(order.id, 'PAID');
    expect(ingredientsDb.get('ing-coffee')!.stockQuantity).toBe(80);

    const cancelled = await service.transitionStatus(order.id, 'CANCELLED');
    expect(cancelled.status).toBe('CANCELLED');
    expect(ingredientsDb.get('ing-coffee')!.stockQuantity).toBe(100);
  });
});
