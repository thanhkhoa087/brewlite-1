import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ProcessPaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã đơn hàng không được để trống' })
  orderId: string;

  @IsString()
  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  method: string; // MOMO, VNPAY, CREDIT_CARD

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  simulateScenario?: 'SUCCESS' | 'INSUFFICIENT_FUNDS' | 'GATEWAY_TIMEOUT';
}
