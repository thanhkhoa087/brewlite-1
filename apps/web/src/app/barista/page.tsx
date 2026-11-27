'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Coffee,
  ChefHat,
  Package,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  LogOut,
  AlertTriangle,
  Lock,
  Mail,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, Product } from '../../services/api';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stockQuantity: number;
  updatedAt?: string;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ thanh toán', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  PAID: { label: 'Đã thanh toán', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  PREPARING: { label: 'Đang pha chế', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-stone-200 text-stone-800 border-stone-300' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-red-100 text-red-700 border-red-200' },
};

const NEXT_ACTION: Record<string, { nextStatus: string; label: string; btnCls: string }> = {
  PENDING: {
    nextStatus: 'PAID',
    label: 'Xác nhận đã thu tiền',
    btnCls: 'bg-emerald-700 hover:bg-emerald-800 text-white',
  },
  PAID: {
    nextStatus: 'PREPARING',
    label: 'Bắt đầu pha chế',
    btnCls: 'bg-blue-700 hover:bg-blue-800 text-white',
  },
  PREPARING: {
    nextStatus: 'COMPLETED',
    label: 'Hoàn thành món',
    btnCls: 'bg-amber-800 hover:bg-amber-900 text-white',
  },
};

const INITIAL_MAX_STOCK: Record<string, number> = {
  'ing-coffee': 500,
  'ing-milk': 5000,
  'ing-oolong-tea': 400,
  'ing-peach-tea': 400,
  'ing-pearl': 1000,
  'ing-pastry': 25,
};

