import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export const VALID_ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'PREPARING',
  'COMPLETED',
  'CANCELLED',
] as const;

export type OrderStatusType = (typeof VALID_ORDER_STATUSES)[number];

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_ORDER_STATUSES, {
    message: 'Trạng thái đơn hàng không hợp lệ (PENDING, PAID, PREPARING, COMPLETED, CANCELLED)',
  })
  status!: OrderStatusType;
}
