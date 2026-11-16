'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, Coffee, Sparkles } from 'lucide-react';

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

export function OrderTracker({ order, onClose }: OrderTrackerProps) {
  const [currentStep, setCurrentStep] = useState(1); // 0: PENDING, 1: PAID, 2: PREPARING, 3: COMPLETED

  // Lock body scroll when tracker is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Simulate Barista live updates
  useEffect(() => {
    const t1 = setTimeout(() => setCurrentStep(2), 3500); // 3.5s -> PREPARING
    const t2 = setTimeout(() => setCurrentStep(3), 8000); // 8s -> COMPLETED
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!order) return null;

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-amber-800 text-white p-5 flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200">
              Theo dõi đơn hàng thời gian thực
            </span>
            <h3 className="font-bold text-lg mt-0.5">Mã đơn: #{order.orderCode || 'BWL-LIVE'}</h3>
            <p className="text-xs text-amber-100/90 mt-1">
              Giao dịch: {order.payment?.transactionCode || 'TX-MOCK-OK'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Progress */}
        <div className="p-6 border-b border-stone-100">
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
              {currentStep === 1 && 'Đơn hàng đã được xác nhận và gửi tới quầy Barista'}
              {currentStep === 2 && 'Barista đang chuẩn bị nguyên liệu và pha chế đồ uống...'}
              {currentStep === 3 && 'Đồ uống đã pha chế xong! Mời bạn tới quầy nhận món.'}
            </p>
          </div>
        </div>

        {/* Order Details */}
        <div className="p-5 max-h-48 overflow-y-auto space-y-2 text-xs">
          <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[11px] mb-2">
            Món đã đặt
          </h4>
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-700">
                {item.quantity}x {item.name || 'Đồ uống tùy biến'} ({item.size})
              </span>
              <span className="font-bold text-stone-900">
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
