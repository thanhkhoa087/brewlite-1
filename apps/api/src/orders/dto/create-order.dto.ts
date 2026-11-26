import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
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

  /**
   * Optional client hint ONLY — server ALWAYS ignores this and computes price
   * from Database product.basePrice + server size/topping catalog (anti price tampering).
   */
  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsInt()
  @Min(1, { message: 'Số lượng sản phẩm phải lớn hơn hoặc bằng 1' })
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
