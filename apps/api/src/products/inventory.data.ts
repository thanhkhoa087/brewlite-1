export interface RawIngredientSeed {
  id: string;
  name: string;
  unit: string;
  stockQuantity: number;
}

export interface RecipeItemSeed {
  ingredientId: string;
  quantityRequired: number;
}

export const INITIAL_INGREDIENTS: RawIngredientSeed[] = [
  { id: 'ing-coffee', name: 'Cà phê hạt Robusta', unit: 'g', stockQuantity: 500 },
  { id: 'ing-milk', name: 'Sữa tươi thanh trùng', unit: 'ml', stockQuantity: 2000 },
  { id: 'ing-condensed-milk', name: 'Sữa đặc nguyên kem', unit: 'ml', stockQuantity: 1000 },
  { id: 'ing-oolong-tea', name: 'Lá trà Oolong nướng', unit: 'g', stockQuantity: 450 },
  { id: 'ing-black-tea', name: 'Trà đen Ceylon', unit: 'g', stockQuantity: 500 },
  { id: 'ing-jasmine-tea', name: 'Trà lài tươi', unit: 'g', stockQuantity: 600 },
  { id: 'ing-peach-syrup', name: 'Đào ngâm & Sả cam', unit: 'g', stockQuantity: 900 },
  { id: 'ing-golden-pearl', name: 'Trân châu hoàng kim', unit: 'g', stockQuantity: 1000 },
  { id: 'ing-butter-dough', name: 'Bột ngàn lớp bơ Pháp', unit: 'pcs', stockQuantity: 25 },
];

// Định lượng công thức cho 1 ly / 1 phần (BOM - Bill of Materials)
export const INITIAL_RECIPES: Record<string, RecipeItemSeed[]> = {
  // 500g cà phê / 10g = 50 ly; 2000ml sữa / 40ml = 50 ly -> tối đa 50 ly
  'prod-001': [
    { ingredientId: 'ing-coffee', quantityRequired: 10 },
    { ingredientId: 'ing-milk', quantityRequired: 40 },
  ],
  // 450g trà oolong / 10g = 45 ly; 2000ml sữa / 30ml = 66 ly -> tối đa 45 ly
  'prod-002': [
    { ingredientId: 'ing-oolong-tea', quantityRequired: 10 },
    { ingredientId: 'ing-milk', quantityRequired: 30 },
  ],
  // 600g trà lài / 10g = 60 ly; 900g đào cam sả / 15g = 60 ly -> tối đa 60 ly
  'prod-003': [
    { ingredientId: 'ing-jasmine-tea', quantityRequired: 10 },
    { ingredientId: 'ing-peach-syrup', quantityRequired: 15 },
  ],
  // 500g cà phê / 10g = 50 ly; 1000ml sữa đặc / 25ml = 40 ly -> tối đa 40 ly
  'prod-004': [
    { ingredientId: 'ing-coffee', quantityRequired: 10 },
    { ingredientId: 'ing-condensed-milk', quantityRequired: 25 },
    { ingredientId: 'ing-milk', quantityRequired: 30 },
  ],
  // 500g trà đen / 10g = 50 ly; 1000g trân châu / 20g = 50 ly -> tối đa 50 ly
  'prod-005': [
    { ingredientId: 'ing-black-tea', quantityRequired: 10 },
    { ingredientId: 'ing-golden-pearl', quantityRequired: 20 },
    { ingredientId: 'ing-milk', quantityRequired: 30 },
  ],
  // 25 bánh / 1 = 25 phần
  'prod-006': [
    { ingredientId: 'ing-butter-dough', quantityRequired: 1 },
  ],
};

// Bảng phụ thu Size chuẩn phía Server (không bao giờ tin giá Client gửi lên)
export const SERVER_SIZE_EXTRA: Record<string, number> = {
  S: 0,
  M: 6000,
  L: 12000,
};

// Bảng giá Topping chuẩn phía Server
export const SERVER_TOPPING_PRICES: Record<string, number> = {
  'Trân châu hoàng kim mật ong': 10000,
  'Trân châu hoàng kim': 10000,
  'Trân châu đen đường đen': 10000,
  'Kem Cheese phô mai béo': 12000,
  'Pudding trứng béo ngậy': 10000,
  'Thạch củ năng giòn': 8000,
  'Đào miếng giòn ngọt': 10000,
  'Thạch nha đam tươi mát': 8000,
  'Hạt chia hữu cơ': 6000,
  'Thạch cà phê giòn thơm': 8000,
  'Shot Espresso đậm đà': 10000,
  'Sốt Caramel béo ngậy': 8000,
};

export function calculateMaxSellableCups(
  recipes: Array<{ quantityRequired: number; ingredient?: { stockQuantity: number } }>,
  fallbackStock = 0,
): number {
  if (!recipes || recipes.length === 0) {
    return Math.max(0, Math.floor(fallbackStock));
  }
  const counts = recipes.map((r) => {
    const qty = r.ingredient?.stockQuantity ?? 0;
    if (r.quantityRequired <= 0) return 0;
    return Math.floor(qty / r.quantityRequired);
  });
  return Math.max(0, Math.min(...counts));
}

export function calculateServerUnitPrice(
  basePrice: number,
  category: string,
  size = 'M',
  toppings: string[] = [],
): number {
  if (category === 'Bánh ngọt') {
    return basePrice;
  }
  const sizeExtra = SERVER_SIZE_EXTRA[size] ?? SERVER_SIZE_EXTRA.M;
  const toppingsExtra = (toppings || []).reduce(
    (sum, name) => sum + (SERVER_TOPPING_PRICES[name] ?? 0),
    0,
  );
  return basePrice + sizeExtra + toppingsExtra;
}
