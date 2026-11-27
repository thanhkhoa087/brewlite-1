'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, Coffee, Sparkles, XCircle } from 'lucide-react';

interface OrderTrackerProps {
  order: any;
  onClose: () => void;
}

const STEPS = [
  { key: 'PENDING', label: 'Tạo đơn', icon: Clock },
  { key: 'PAID', label: 'Đã thanh toán', icon: CheckCircle },
  { key: 'PREPARING', label: 'Đang pha chế', icon: Coffee },
  { key: 'COMPLETED', label: 'Sẵn sàng nhận', icon: Sparkles },
];

const STATUS_TO_STEP: Record<string, number> = {
  PENDING: 0,
  PAID: 1,
  PREPARING: 2,
  COMPLETED: 3,
};

export function OrderTracker({ order, onClose }: OrderTrackerProps) {
  const isCancelled = order?.status === 'CANCELLED';
  const initialStep = STATUS_TO_STEP[order?.status] ?? 0;
  const [currentStep, setCurrentStep] = useState(initialStep);

  // Sync step whenever selected order changes
  useEffect(() => {
    setCurrentStep(STATUS_TO_STEP[order?.status] ?? 0);
  }, [order?.id, order?.status]);

  // Lock body scroll when tracker is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Only simulate live Barista progress for freshly PAID orders
  useEffect(() => {
    if (order?.status !== 'PAID') return;
    const t1 = setTimeout(() => setCurrentStep(2), 3500); // 3.5s -> PREPARING
    const t2 = setTimeout(() => setCurrentStep(3), 8000); // 8s -> COMPLETED
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [order?.id, order?.status]);

  if (!order) return null;

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div
          className={`${
            isCancelled ? 'bg-red-700' : 'bg-amber-800'
          } text-white p-5 flex justify-between items-start`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200">
              {isCancelled ? 'Đơn hàng đã hủy' : 'Theo dõi đơn hàng thời gian thực'}
            </span>
            <h3 className="font-bold text-lg mt-0.5">Mã đơn: #{order.orderCode || 'BWL-LIVE'}</h3>
            {order.payment?.transactionCode && (
              <p className="text-xs text-amber-100/90 mt-1">
                Giao dịch: {order.payment.transactionCode}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Progress or Cancelled Notice */}
        <div className="p-6 border-b border-stone-100">
          {isCancelled ? (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-center space-y-1.5">
              <XCircle className="w-8 h-8 text-red-600 mx-auto" />
              <p className="text-xs font-bold text-red-800">Đơn hàng này đã bị hủy</p>
              <p className="text-[11px] text-red-700">
                Định lượng nguyên liệu đã được hoàn lại kho. Vui lòng đặt đơn mới nếu cần.
              </p>
            </div>
          ) : (
            <>
              <div className="relative flex justify-between">
                {/* Horizontal line */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-stone-200 -z-0">
                  <div
                    className="h-full bg-amber-800 transition-all duration-700"
                    style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                  />
                </div>

                {STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isPassed = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isPassed
                            ? 'bg-amber-800 text-white ring-4 ring-amber-100 shadow'
                            : 'bg-stone-200 text-stone-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] mt-2 font-medium ${
                          isCurrent
                            ? 'text-amber-900 font-bold'
                            : isPassed
                              ? 'text-stone-700'
                              : 'text-stone-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Current Status Message */}
              <div className="mt-6 p-3 bg-amber-50 rounded-2xl border border-amber-200/70 text-center">
                <p className="text-xs font-semibold text-amber-900">
                  {currentStep === 0 && 'Đơn hàng đã tạo và đang chờ hoàn tất thanh toán.'}
                  {currentStep === 1 && 'Đơn hàng đã được xác nhận và gửi tới quầy Barista.'}
                  {currentStep === 2 && 'Barista đang chuẩn bị nguyên liệu và pha chế đồ uống...'}
                  {currentStep === 3 && 'Đồ uống đã pha chế xong! Mời bạn tới quầy nhận món.'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Order Details */}
        <div className="p-5 max-h-48 overflow-y-auto space-y-2 text-xs">
          <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[11px] mb-2">
            Món đã đặt
          </h4>
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between py-1 border-b border-stone-100 gap-2">
              <div className="text-stone-700">
                <span>
                  {item.quantity}x {item.product?.name || item.name || 'Đồ uống tùy biến'} ({item.size})
                </span>
                {Array.isArray(item.toppings) && item.toppings.length > 0 && (
                  <p className="text-[10px] text-stone-400">
                    Topping: {item.toppings.join(', ')}
                  </p>
                )}
              </div>
              <span className="font-bold text-stone-900 shrink-0">
                {formatPrice(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}

          <div className="flex justify-between pt-2 font-bold text-sm text-stone-900">
            <span>Tổng thanh toán</span>
            <span className="text-amber-900">{formatPrice(order.totalAmount || 0)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100">
          <button
            onClick={onClose}
            className="w-full bg-stone-900 text-white font-semibold py-3 rounded-xl text-xs hover:bg-black"
          >
            Đóng & Quay lại Thực đơn
          </button>
        </div>
      </div>
    </div>
  );
}
