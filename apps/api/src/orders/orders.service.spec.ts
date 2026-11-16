import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('OrdersService (Unit Test)', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn().mockImplementation((cb) => cb({
              product: {
                findUnique: jest.fn().mockResolvedValue({ id: 'prod-001', stock: 10, name: 'Cà phê' }),
              },
              order: {
                create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'ord_mock_123', ...data })),
              },
            })),
            order: {
              findUnique: jest.fn(),
              findMany: jest.fn().mockResolvedValue([]),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('FR-05: should reject order when cart items array is empty', async () => {
    await expect(service.create('usr-1', { items: [] })).rejects.toThrow(BadRequestException);
  });

  it('FR-05: should calculate total price accurately and create PENDING order', async () => {
    const result = await service.create('usr-1', {
      items: [
        { productId: 'prod-001', unitPrice: 29000, quantity: 2, size: 'M' },
        { productId: 'prod-002', unitPrice: 38000, quantity: 1, size: 'L' },
      ],
      note: 'Ít đường, không đá',
    });

    expect(result).toBeDefined();
    expect(result.subTotal).toBe(29000 * 2 + 38000); // 96000
    expect(result.totalAmount).toBe(96000);
    expect(result.status).toBe('PENDING');
  });

  it('FR-09: should apply promotion discount correctly', async () => {
    const result = await service.create('usr-1', {
      items: [{ productId: 'prod-001', unitPrice: 50000, quantity: 1 }],
      promotionCode: 'SGUFREE',
    });

    expect(result.subTotal).toBe(50000);
    expect(result.discountAmount).toBe(15000);
    expect(result.totalAmount).toBe(35000);
  });
});
