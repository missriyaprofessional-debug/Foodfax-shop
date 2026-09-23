export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  id: string;
  orderId?: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  notes?: string;
}

export interface OwnerOrder {
  id: string;
  shopId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'cod';
  paymentMethod: 'upi' | 'cash' | 'card';
  cancellationReason?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
  estimatedPrepMinutes: number;
}

export interface MenuItem {
  id: string;
  shopId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl?: string;
  preparationTimeMinutes: number;
  tag?: string; // 'Bestseller', 'Chef Special', 'Must Try'
  createdAt?: string;
}

export interface MenuCategory {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  shopType?: string;
  description?: string;
  phone?: string;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  openingTime?: string;
  closingTime?: string;
  upiId?: string;
  logoUrl?: string;
  bannerUrl?: string;
  isOpen: boolean;
  isRushMode: boolean;
  rushExtraMinutes: number;
  minimumOrder: number;
  acceptsTakeaway: boolean;
  acceptsDineIn: boolean;
  acceptsDelivery: boolean;
  createdAt?: string;
}

export interface OwnerProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'owner';
  createdAt?: string;
}

export type ActiveScreen =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'register'
  | 'shop_setup'
  | 'dashboard'
  | 'orders'
  | 'menu'
  | 'shop_qr'
  | 'sales'
  | 'profile';
