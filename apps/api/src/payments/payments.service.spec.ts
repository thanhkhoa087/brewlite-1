import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('PaymentsService (Unit Test - INT-T02, INT-T03)', () => {
  let service: PaymentsService;
  let ordersService: { findOne: jest.Mock; updateStatus: jest.Mock; restoreStock: jest.Mock };
  let paymentsDb: Map<string, any>;

  beforeEach(async () => {
    paymentsDb = new Map<string, any>();
    const mockOrder = {
      id: 'ord_test_999',
      orderCode: 'BWL-999',
      status: 'PENDING',
      totalAmount: 65000,
    };

    ordersService = {
      findOne: jest.fn().mockResolvedValue(mockOrder),
      updateStatus: jest.fn().mockResolvedValue({ ...mockOrder, status: 'PAID' }),
      restoreStock: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: OrdersService,
          useValue: ordersService,
        },
        {
          provide: PrismaService,
          useValue: {
            payment: {
              findUnique: jest.fn().mockImplementation(({ where }) => {
                if (where?.idempotencyKey && paymentsDb.has(where.idempotencyKey)) {
                  return Promise.resolve(paymentsDb.get(where.idempotencyKey));
                }
                return Promise.resolve(null);
              }),
              create: jest.fn().mockImplementation(({ data }) => {
                const rec = {
                  id: 'pay_123',
                  createdAt: new Date(),
                  order: mockOrder,
                  ...data,
                };
                if (data.idempotencyKey) {
                  paymentsDb.set(data.idempotencyKey, rec);
                }
                return Promise.resolve(rec);
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('FR-06 / INT-T02: should process payment and transition order status to PAID', async () => {
    const res = await service.processPayment({
      orderId: 'ord_test_999',
      method: 'MOMO',
      amount: 65000,
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('PAID');
    expect(res).toHaveProperty('transactionCode');
    expect(ordersService.updateStatus).toHaveBeenCalledWith('ord_test_999', 'PAID');
  });

  it('NFR-06 / INT-T03: should prevent double-spending when client retries with same Idempotency-Key', async () => {
    const key = 'idem_unique_key_uuid_1';
    const firstCall = await service.processPayment(
      { orderId: 'ord_test_999', method: 'MOMO', amount: 65000 },
      key,
    );

    const secondCall = await service.processPayment(
      { orderId: 'ord_test_999', method: 'MOMO', amount: 65000 },
      key,
    );

    expect(secondCall.isIdempotentReplay).toBe(true);
    expect(secondCall.transactionCode).toBe(firstCall.transactionCode);
    expect(ordersService.updateStatus).toHaveBeenCalledTimes(1);
  });

  it('FR-06 (Exception E3): should cancel order and restore stock on insufficient funds', async () => {
    await expect(
      service.processPayment({
        orderId: 'ord_test_999',
        method: 'CREDIT_CARD',
        amount: 65000,
        simulateScenario: 'INSUFFICIENT_FUNDS',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(ordersService.updateStatus).toHaveBeenCalledWith('ord_test_999', 'CANCELLED');
    expect(ordersService.restoreStock).toHaveBeenCalledWith('ord_test_999');
  });
});
