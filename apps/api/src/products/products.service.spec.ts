import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService, INITIAL_PRODUCTS } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { calculateMaxSellableCups, calculateServerUnitPrice } from './inventory.data';

describe('ProductsService (Unit Test - API-T01 & BOM Inventory)', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn().mockImplementation(({ where } = {}) => {
                if (where?.category) {
                  return Promise.resolve(
                    INITIAL_PRODUCTS.filter((p) => p.category === where.category),
                  );
                }
                return Promise.resolve(INITIAL_PRODUCTS);
              }),
              findUnique: jest.fn().mockImplementation(({ where }) => {
                const found = INITIAL_PRODUCTS.find((p) => p.id === where.id);
                return Promise.resolve(found || null);
              }),
            },
            ingredient: {
              findMany: jest.fn().mockResolvedValue([
                { id: 'ing-coffee', name: 'Cà phê hạt Robusta', unit: 'g', stockQuantity: 500 },
                { id: 'ing-milk', name: 'Sữa tươi thanh trùng', unit: 'ml', stockQuantity: 2000 },
              ]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('FR-01: should return all active products from catalog', async () => {
    const products = await service.findAll();
    expect(products).toBeDefined();
    expect(products.length).toBeGreaterThanOrEqual(1);
    expect(products[0]).toHaveProperty('name');
    expect(products[0]).toHaveProperty('basePrice');
  });

  it('FR-01: should filter products by category correctly', async () => {
    const filtered = await service.findAll('Cà phê');
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((p) => p.category === 'Cà phê')).toBe(true);
  });

  it('FR-02: should return details for an existing product id', async () => {
    const product = await service.findOne('prod-001');
    expect(product).toBeDefined();
    expect(product.id).toBe('prod-001');
  });

  it('FR-02: should throw NotFoundException for non-existent product id', async () => {
    await expect(service.findOne('prod-unknown')).rejects.toThrow(NotFoundException);
  });

  it('BOM Inventory: should compute max sellable cups dynamically from raw ingredients', () => {
    // 100g coffee (10g/cup -> 10 cups) & 2000ml milk (40ml/cup -> 50 cups) => min = 10 cups
    const maxCups = calculateMaxSellableCups([
      { quantityRequired: 10, ingredient: { stockQuantity: 100 } },
      { quantityRequired: 40, ingredient: { stockQuantity: 2000 } },
    ]);
    expect(maxCups).toBe(10);

    // 25g coffee (10g/cup -> 2 cups) & 80ml milk (40ml/cup -> 2 cups) => 2 cups
    const lowCups = calculateMaxSellableCups([
      { quantityRequired: 10, ingredient: { stockQuantity: 25 } },
      { quantityRequired: 40, ingredient: { stockQuantity: 80 } },
    ]);
    expect(lowCups).toBe(2);
  });

  it('Price Integrity: server calculates unitPrice from DB basePrice + size + toppings', () => {
    // Base 29,000 + Size L (+12,000) + Kem Cheese (+12,000) = 53,000
    expect(calculateServerUnitPrice(29000, 'Cà phê', 'L', ['Kem Cheese phô mai béo'])).toBe(53000);
    // Size S (+0) = 29,000
    expect(calculateServerUnitPrice(29000, 'Cà phê', 'S', [])).toBe(29000);
    // Bakery ignores size & toppings
    expect(calculateServerUnitPrice(28000, 'Bánh ngọt', 'L', ['Kem Cheese phô mai béo'])).toBe(28000);
  });

  it('BOM Inventory: should expose raw ingredients list via findAllIngredients()', async () => {
    const ingredients = await service.findAllIngredients();
    expect(ingredients.length).toBeGreaterThanOrEqual(2);
    expect(ingredients[0]).toHaveProperty('stockQuantity');
  });
});
