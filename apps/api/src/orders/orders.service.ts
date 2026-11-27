import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { INITIAL_PRODUCTS } from '../products/products.service';
import {
  INITIAL_INGREDIENTS,
  INITIAL_RECIPES,
  calculateServerUnitPrice,
} from '../products/inventory.data';

@Injectable()
export class OrdersService {
  // In-memory fallback stores (used only when PostgreSQL is offline in local/isolated demo)
  private inMemoryOrders = new Map<string, any>();
  private inMemoryIngredients = new Map<string, { id: string; name: string; unit: string; stockQuantity: number }>(
    INITIAL_INGREDIENTS.map((i) => [i.id, { ...i }]),
  );
  // Async mutex to serialize concurrent in-memory fallback operations (prevent race conditions)
  private fallbackLock: Promise<void> = Promise.resolve();

  constructor(private readonly prisma: PrismaService) {}

  private async runWithFallbackLock<T>(fn: () => Promise<T>): Promise<T> {
    let release!: () => void;
    const prev = this.fallbackLock;
    this.fallbackLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  async create(userId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng không được để trống');
    }

    for (const item of dto.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException('Số lượng sản phẩm phải là số nguyên lớn hơn 0');
      }
    }

    const orderCode = `BWL-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;

    try {
      // 1. Transactional server-side price calculation + atomic ingredient stock deduction (ACID)
      const order = await this.prisma.$transaction(async (tx) => {
        let subTotal = 0;
        const computedItems: Array<{
          productId: string;
          size: string;
          sweetLevel: number;
          iceLevel: number;
          toppings: string[];
          unitPrice: number;
          quantity: number;
          itemTotal: number;
        }> = [];

        const ingredientNeeds = new Map<string, { needed: number; name: string }>();
        const productStockNeeds = new Map<string, { needed: number; name: string }>();

        for (const item of dto.items) {
          const product: any = await tx.product.findUnique({
            where: { id: item.productId },
            include: {
              recipes: {
                include: { ingredient: true },
              },
            },
          });

          if (!product) {
            throw new NotFoundException(`Không tìm thấy sản phẩm có mã ${item.productId}`);
          }

          const size = item.size || 'M';
          const toppings = item.toppings || [];

          // SECURITY: Always compute unit price on server from DB basePrice (NEVER trust client unitPrice)
          const serverUnitPrice = calculateServerUnitPrice(
            product.basePrice,
            product.category || '',
            size,
            toppings,
          );
          const itemTotal = serverUnitPrice * item.quantity;
          subTotal += itemTotal;

          computedItems.push({
            productId: item.productId,
            size,
            sweetLevel: item.sweetLevel ?? 100,
            iceLevel: item.iceLevel ?? 100,
            toppings,
            unitPrice: serverUnitPrice,
            quantity: item.quantity,
            itemTotal,
          });

          // Aggregate BOM raw ingredient requirements
          if (product.recipes && product.recipes.length > 0) {
            for (const recipe of product.recipes) {
              const reqAmount = recipe.quantityRequired * item.quantity;
              const current = ingredientNeeds.get(recipe.ingredientId);
              const ingName = recipe.ingredient?.name || recipe.ingredientId;
              ingredientNeeds.set(recipe.ingredientId, {
                needed: (current?.needed || 0) + reqAmount,
                name: ingName,
              });
            }
          } else {
            // Fallback for simple product stock when no recipe rows are configured
            const current = productStockNeeds.get(product.id);
            productStockNeeds.set(product.id, {
              needed: (current?.needed || 0) + item.quantity,
              name: product.name,
            });
          }
        }

        // 2. Concurrency-safe atomic conditional deduction on Ingredients (sorted by ID to avoid deadlocks)
        const sortedIngredients = Array.from(ingredientNeeds.entries()).sort(([a], [b]) =>
          a.localeCompare(b),
        );
        for (const [ingredientId, info] of sortedIngredients) {
          if (tx.ingredient?.updateMany) {
            const updated = await tx.ingredient.updateMany({
              where: {
                id: ingredientId,
                stockQuantity: { gte: info.needed },
              },
              data: {
                stockQuantity: { decrement: info.needed },
              },
            });
            if (updated.count === 0) {
              throw new ConflictException(
                `Nguyên liệu "${info.name}" không đủ định lượng để pha chế số lượng yêu cầu`,
              );
            }
          }
        }

        // Atomic conditional deduction for products without recipes
        const sortedProducts = Array.from(productStockNeeds.entries()).sort(([a], [b]) =>
          a.localeCompare(b),
        );
        for (const [productId, info] of sortedProducts) {
          if (tx.product?.updateMany) {
            const updated = await tx.product.updateMany({
              where: {
                id: productId,
                stock: { gte: info.needed },
              },
              data: {
                stock: { decrement: info.needed },
              },
            });
            if (updated.count === 0) {
              throw new ConflictException(`Sản phẩm "${info.name}" không đủ tồn kho`);
            }
          } else {
            const fresh: any = await tx.product.findUnique({ where: { id: productId } });
            if (fresh && fresh.stock < info.needed) {
              throw new ConflictException(`Sản phẩm "${info.name}" không đủ tồn kho`);
            }
            if (tx.product?.update) {
              await tx.product.update({
                where: { id: productId },
                data: { stock: { decrement: info.needed } },
              });
            }
          }
        }

        const discountAmount = dto.promotionCode?.trim().toUpperCase() === 'SGUFREE' ? 15000 : 0;
        const totalAmount = Math.max(0, subTotal - discountAmount);

        return tx.order.create({
          data: {
            orderCode,
            userId,
            subTotal,
            discountAmount,
            totalAmount,
            status: 'PENDING',
            note: dto.note || null,
            items: {
              create: computedItems,
            },
          },
          include: {
            items: {
              include: {
                product: { select: { name: true, imageUrl: true } },
              },
            },
          },
        });
      });

      return order;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Concurrency-safe in-memory fallback (when PostgreSQL is offline)
      return this.runWithFallbackLock(async () => {
        let subTotal = 0;
        const ingredientNeeds = new Map<string, { needed: number; name: string }>();
        const computedItems: any[] = [];

        for (const item of dto.items) {
          const product = INITIAL_PRODUCTS.find((p) => p.id === item.productId);
          if (!product) {
            throw new NotFoundException(`Không tìm thấy sản phẩm có mã ${item.productId}`);
          }
          const size = item.size || 'M';
          const toppings = item.toppings || [];
          const serverUnitPrice = calculateServerUnitPrice(
            product.basePrice,
            product.category,
            size,
            toppings,
          );
          const itemTotal = serverUnitPrice * item.quantity;
          subTotal += itemTotal;

          computedItems.push({
            id: `item_${computedItems.length}_${Date.now()}`,
            productId: item.productId,
            name: product.name,
            size,
            sweetLevel: item.sweetLevel ?? 100,
            iceLevel: item.iceLevel ?? 100,
            toppings,
            unitPrice: serverUnitPrice,
            quantity: item.quantity,
            itemTotal,
          });

          const recipes = INITIAL_RECIPES[item.productId] || [];
          for (const r of recipes) {
            const ing = this.inMemoryIngredients.get(r.ingredientId);
            const cur = ingredientNeeds.get(r.ingredientId);
            ingredientNeeds.set(r.ingredientId, {
              needed: (cur?.needed || 0) + r.quantityRequired * item.quantity,
              name: ing?.name || r.ingredientId,
            });
          }
        }

        // Validate all ingredient needs BEFORE deducting any (all-or-nothing)
        for (const [ingId, info] of ingredientNeeds.entries()) {
          const ing = this.inMemoryIngredients.get(ingId);
          if (!ing || ing.stockQuantity < info.needed) {
            throw new ConflictException(
              `Nguyên liệu "${info.name}" không đủ định lượng để pha chế số lượng yêu cầu`,
            );
          }
        }

        // Deduct ingredients atomically under mutex lock
        for (const [ingId, info] of ingredientNeeds.entries()) {
          const ing = this.inMemoryIngredients.get(ingId)!;
          ing.stockQuantity -= info.needed;
        }

        const discountAmount = dto.promotionCode?.trim().toUpperCase() === 'SGUFREE' ? 15000 : 0;
        const totalAmount = Math.max(0, subTotal - discountAmount);

        const simulatedOrder = {
          id: `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          orderCode,
          userId,
          subTotal,
          discountAmount,
          totalAmount,
          status: 'PENDING',
          note: dto.note || '',
          createdAt: new Date(),
          items: computedItems,
        };
        this.inMemoryOrders.set(simulatedOrder.id, simulatedOrder);
        return simulatedOrder;
      });
    }
  }

  /**
   * Nghiệp vụ hủy đơn hàng (PENDING -> CANCELLED)
   * Hoàn lại định lượng nguyên vật liệu đã giữ chỗ; chưa xử lý hoàn tiền tự động trong phạm vi môn học.
   */
  async cancelOrder(orderId: string, requesterUserId?: string, requesterRole?: string) {
    const order = await this.findOne(orderId);

    const isStaff = ['BARISTA', 'MANAGER', 'ADMIN'].includes(requesterRole || '');
    if (requesterUserId && !isStaff && order.userId !== requesterUserId) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng của người dùng khác');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Đơn hàng này đã được hủy trước đó');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Không thể hủy đơn hàng ở trạng thái ${order.status}. Chỉ hỗ trợ hủy đơn ở trạng thái PENDING.`,
      );
    }

    // Attempt transactional status change + stock restoration in PostgreSQL
    try {
      const cancelled = await this.prisma.$transaction(async (tx) => {
        if (tx.order?.updateMany) {
          const res = await tx.order.updateMany({
            where: { id: orderId, status: 'PENDING' },
            data: { status: 'CANCELLED' },
          });
          if (res.count === 0) {
            throw new BadRequestException('Đơn hàng không còn ở trạng thái PENDING để hủy');
          }
        } else if (tx.order?.update) {
          await tx.order.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' },
          });
        }

        await this.restoreIngredientsInTx(tx, order.items || []);

        return tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: {
                product: { select: { name: true, imageUrl: true } },
              },
            },
            payment: true,
          },
        });
      });

      if (cancelled) {
        return {
          message: 'Đã hủy đơn hàng thành công (PENDING -> CANCELLED). Vui lòng đặt lại đơn mới nếu cần.',
          order: cancelled,
        };
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      // Fallback in-memory cancellation
    }

    return this.runWithFallbackLock(async () => {
      const inMem = this.inMemoryOrders.get(orderId);
      if (!inMem) {
        throw new NotFoundException(`Không tìm thấy đơn hàng mã ${orderId}`);
      }
      if (inMem.status !== 'PENDING') {
        throw new BadRequestException('Đơn hàng không còn ở trạng thái PENDING để hủy');
      }
      inMem.status = 'CANCELLED';
      for (const item of inMem.items || []) {
        const recipes = INITIAL_RECIPES[item.productId] || [];
        for (const r of recipes) {
          const ing = this.inMemoryIngredients.get(r.ingredientId);
          if (ing) ing.stockQuantity += r.quantityRequired * item.quantity;
        }
      }
      return {
        message: 'Đã hủy đơn hàng thành công (PENDING -> CANCELLED). Vui lòng đặt lại đơn mới nếu cần.',
        order: inMem,
      };
    });
  }

  private async restoreIngredientsInTx(tx: any, items: any[]) {
    for (const item of items) {
      const product: any = tx.product?.findUnique
        ? await tx.product.findUnique({
            where: { id: item.productId },
            include: { recipes: true },
          })
        : null;

      if (product?.recipes && product.recipes.length > 0 && tx.ingredient?.update) {
        for (const recipe of product.recipes) {
          await tx.ingredient.update({
            where: { id: recipe.ingredientId },
            data: { stockQuantity: { increment: recipe.quantityRequired * item.quantity } },
          });
        }
      } else if (tx.product?.update) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  }

  async findOne(id: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: { select: { name: true, imageUrl: true } },
            },
          },
          payment: true,
        },
      });
      if (order) return order;
    } catch {
      // Fallback to in-memory store
    }

    const inMem = this.inMemoryOrders.get(id);
    if (!inMem) {
      throw new NotFoundException(`Không tìm thấy đơn hàng mã ${id}`);
    }
    return inMem;
  }

  async findByUser(userId: string) {
    try {
      const orders = await this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: { select: { name: true, imageUrl: true } },
            },
          },
          payment: true,
        },
      });
      if (orders.length > 0) return orders;
    } catch {
      // Fallback to in-memory store
    }

    return Array.from(this.inMemoryOrders.values())
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateStatus(id: string, status: any) {
    try {
      const updated = await this.prisma.order.update({
        where: { id },
        data: { status },
      });
      if (updated) return updated;
    } catch {
      // Fallback to in-memory store
    }

    const order = this.inMemoryOrders.get(id);
    if (order) {
      order.status = status;
      this.inMemoryOrders.set(id, order);
      return order;
    }
    throw new NotFoundException(`Không tìm thấy đơn hàng ${id}`);
  }

  async restoreStock(orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (order && order.items?.length) {
        await this.prisma.$transaction(async (tx) => {
          await this.restoreIngredientsInTx(tx, order.items);
        });
        return;
      }
    } catch {
      // Safe fallback when DB is mocked or unavailable
    }

    const inMem = this.inMemoryOrders.get(orderId);
    if (inMem?.items?.length) {
      for (const item of inMem.items) {
        const recipes = INITIAL_RECIPES[item.productId] || [];
        for (const r of recipes) {
          const ing = this.inMemoryIngredients.get(r.ingredientId);
          if (ing) ing.stockQuantity += r.quantityRequired * item.quantity;
        }
      }
    }
  }
}
