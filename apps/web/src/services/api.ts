const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  imageUrl: string;
  stock: number;
  isAvailable: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  category?: string;
  basePrice: number;
  size: 'S' | 'M' | 'L';
  sweetLevel: number;
  iceLevel: number;
  toppings: string[];
  unitPrice: number;
  quantity: number;
  imageUrl: string;
}

export const api = {
  async getProducts(category?: string): Promise<Product[]> {
    const url = category && category !== 'Tất cả' 
      ? `${API_URL}/products?category=${encodeURIComponent(category)}`
      : `${API_URL}/products`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Không thể tải danh sách sản phẩm');
    return res.json();
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`${API_URL}/products/${id}`);
    if (!res.ok) throw new Error('Không thể tải chi tiết sản phẩm');
    return res.json();
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');
    return data;
  },

  async register(email: string, password: string, fullName: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đăng ký thất bại');
    return data;
  },

  async createOrder(items: CartItem[], token?: string, note?: string, promotionCode?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('brewlite_token') : null);
    if (effectiveToken) {
      headers['Authorization'] = `Bearer ${effectiveToken}`;
    }

    const payload = {
      items: items.map((i) => ({
        productId: i.productId,
        size: i.size,
        sweetLevel: i.sweetLevel,
        iceLevel: i.iceLevel,
        toppings: i.toppings,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      note,
      promotionCode,
    };

    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể tạo đơn hàng');
    return data;
  },

  async getMyOrders(token?: string) {
    const headers: Record<string, string> = {};
    const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('brewlite_token') : null);
    if (effectiveToken) {
      headers['Authorization'] = `Bearer ${effectiveToken}`;
    }
    const res = await fetch(`${API_URL}/orders/my-orders`, {
      headers,
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể tải lịch sử đơn hàng');
    return data;
  },

  async processPayment(orderId: string, method: string, amount: number, idempotencyKey: string) {
    const res = await fetch(`${API_URL}/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        orderId,
        method,
        amount,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Thanh toán không thành công');
    return data;
  },

  async getOrder(orderId: string) {
    const res = await fetch(`${API_URL}/orders/${orderId}`);
    if (!res.ok) throw new Error('Không tìm thấy thông tin đơn hàng');
    return res.json();
  },

  async cancelOrder(orderId: string, token?: string) {
    const headers: Record<string, string> = {};
    const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('brewlite_token') : null);
    if (effectiveToken) {
      headers['Authorization'] = `Bearer ${effectiveToken}`;
    }
    const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
      method: 'PATCH',
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể hủy đơn hàng');
    return data;
  },

  async getAllOrders(status?: string, token?: string) {
    const headers: Record<string, string> = {};
    const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('brewlite_token') : null);
    if (effectiveToken) {
      headers['Authorization'] = `Bearer ${effectiveToken}`;
    }
    const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_URL}/orders${query}`, {
      headers,
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách đơn hàng');
    return data;
  },

  async updateOrderStatus(orderId: string, status: string, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('brewlite_token') : null);
    if (effectiveToken) {
      headers['Authorization'] = `Bearer ${effectiveToken}`;
    }
    const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể cập nhật trạng thái đơn hàng');
    return data;
  },

  async getIngredients() {
    const res = await fetch(`${API_URL}/products/ingredients`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể tải tồn kho nguyên liệu');
    return data;
  },
};
