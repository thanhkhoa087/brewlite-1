export const SIZE_EXTRA = {
  S: 0,
  M: 6000,
  L: 12000,
};

export const PROMO_CODES = {
  SGUFREE: 15000,
};

export function computeCustomizedUnitPrice(basePrice, size = 'M', toppingPrices = [], isBakery = false) {
  const sizeExtra = isBakery ? 0 : (SIZE_EXTRA[size] ?? 0);
  const toppingTotal = isBakery
    ? 0
    : toppingPrices.reduce((sum, price) => sum + Number(price || 0), 0);
  return basePrice + sizeExtra + toppingTotal;
}

export function computeCartSummary(items, promoCode) {
  const subTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const normalizedPromo = promoCode ? promoCode.trim().toUpperCase() : '';
  const discountAmount = PROMO_CODES[normalizedPromo] || 0;
  const finalAmount = Math.max(0, subTotal - discountAmount);
  return { subTotal, totalQuantity, discountAmount, finalAmount };
}
