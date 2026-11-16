import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  size?: string; // S, M, L

  @IsNumber()
  @IsOptional()
  sweetLevel?: number; // 0, 50, 70, 100

  @IsNumber()
  @IsOptional()
  iceLevel?: number; // 0, 50, 100

  @IsArray()
  @IsOptional()
  toppings?: string[];

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  promotionCode?: string;
}