export default function BaristaPage() {
  const { user, token, login, logout, isAuthenticated } = useAuth();
  const isStaff = isAuthenticated && ['BARISTA', 'MANAGER', 'ADMIN'].includes(user?.role || '');

  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [orders, setOrders] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Staff login form
  const [email, setEmail] = useState('barista@brewlite.vn');
  const [password, setPassword] = useState('Barista@123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    if (!isStaff) return;
    setLoading(true);
    setError(null);
    try {
      const [ordersData, ingredientsData, productsData] = await Promise.all([
        api.getAllOrders(statusFilter, token || undefined),
        api.getIngredients(),
        api.getProducts(),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setIngredients(Array.isArray(ingredientsData) ? ingredientsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu quầy Barista');
    } finally {
      setLoading(false);
    }
  }, [isStaff, statusFilter, token]);

  useEffect(() => {
    if (!isStaff) return;
    fetchData();
    const timer = setInterval(fetchData, 15000);
    return () => clearInterval(timer);
  }, [isStaff, fetchData]);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.login(email, password);
      if (!['BARISTA', 'MANAGER', 'ADMIN'].includes(res.user?.role || '')) {
        setLoginError('Tài khoản này không có quyền Barista/Quản lý');
        return;
      }
      login(res.accessToken, res.user);
    } catch (err: any) {
      setLoginError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleChangeStatus = async (orderId: string, newStatus: string) => {
    setBusyOrderId(orderId);
    setError(null);
    try {
      await api.updateOrderStatus(orderId, newStatus, token || undefined);
      showToast(`Đã cập nhật trạng thái đơn sang ${STATUS_META[newStatus]?.label || newStatus}`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setBusyOrderId(orderId);
    setError(null);
    try {
      await api.cancelOrder(orderId, token || undefined);
      showToast('Đã hủy đơn hàng và hoàn lại định lượng nguyên liệu vào kho');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Không thể hủy đơn hàng');
    } finally {
      setBusyOrderId(null);
    }
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  // Unauthenticated or non-staff view
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
          <div className="bg-amber-900 text-white p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-800 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-amber-200" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Quầy Barista – BrewLite</h1>
                <p className="text-xs text-amber-200">Quản lý đơn hàng & Tồn kho nguyên liệu</p>
              </div>
            </div>
            <Link
              href="/"
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
              title="Quay lại thực đơn"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <form onSubmit={handleStaffLogin} className="p-6 space-y-4">
            {isAuthenticated && !isStaff && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <span>Đang đăng nhập tài khoản khách ({user?.email}).</span>
                <button
                  type="button"
                  onClick={logout}
                  className="font-bold text-red-700 hover:underline ml-2 shrink-0"
                >
                  Đăng xuất
                </button>
              </div>
            )}

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {loginError}
              </div>
            )}

            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 space-y-1">
              <p className="font-bold text-stone-800">Tài khoản Barista mặc định (Seed):</p>
              <p>
                Email: <code className="font-semibold text-amber-900">barista@brewlite.vn</code>
              </p>
              <p>
                Mật khẩu: <code className="font-semibold text-amber-900">Barista@123</code>
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Email nhân viên</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-amber-800"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-amber-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              {loginLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Đăng nhập Quầy Barista</span>
              )}
            </button>

            <div className="text-center pt-1">
              <Link href="/" className="text-xs text-stone-500 hover:text-amber-800 font-medium">
                ← Quay lại trang đặt món cho khách hàng
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const counts = {
    ALL: orders.length,
    PENDING: orders.filter((o) => o.status === 'PENDING').length,
    PAID: orders.filter((o) => o.status === 'PAID').length,
    PREPARING: orders.filter((o) => o.status === 'PREPARING').length,
    COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
  };

  const lowStockCount = ingredients.filter((ing) => {
    const base = INITIAL_MAX_STOCK[ing.id] || 100;
    return ing.stockQuantity <= base * 0.2;
  }).length;

  return (
    <div className="min-h-screen bg-stone-100 pb-12">
      {/* Top Bar */}
      <header className="bg-amber-950 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-800 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">BrewLite Barista KDS</h1>
              <p className="text-[11px] text-amber-200/90">
                {user?.fullName} ({user?.role})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Menu</span>
            </Link>
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-white/10 hover:bg-red-600/80 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-5 space-y-5">
        {/* Notifications */}
        {toast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center space-x-2 shadow-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{toast}</span>
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Tabs */}
        <div className="flex space-x-2 bg-white p-1.5 rounded-2xl shadow-sm border border-stone-200">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors ${
              activeTab === 'orders'
                ? 'bg-amber-800 text-white shadow'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Quản lý đơn hàng ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors ${
              activeTab === 'inventory'
                ? 'bg-amber-800 text-white shadow'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>
              Kho nguyên liệu ({ingredients.length})
              {lowStockCount > 0 ? ` • ${lowStockCount} sắp hết` : ''}
            </span>
          </button>
        </div>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Status Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'PENDING', label: 'Chờ thanh toán' },
                  { key: 'PAID', label: 'Đã thanh toán' },
                  { key: 'PREPARING', label: 'Đang pha chế' },
                  { key: 'COMPLETED', label: 'Hoàn thành' },
                  { key: 'CANCELLED', label: 'Đã hủy' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    statusFilter === tab.key
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-amber-800'
                  }`}
                >
                  {tab.label}
                  {statusFilter === 'ALL' && tab.key !== 'ALL' ? ` (${counts[tab.key]})` : ''}
                </button>
              ))}
            </div>

            {/* Order Cards */}
            {loading && orders.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-44 bg-white rounded-2xl border border-stone-200" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-2">
                <Sparkles className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="text-sm font-bold text-stone-700">Chưa có đơn hàng nào ở trạng thái này</p>
                <p className="text-xs text-stone-400">
                  Các đơn hàng mới từ khách sẽ tự động xuất hiện tại đây.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((order) => {
                  const meta = STATUS_META[order.status] || {
                    label: order.status,
                    cls: 'bg-stone-100 text-stone-700 border-stone-200',
                  };
                  const next = NEXT_ACTION[order.status];
                  const canCancel = ['PENDING', 'PAID', 'PREPARING'].includes(order.status);
                  const isBusy = busyOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col"
                    >
                      <div className="p-4 border-b border-stone-100 flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-stone-900">
                              #{order.orderCode || order.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${meta.cls}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-1 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleString('vi-VN')
                                : 'Vừa tạo'}
                            </span>
                            {order.user?.fullName && (
                              <span>• Khách: {order.user.fullName}</span>
                            )}
                          </p>
                        </div>
                        <span className="font-bold text-sm text-amber-900 shrink-0">
                          {formatPrice(order.totalAmount || 0)}
                        </span>
                      </div>

                      <div className="p-4 flex-1 space-y-2 text-xs">
                        {order.items?.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-start py-1 border-b border-stone-100 last:border-0 gap-2"
                          >
                            <div>
                              <p className="font-semibold text-stone-800">
                                {item.quantity}x{' '}
                                {item.product?.name || item.name || item.productId} (Size{' '}
                                {item.size})
                              </p>
                              <p className="text-[11px] text-stone-500">
                                Đường {item.sweetLevel ?? 100}% • Đá {item.iceLevel ?? 100}%
                                {Array.isArray(item.toppings) && item.toppings.length > 0
                                  ? ` • Topping: ${item.toppings.join(', ')}`
                                  : ''}
                              </p>
                            </div>
                            <span className="font-semibold text-stone-700 shrink-0">
                              {formatPrice(item.itemTotal || item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        ))}
                        {order.note && (
                          <div className="p-2 bg-amber-50/80 border border-amber-200/70 rounded-xl text-[11px] text-amber-900">
                            <b>Ghi chú:</b> {order.note}
                          </div>
                        )}
                      </div>

                      {(next || canCancel) && (
                        <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center gap-2">
                          {next && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleChangeStatus(order.id, next.nextStatus)}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${next.btnCls}`}
                            >
                              {isBusy ? 'Đang xử lý...' : next.label}
                            </button>
                          )}
                          {canCancel && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleCancelOrder(order.id)}
                              className="py-2 px-3 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors inline-flex items-center space-x-1 disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Hủy đơn</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVENTORY (RAW INGREDIENTS & SELLABLE CUPS) */}
        {activeTab === 'inventory' && (
          <div className="space-y-5">
            <section className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm text-stone-900">
                    Tồn kho nguyên vật liệu thô (BOM)
                  </h2>
                  <p className="text-xs text-stone-500">
                    Tự động trừ khi có đơn mới và hoàn lại ngay khi đơn bị hủy
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  {ingredients.length} nguyên liệu
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ingredients.map((ing) => {
                  const maxRef = Math.max(INITIAL_MAX_STOCK[ing.id] || 100, ing.stockQuantity || 1);
                  const pct = Math.min(100, Math.round((ing.stockQuantity / maxRef) * 100));
                  const isOut = ing.stockQuantity <= 0;
                  const isLow = !isOut && pct <= 20;

                  return (
                    <div
                      key={ing.id}
                      className={`p-4 rounded-2xl border ${
                        isOut
                          ? 'bg-red-50/70 border-red-200'
                          : isLow
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-stone-50 border-stone-200/80'
                      } space-y-2`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-xs text-stone-900">{ing.name}</h3>
                        {isOut ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white shrink-0">
                            Hết hàng
                          </span>
                        ) : isLow ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shrink-0">
                            Sắp hết
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                            Đủ dùng
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline space-x-1">
                        <span className="text-xl font-extrabold text-stone-900">
                          {ing.stockQuantity.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-xs font-semibold text-stone-500">{ing.unit}</span>
                      </div>

                      <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOut ? 'bg-red-600' : isLow ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Sellable Cups Capacity per Product */}
            <section className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 space-y-3">
              <div>
                <h2 className="font-bold text-sm text-stone-900">
                  Số ly / phần còn có thể phục vụ theo định lượng kho
                </h2>
                <p className="text-xs text-stone-500">
                  Tính tự động từ công thức BOM (ProductIngredient) trên Backend
                </p>
              </div>

              <div className="divide-y divide-stone-100">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="py-2.5 flex items-center justify-between text-xs gap-3"
                  >
                    <div>
                      <p className="font-bold text-stone-900">{prod.name}</p>
                      <p className="text-[11px] text-stone-500">{prod.category}</p>
                    </div>
                    <span
                      className={`font-bold px-3 py-1 rounded-full ${
                        prod.stock <= 0
                          ? 'bg-red-100 text-red-700'
                          : prod.stock <= 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      Còn {prod.stock} phần
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
