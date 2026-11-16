'use client';

import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, RefreshCw, Coffee } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { CategoryFilter } from '../components/CategoryFilter';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { OrderTracker } from '../components/OrderTracker';
import { AuthModal } from '../components/AuthModal';
import { Product, api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Tất cả', 'Cà phê', 'Trà sữa', 'Trà trái cây', 'Bánh ngọt'];

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [promoCode, setPromoCode] = useState<string | undefined>(undefined);

  const fetchProducts = async (cat: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getProducts(cat);
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến máy chủ API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(activeCategory);
  }, [activeCategory]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleProceedToCheckout = (promo?: string) => {
    setPromoCode(promo);
    setIsCartOpen(false);
    if (!isAuthenticated) {
      setIsAuthOpen(true);
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const handleOrderSuccess = (order: any) => {
    setIsCheckoutOpen(false);
    setActiveOrder(order);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-stone-50/60 pb-20 shadow-xl border-x border-stone-200/50">
      {/* 1. Header Navigation */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* 2. Banner Hero */}
      <div className="p-4 bg-gradient-to-br from-amber-900 to-amber-950 text-white mx-4 mt-3 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[10px] bg-amber-800/80 text-amber-200 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
            Ưu đãi sinh viên SGU
          </span>
          <h2 className="text-base font-bold mt-1">Giảm 15.000đ cho đơn đầu tiên</h2>
          <p className="text-xs text-amber-200/80 mt-0.5">Nhập mã <b>SGUFREE</b> tại bước thanh toán</p>
        </div>
        <Coffee className="absolute -right-3 -bottom-3 w-24 h-24 text-amber-800/20" />
      </div>

      {/* 3. Search Bar */}
      <div className="p-4 pb-2">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm kiếm đồ uống, cà phê..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-2xl text-xs placeholder-stone-400 focus:outline-none focus:border-amber-800 shadow-sm"
          />
        </div>
      </div>

      {/* 4. Category Filter Bar */}
      <CategoryFilter
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* 5. Main Product Content */}
      <main className="p-4">
        {/* Loading Skeleton State */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl p-3 border border-stone-100 flex space-x-3 animate-pulse"
              >
                <div className="w-24 h-24 bg-stone-200 rounded-xl" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-stone-200 rounded w-1/4" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-1/2" />
                  <div className="h-4 bg-stone-200 rounded w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-stone-900">Không thể tải thực đơn</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">{error}</p>
            <button
              onClick={() => fetchProducts(activeCategory)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-800 text-white rounded-xl text-xs font-semibold hover:bg-amber-900 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredProducts.length === 0 && (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-stone-800">Không tìm thấy sản phẩm</h3>
            <p className="text-xs text-stone-400">Vui lòng thử tìm với từ khóa khác hoặc danh mục khác</p>
          </div>
        )}

        {/* Product Cards Grid / List */}
        {!isLoading && !error && filteredProducts.length > 0 && (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 6. Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={handleProceedToCheckout}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
        promoCode={promoCode}
      />

      {activeOrder && (
        <OrderTracker
          order={activeOrder}
          onClose={() => setActiveOrder(null)}
        />
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
