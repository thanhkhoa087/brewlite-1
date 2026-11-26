'use client';

import React, { useState, useEffect } from 'react';
import { X, CreditCard, Wallet, ShieldCheck, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: any) => void;
  promoCode?: string;
}

export function CheckoutModal({
  isOpen,
  onClose,
  onOrderSuccess,
  promoCode,
}: CheckoutModalProps) {
  const { items, totalAmount, clearCart } = useCart();
  const { token } = useAuth();
  const [method, setMethod] = useState<'MOMO' | 'VNPAY' | 'CREDIT_CARD'>('MOMO');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  const discount = promoCode === 'SGUFREE' ? 15000 : 0;
  const finalAmount = Math.max(0, totalAmount - discount);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const handleCheckout = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Create Order (POST /orders)
      const order = await api.createOrder(items, token || undefined, note, promoCode);

      // 2. Generate Client Idempotency Key (UUIDv4 simulation)
      const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // 3. Process Payment (POST /payments/process)
      const paymentRes = await api.processPayment(
        order.id,
        method,
        order.totalAmount || finalAmount,
        idempotencyKey,
      );

      // Clear cart on success
      clearCart();
      onClose();
      onOrderSuccess({ ...order, payment: paymentRes, status: 'PAID' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Thanh toán thất bại, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-stone-900">Xác nhận thanh toán đơn hàng</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Payment Methods */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-2 uppercase tracking-wide">
              Phương thức thanh toán trực tuyến
            </label>
            <div className="space-y-2">
              {/* MoMo */}
              <div
                onClick={() => setMethod('MOMO')}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  method === 'MOMO'
                    ? 'border-pink-600 bg-pink-50/50 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center font-black text-[10px]">
                    MoMo
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-stone-900">Ví điện tử MoMo</h5>
                    <p className="text-[10px] text-stone-500">Mô phỏng thanh toán quét mã QR</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={method === 'MOMO'}
                  onChange={() => setMethod('MOMO')}
                  className="accent-pink-600"
                />
              </div>

              {/* ATM / Card */}
              <div
                onClick={() => setMethod('CREDIT_CARD')}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  method === 'CREDIT_CARD'
                    ? 'border-amber-800 bg-amber-50/50 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-800 text-white flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-stone-900">Thẻ ATM nội địa / Visa</h5>
                    <p className="text-[10px] text-stone-500">Cổng thanh toán bảo mật OnePay/Napas</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={method === 'CREDIT_CARD'}
                  onChange={() => setMethod('CREDIT_CARD')}
                  className="accent-amber-800"
                />
              </div>
            </div>
          </div>

          {/* Barista Note */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1.5 uppercase tracking-wide">
              Ghi chú cho Barista pha chế
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Để riêng đá, mang đi, gọi trước..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-amber-800"
            />
          </div>

          {/* Amount Overview */}
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 flex justify-between items-center text-xs">
            <div>
              <span className="text-stone-500 block">Số tiền cần thanh toán</span>
            </div>
            <span className="text-base font-bold text-amber-900">{formatPrice(finalAmount)}</span>
          </div>

          {/* Submit */}
          <button
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="w-full bg-amber-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:bg-amber-900 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý giao dịch...</span>
              </>
            ) : (
              <span>Thanh toán ngay ({formatPrice(finalAmount)})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
