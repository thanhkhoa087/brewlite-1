import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';

@Injectable()
export class PaymentsService {
  // In-memory idempotency cache (Map<idempotencyKey, responsePayload>)
  private idempotencyStore = new Map<string, any>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  async processPayment(dto: ProcessPaymentDto, idempotencyKey?: string) {
    // 1. Idempotency Check (NFR-06)
    if (idempotencyKey && this.idempotencyStore.has(idempotencyKey)) {
      const cached = this.idempotencyStore.get(idempotencyKey);
      return {
        ...cached,
        isIdempotentReplay: true,
        message: 'Giao dịch đã được ghi nhận trước đó (Idempotent response)',
      };
    }

    // 2. Fetch order
    const order = await this.ordersService.findOne(dto.orderId);
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng ${dto.orderId}`);
    }

    if (order.status === 'PAID') {
      return {
        success: true,
        orderId: order.id,
        status: 'PAID',
        message: 'Đơn hàng này đã được thanh toán hoàn tất',
      };
    }

    // 3. Simulate payment processing
    if (dto.simulateScenario === 'INSUFFICIENT_FUNDS') {
      await this.ordersService.updateStatus(order.id, 'CANCELLED');
      const failResponse = {
        success: false,
        orderId: order.id,
        status: 'FAILED',
        error: 'Số dư tài khoản không đủ để thanh toán',
      };
      if (idempotencyKey) this.idempotencyStore.set(idempotencyKey, failResponse);
      throw new BadRequestException(failResponse.error);
    }

    // 4. Successful Mock Payment (Happy Path)
    const transactionCode = `TX-${dto.method}-${Date.now()}`;
    await this.ordersService.updateStatus(order.id, 'PAID');

    try {
      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          amount: dto.amount,
          method: dto.method as any,
          status: 'COMPLETED',
          transactionCode,
          idempotencyKey: idempotencyKey || null,
          paidAt: new Date(),
        },
      });
    } catch (e) {
      // Prisma mock fallback
    }

    const responsePayload = {
      success: true,
      orderId: order.id,
      orderCode: order.orderCode || 'BWL-LIVE',
      status: 'PAID',
      amount: dto.amount,
      method: dto.method,
      transactionCode,
      paidAt: new Date().toISOString(),
      message: 'Thanh toán thành công! Đơn hàng đang được chuẩn bị.',
    };

    if (idempotencyKey) {
      this.idempotencyStore.set(idempotencyKey, responsePayload);
    }

    return responsePayload;
  }
}
