'use client';

import React, { useState, useEffect } from 'react';
import { X, Receipt, Clock, CheckCircle, Coffee, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: any) => void;
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ thanh toán', cls: 'bg-amber-100 text-amber-800' },
  PAID: { label: 'Đã thanh toán', cls: 'bg-emerald-100 text-emerald-800' },
  PREPARING: { label: 'Đang pha chế', cls: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-stone-200 text-stone-800' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-red-100 text-red-700' },
};

export function OrderHistoryModal({ isOpen, onClose, onSelectOrder }: OrderHistoryModalProps) {
  const { token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    let active = true;
    setIsLoading(true);
    setError(null);
    api
      .getMyOrders(token || undefined)
      .then((data) => {
        if (active) setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err: any) => {
        if (active) setError(err.message || 'Không thể tải lịch sử đơn hàng');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, isAuthenticated, token]);

  if (!isOpen) return null;

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const handleCancelOrder = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    try {
      await api.cancelOrder(orderId, token || undefined);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o)),
      );
    } catch (err: any) {
      setError(err.message || 'Không thể hủy đơn hàng');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-amber-900 text-white">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-amber-200" />
            <h3 className="font-bold text-sm">Lịch sử đơn hàng của tôi</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {isLoading && (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-stone-100 rounded-2xl" />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center space-y-1">
              <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          {!isLoading && !error && orders.length === 0 && (
            <div className="py-12 text-center space-y-2 text-stone-400">
              <Coffee className="w-10 h-10 mx-auto text-stone-300" />
              <p className="text-sm font-semibold text-stone-600">Chưa có đơn hàng nào</p>
              <p className="text-xs">Hãy đặt món đồ uống đầu tiên của bạn tại BrewLite!</p>
            </div>
          )}

          {!isLoading &&
            !error &&
            orders.map((order) => {
              const badge = STATUS_STYLE[order.status] || {
                label: order.status,
                cls: 'bg-stone-100 text-stone-700',
              };
              return (
                <div
                  key={order.id}
                  onClick={() => {
                    onClose();
                    onSelectOrder(order);
                  }}
                  className="p-3.5 bg-stone-50 hover:bg-amber-50/60 border border-stone-200/70 rounded-2xl cursor-pointer transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900">
                      #{order.orderCode || order.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="inline-flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString('vi-VN')
                          : 'Vừa đặt'}
                      </span>
                    </span>
                    <span className="font-bold text-amber-900">
                      {formatPrice(order.totalAmount || 0)}
                    </span>
                  </div>
                  {order.items?.length > 0 && (
                    <div className="text-[11px] text-stone-500 flex items-center justify-between pt-1">
                      <span className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>{order.items.length} món • Bấm để xem tiến độ</span>
                      </span>
                      {order.status === 'PENDING' && (
                        <button
                          onClick={(e) => handleCancelOrder(e, order.id)}
                          className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors"
                        >
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
