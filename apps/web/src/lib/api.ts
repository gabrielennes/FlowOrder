import { getToken } from './auth-storage';
import type {
  AuthResponse,
  Order,
  OrderStatus,
  Payment,
  PaymentMethod,
  Product,
  User,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body as { message?: string | string[] }).message ??
      `Request failed (${res.status})`;
    throw new ApiError(
      Array.isArray(message) ? message.join(', ') : message,
      res.status,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      false,
    ),

  register: (name: string, email: string, password: string) =>
    request<AuthResponse>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ name, email, password }) },
      false,
    ),

  me: () => request<User>('/users/me'),

  getProducts: (all = false) =>
    request<Product[]>(`/products${all ? '?all=true' : ''}`, {}, false),

  createProduct: (data: {
    name: string;
    description?: string;
    price: number;
    sku: string;
    initialStock?: number;
  }) => request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),

  getOrders: () => request<Order[]>('/orders'),

  createOrder: (data: {
    items: { productId: string; quantity: number }[];
    shippingStreet: string;
    shippingCity: string;
    shippingState: string;
    shippingZip: string;
  }) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),

  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    extra?: { trackingCode?: string; carrier?: string },
  ) =>
    request<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...extra }),
    }),

  createPayment: (orderId: string, method: PaymentMethod) =>
    request<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify({ orderId, method }),
    }),

  getPayments: () => request<Payment[]>('/payments'),
};

export { ApiError };
