'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: (promoCode?: string) => void;
}

export function CartDrawer({ isOpen, onClose, onProceedToCheckout }: CartDrawerProps) {
  const { items, updateQuantity, removeFromCart, totalAmount } = useCart();
  const { isAuthenticated } = useAuth();
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const discount = appliedPromo === 'SGUFREE' ? 15000 : 0;
  const finalAmount = Math.max(0, totalAmount - discount);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const handleApplyPromo = () => {
    if (promoInput.trim().toUpperCase() === 'SGUFREE') {
      setAppliedPromo('SGUFREE');
    } else {
      alert('Mã khuyến mãi không hợp lệ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-bold text-base text-stone-900">Giỏ hàng của bạn ({items.length})</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 space-y-2">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-300">
                <X className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">Giỏ hàng đang trống</p>
              <p className="text-xs">Hãy chọn món đồ uống yêu thích từ thực đơn nhé!</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-stone-50/70 p-3 rounded-2xl border border-stone-200/60 flex space-x-3"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-xs text-stone-900 truncate pr-2">
                      {item.name}
                    </h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-stone-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {item.category === 'Bánh ngọt' || (item.sweetLevel === 0 && item.iceLevel === 0 && item.toppings.length === 0) ? (
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Khẩu phần: Tiêu chuẩn • Bánh nướng nóng giòn
                    </p>
                  ) : (
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Size: {item.size} | {item.sweetLevel}% đường | {item.iceLevel}% đá
                    </p>
                  )}
                  {item.toppings.length > 0 && (
                    <p className="text-[10px] text-amber-800 font-medium truncate mt-0.5">
                      +{item.toppings.join(', ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-xs text-amber-900">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                    <div className="flex items-center space-x-1.5 bg-white px-2 py-0.5 rounded-lg border border-stone-200">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="text-stone-500 hover:text-stone-900 p-0.5"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-stone-800 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="text-stone-500 hover:text-stone-900 p-0.5"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Promo code & Summary */}
        {items.length > 0 && (
          <div className="p-4 border-t border-stone-100 bg-stone-50 space-y-3">
            {/* Promo */}
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Mã giảm giá (Thử: SGUFREE)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs uppercase font-medium focus:outline-none focus:border-amber-800"
                />
              </div>
              <button
                onClick={handleApplyPromo}
                className="px-3 py-2 bg-stone-800 text-white rounded-xl text-xs font-semibold hover:bg-stone-900"
              >
                Áp dụng
              </button>
            </div>

            {/* Calculations */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Tạm tính</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Khuyến mãi ({appliedPromo})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-900 font-bold text-sm border-t border-stone-200 pt-1.5">
                <span>Tổng thanh toán</span>
                <span className="text-amber-900">{formatPrice(finalAmount)}</span>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => onProceedToCheckout(appliedPromo || undefined)}
              className="w-full bg-amber-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:bg-amber-900 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-xs"
            >
              <span>{isAuthenticated ? 'Tiến hành đặt hàng' : 'Đăng nhập để đặt hàng'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
