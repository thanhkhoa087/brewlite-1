import { PrismaClient } from '@prisma/client';
import { INITIAL_PRODUCTS } from './products.service';
import { INITIAL_INGREDIENTS, INITIAL_RECIPES, calculateMaxSellableCups } from './inventory.data';

const prisma = new PrismaClient();

async function main() {
  console.log('1. Seeding raw ingredients (Nguyên vật liệu thô)...');
  for (const ing of INITIAL_INGREDIENTS) {
    await prisma.ingredient.upsert({
      where: { id: ing.id },
      update: {
        name: ing.name,
        unit: ing.unit,
        stockQuantity: ing.stockQuantity,
      },
      create: {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        stockQuantity: ing.stockQuantity,
      },
    });
  }

  const ingMap = new Map(INITIAL_INGREDIENTS.map((i) => [i.id, i]));

  console.log('2. Seeding products & BOM recipes (Công thức định lượng)...');
  for (const item of INITIAL_PRODUCTS) {
    const recipeDefs = INITIAL_RECIPES[item.id] || [];
    const maxCups = calculateMaxSellableCups(
      recipeDefs.map((r) => ({
        quantityRequired: r.quantityRequired,
        ingredient: ingMap.get(r.ingredientId),
      })),
      item.stock,
    );

    await prisma.product.upsert({
      where: { id: item.id },
      update: {
        stock: maxCups,
        isAvailable: maxCups > 0,
      },
      create: {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        basePrice: item.basePrice,
        imageUrl: item.imageUrl,
        stock: maxCups,
        isAvailable: maxCups > 0,
      },
    });

    for (const r of recipeDefs) {
      await prisma.productIngredient.upsert({
        where: {
          productId_ingredientId: {
            productId: item.id,
            ingredientId: r.ingredientId,
          },
        },
        update: {
          quantityRequired: r.quantityRequired,
        },
        create: {
          productId: item.id,
          ingredientId: r.ingredientId,
          quantityRequired: r.quantityRequired,
        },
      });
    }
  }

  console.log('Database seeding (ingredients, products, recipes) completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
