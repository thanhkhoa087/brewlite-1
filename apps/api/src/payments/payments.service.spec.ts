import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('PaymentsService (Idempotency & Processing)', () => {
  let service: PaymentsService;
  let ordersService: OrdersService;

  beforeEach(async () => {
    const mockOrder = {
      id: 'ord_test_999',
      orderCode: 'BWL-999',
      status: 'PENDING',
      totalAmount: 65000,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: OrdersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockOrder),
            updateStatus: jest.fn().mockResolvedValue({ ...mockOrder, status: 'PAID' }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            payment: {
              create: jest.fn().mockResolvedValue({ id: 'pay_123' }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    ordersService = module.get<OrdersService>(OrdersService);
  });

  it('FR-06: should successfully process payment and transition status to PAID', async () => {
    const res = await service.processPayment({
      orderId: 'ord_test_999',
      method: 'MOMO',
      amount: 65000,
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('PAID');
    expect(res).toHaveProperty('transactionCode');
  });

  it('NFR-06: should prevent double-spending when client retries with the same Idempotency-Key', async () => {
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
  });

  it('FR-06 (Exception): should handle insufficient funds scenario gracefully', async () => {
    await expect(
      service.processPayment({
        orderId: 'ord_test_999',
        method: 'CREDIT_CARD',
        amount: 65000,
        simulateScenario: 'INSUFFICIENT_FUNDS',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
