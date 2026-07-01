export type UserRole = 'CUSTOMER' | 'ADMIN' | 'WAREHOUSE' | 'FINANCE';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'STOCK_RESERVED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod = 'CREDIT_CARD' | 'PIX' | 'BOLETO';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  sku: string;
  active: boolean;
  inventory?: {
    quantity: number;
    reservedQuantity: number;
  } | null;
  createdBy?: { id: string; name: string; email: string };
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  product: { id: string; name: string; sku: string };
}

export interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  createdAt: string;
  items: OrderItem[];
  customer?: { id: string; name: string; email: string };
  payments?: Payment[];
  shipment?: {
    trackingCode?: string | null;
    carrier?: string | null;
    status: string;
  } | null;
}

export interface Payment {
  id: string;
  amount: string;
  status: string;
  method: PaymentMethod;
  paidAt?: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
