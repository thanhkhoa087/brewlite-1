'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, Check, Flame } from 'lucide-react';
import { Product, CartItem } from '../services/api';
import { useCart } from '../context/CartContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

const SIZES = [
  { label: 'S (Vừa)', val: 'S' as const, extra: 0 },
  { label: 'M (Lớn)', val: 'M' as const, extra: 6000 },
  { label: 'L (Khổng lồ)', val: 'L' as const, extra: 12000 },
];

const SWEET_LEVELS = [100, 70, 50, 0];
const ICE_LEVELS = [100, 50, 0];

// Topping tương ứng với từng loại đồ uống
const TOPPINGS_BY_CATEGORY: Record<string, { id: string; name: string; price: number }[]> = {
  'Trà sữa': [
    { id: 'ts-1', name: 'Trân châu hoàng kim mật ong', price: 10000 },
    { id: 'ts-2', name: 'Trân châu đen đường đen', price: 10000 },
    { id: 'ts-3', name: 'Kem Cheese phô mai béo', price: 12000 },
    { id: 'ts-4', name: 'Pudding trứng béo ngậy', price: 10000 },
    { id: 'ts-5', name: 'Thạch củ năng giòn', price: 8000 },
  ],
  'Trà trái cây': [
    { id: 'tc-1', name: 'Đào miếng giòn ngọt', price: 10000 },
    { id: 'tc-2', name: 'Thạch nha đam tươi mát', price: 8000 },
    { id: 'tc-3', name: 'Thạch củ năng giòn', price: 8000 },
    { id: 'tc-4', name: 'Hạt chia hữu cơ', price: 6000 },
  ],
  'Cà phê': [
    { id: 'cp-1', name: 'Thạch cà phê giòn thơm', price: 8000 },
    { id: 'cp-2', name: 'Kem Cheese phô mai béo', price: 12000 },
    { id: 'cp-3', name: 'Shot Espresso đậm đà', price: 10000 },
    { id: 'cp-4', name: 'Sốt Caramel béo ngậy', price: 8000 },
  ],
};

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { addToCart } = useCart();
  const [size, setSize] = useState<'S' | 'M' | 'L'>('M');
  const [sweetLevel, setSweetLevel] = useState(100);
  const [iceLevel, setIceLevel] = useState(100);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  const isBakery = product?.category === 'Bánh ngọt';
  const availableToppings = isBakery
    ? []
    : TOPPINGS_BY_CATEGORY[product?.category || ''] || [
        { id: 'def-1', name: 'Trân châu hoàng kim', price: 10000 },
        { id: 'def-2', name: 'Thạch củ năng giòn', price: 8000 },
        { id: 'def-3', name: 'Kem Cheese phô mai béo', price: 12000 },
      ];

  // Khóa cuộn trang chính khi mở popup để tránh nhấp nháy màn hình và cuộn lệch trang
  useEffect(() => {
    if (product) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [product]);

  // Reset lựa chọn khi chọn món mới
  useEffect(() => {
    if (product) {
      setSize('M');
      setSweetLevel(100);
      setIceLevel(100);
      setSelectedToppings([]);
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const currentSizeExtra = isBakery ? 0 : SIZES.find((s) => s.val === size)?.extra || 0;
  const toppingsTotal = selectedToppings.reduce((sum, topName) => {
    const item = availableToppings.find((t) => t.name === topName);
    return sum + (item ? item.price : 0);
  }, 0);

  const unitPrice = product.basePrice + currentSizeExtra + toppingsTotal;
  const totalPrice = unitPrice * quantity;

  const toggleTopping = (name: string) => {
    setSelectedToppings((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name],
    );
  };

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      id: `${product.id}-${isBakery ? 'STD' : size}-${isBakery ? 0 : sweetLevel}-${isBakery ? 0 : iceLevel}-${selectedToppings.sort().join('-')}`,
      productId: product.id,
      name: product.name,
      category: product.category,
      basePrice: product.basePrice,
      size: isBakery ? 'M' : size,
      sweetLevel: isBakery ? 0 : sweetLevel,
      iceLevel: isBakery ? 0 : iceLevel,
      toppings: isBakery ? [] : selectedToppings,
      unitPrice,
      quantity,
      imageUrl: product.imageUrl,
    };
    addToCart(cartItem);
    onClose();
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  // Chuyển sự kiện lăn chuột ở bất kỳ đâu trên card vào vùng nội dung cuộn được
  const handleCardWheel = (e: React.WheelEvent) => {
    if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
      contentRef.current.scrollTop += e.deltaY;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain transform-gpu"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleCardWheel}
      >
        {/* Header Image */}
        <div className="relative h-48 w-full bg-stone-100 flex-shrink-0 select-none">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div
          ref={contentRef}
          className="p-4 overflow-y-auto space-y-4 flex-1 overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
              {product.category}
            </span>
            <h2 className="text-lg font-bold text-stone-900">{product.name}</h2>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">{product.description}</p>
          </div>

          {/* Size Selection (chỉ áp dụng cho món nước, với bánh là khẩu phần tiêu chuẩn) */}
          {!isBakery ? (
            <div className="border-t border-stone-100 pt-3">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
                Chọn kích cỡ (Size)
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s.val}
                    onClick={() => setSize(s.val)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-medium transition-all ${
                      size === s.val
                        ? 'border-amber-800 bg-amber-50 text-amber-900 font-bold'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div>{s.label}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      {s.extra > 0 ? `+${formatPrice(s.extra)}` : 'Chuẩn'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-stone-100 pt-3">
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-amber-700" />
                  <span className="font-semibold">Khẩu phần phục vụ</span>
                </div>
                <span className="font-bold text-amber-800">1 chiếc tiêu chuẩn (Hâm nóng giòn)</span>
              </div>
            </div>
          )}

          {/* Sweetness (chỉ hiển thị cho món nước, không áp dụng cho bánh) */}
          {!isBakery && (
            <div className="border-t border-stone-100 pt-3">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
                Lượng đường
              </h4>
              <div className="grid grid-cols-4 gap-1.5">
                {SWEET_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSweetLevel(level)}
                    className={`py-1.5 text-center rounded-lg border text-xs font-medium transition-colors ${
                      sweetLevel === level
                        ? 'border-amber-800 bg-amber-50 text-amber-900 font-bold'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {level}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ice Level (chỉ hiển thị cho món nước, không áp dụng cho bánh) */}
          {!isBakery && (
            <div className="border-t border-stone-100 pt-3">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
                Lượng đá
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {ICE_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setIceLevel(level)}
                    className={`py-1.5 text-center rounded-lg border text-xs font-medium transition-colors ${
                      iceLevel === level
                        ? 'border-amber-800 bg-amber-50 text-amber-900 font-bold'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {level === 0 ? 'Không đá' : `${level}% đá`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toppings (chỉ áp dụng cho món nước và hiển thị topping theo đúng nhóm) */}
          {!isBakery && availableToppings.length > 0 && (
            <div className="border-t border-stone-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Thêm Topping ({product.category})
                </h4>
                <span className="text-[10px] text-stone-400">Tùy chọn</span>
              </div>
              <div className="space-y-1.5">
                {availableToppings.map((top) => {
                  const isSelected = selectedToppings.includes(top.name);
                  return (
                    <div
                      key={top.id}
                      onClick={() => toggleTopping(top.name)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-amber-800 bg-amber-50/60 text-amber-900 font-medium'
                          : 'border-stone-200 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected ? 'bg-amber-800 border-amber-800 text-white' : 'border-stone-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span>{top.name}</span>
                      </div>
                      <span className="font-semibold text-stone-500">+{formatPrice(top.price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center space-x-3 flex-shrink-0">
          <div className="flex items-center space-x-2 bg-white px-2.5 py-1.5 rounded-xl border border-stone-200">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="text-stone-500 hover:text-stone-900 p-1"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-stone-900 w-5 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="text-stone-500 hover:text-stone-900 p-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex-1 bg-amber-800 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:bg-amber-900 active:scale-[0.98] transition-all flex items-center justify-between text-xs"
          >
            <span>Thêm vào giỏ</span>
            <span>{formatPrice(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
