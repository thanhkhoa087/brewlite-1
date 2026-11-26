'use client';

import React from 'react';
import { ShoppingBag, Coffee, User as UserIcon, LogOut, Receipt } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenHistory?: () => void;
}

export function Navbar({ onOpenCart, onOpenAuth, onOpenHistory }: NavbarProps) {
  const { totalQuantity } = useCart();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="w-full bg-white border-b border-amber-100 shadow-sm">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-amber-800 flex items-center justify-center text-white shadow-md">
            <Coffee className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-stone-900 leading-tight">BrewLite</h1>
            <p className="text-[10px] uppercase tracking-wider text-amber-700 font-medium">Coffee & Tea SGU</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-1.5">
              {onOpenHistory && (
                <button
                  onClick={onOpenHistory}
                  className="p-2 text-stone-700 hover:text-amber-800 transition-colors rounded-full hover:bg-stone-100"
                  title="Đơn hàng của tôi"
                >
                  <Receipt className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center space-x-2 bg-amber-50 py-1 px-2.5 rounded-full border border-amber-200">
                <span className="text-xs font-semibold text-amber-900 max-w-[80px] truncate">
                  {user?.fullName || 'User'}
                </span>
                <button
                  onClick={logout}
                  className="text-stone-400 hover:text-red-600 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="p-2 text-stone-700 hover:text-amber-800 transition-colors rounded-full hover:bg-stone-100"
              title="Đăng nhập"
            >
              <UserIcon className="w-5 h-5" />
            </button>
          )}

          {/* Cart Icon with Counter */}
          <button
            onClick={onOpenCart}
            className="relative p-2 text-stone-700 hover:text-amber-800 transition-colors rounded-full hover:bg-stone-100"
            title="Giỏ hàng"
          >
            <ShoppingBag className="w-6 h-6" />
            {totalQuantity > 0 && (
              <span className="absolute top-1 right-1 bg-amber-700 text-white text-[11px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {totalQuantity}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
