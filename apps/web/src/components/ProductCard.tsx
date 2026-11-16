'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Product } from '../services/api';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100 flex space-x-3 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
    >
      {/* Thumbnail */}
      <div className="w-24 h-24 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 relative">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {product.stock <= 5 && (
          <span className="absolute bottom-1 left-1 bg-red-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            Sắp hết
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div>
          <span className="text-[10px] uppercase font-semibold text-amber-700 tracking-wide">
            {product.category}
          </span>
          <h3 className="font-semibold text-sm text-stone-900 line-clamp-1">{product.name}</h3>
          <p className="text-xs text-stone-500 line-clamp-2 mt-0.5 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-sm text-amber-900">
            {formatPrice(product.basePrice)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="w-7 h-7 rounded-full bg-amber-800 text-white flex items-center justify-center hover:bg-amber-900 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
