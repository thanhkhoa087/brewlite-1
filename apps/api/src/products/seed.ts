import { PrismaClient } from '@prisma/client';
import { INITIAL_PRODUCTS } from './products.service';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial products to PostgreSQL database...');
  for (const item of INITIAL_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        basePrice: item.basePrice,
        imageUrl: item.imageUrl,
        stock: item.stock,
        isAvailable: item.isAvailable,
      },
    });
  }
  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
