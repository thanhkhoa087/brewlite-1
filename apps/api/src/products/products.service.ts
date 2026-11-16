import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Cà phê Phin Sữa Tươi',
    description: 'Cà phê Robusta truyền thống thơm đậm đà kết hợp sữa tươi thanh trùng',
    category: 'Cà phê',
    basePrice: 29000,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    stock: 50,
    isAvailable: true,
  },
  {
    id: 'prod-002',
    name: 'Trà Sữa Oolong Nướng',
    description: 'Lá trà Oolong sấy thơm caramel hòa quyện cốt sữa béo ngậy chuẩn vị Đài Loan',
    category: 'Trà sữa',
    basePrice: 38000,
    imageUrl: '/images/tra-sua-oolong-nuong.jpg',
    stock: 45,
    isAvailable: true,
  },
  {
    id: 'prod-003',
    name: 'Trà Đào Cam Sả Tươi',
    description: 'Trà lài thanh mát cùng tép cam vàng tươi và lát đào giòn ngọt tự nhiên',
    category: 'Trà trái cây',
    basePrice: 35000,
    imageUrl: '/images/tra-dao-cam-sa-tuoi.jpg',
    stock: 60,
    isAvailable: true,
  },
  {
    id: 'prod-004',
    name: 'Bạc Xỉu 3 Tầng Đá',
    description: 'Sự hòa quyện giữa sữa đặc, sữa tươi và lớp espresso sóng sánh bên trên',
    category: 'Cà phê',
    basePrice: 32000,
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
    stock: 40,
    isAvailable: true,
  },
  {
    id: 'prod-005',
    name: 'Trà Sữa Trân Châu Hoàng Kim',
    description: 'Trà đen Ceylon đậm hậu vị, đi kèm trân châu hoàng kim dai giòn sần sật',
    category: 'Trà sữa',
    basePrice: 42000,
    imageUrl: '/images/tra-sua-tran-chau-hoang-kim.jpg',
    stock: 50,
    isAvailable: true,
  },
  {
    id: 'prod-006',
    name: 'Bánh Croissant Bơ Pháp',
    description: 'Bánh sừng bò ngàn lớp thơm lừng hương bơ tự nhiên nướng vàng giòn rụm',
    category: 'Bánh ngọt',
    basePrice: 28000,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
    stock: 25,
    isAvailable: true,
  },
];

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string) {
    try {
      const whereClause = category ? { category, isAvailable: true } : { isAvailable: true };
      const products = await this.prisma.product.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });
      if (products.length > 0) return products;
    } catch (e) {
      // Fallback in-memory dataset when DB connection is pending or in seed phase
    }

    if (category) {
      return INITIAL_PRODUCTS.filter((p) => p.category === category);
    }
    return INITIAL_PRODUCTS;
  }

  async findOne(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });
      if (product) return product;
    } catch (e) {
      // Fallback
    }

    const item = INITIAL_PRODUCTS.find((p) => p.id === id);
    if (!item) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có mã ${id}`);
    }
    return item;
  }
}
