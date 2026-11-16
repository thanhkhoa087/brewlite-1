import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService, INITIAL_PRODUCTS } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService (Unit Test)', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn().mockResolvedValue(INITIAL_PRODUCTS),
              findUnique: jest.fn().mockImplementation(({ where }) => {
                const found = INITIAL_PRODUCTS.find((p) => p.id === where.id);
                return Promise.resolve(found || null);
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
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
    expect(filtered.every((p) => p.category === 'Cà phê')).toBe(true);
  });

  it('FR-02: should return details for an existing product id', async () => {
    const product = await service.findOne('prod-001');
    expect(product).toBeDefined();
    expect(product.id).toBe('prod-001');
  });
});
