export type ProductCategory = 'Bags' | 'Flowers' | 'Plushies' | 'Accessories' | string;

export interface ProductVariant {
  id: string;
  productId: string;
  title: string; // e.g. "Pastel Pink", "Small"
  sku: string;
  price?: number | null;
  stock: number;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  price: number;
  salePrice?: number | null;
  stock: number;
  sku: string;
  desc: string;
  image: string;
  images?: string[];
  emoji: string;
  tag: string; // e.g. 'BESTSELLER', 'HANDMADE', 'NEW ARRIVAL', 'SALE'
  isPublished: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  variants?: ProductVariant[];
  scheduledLaunchAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  image: string;
  icon: string;
  displayOrder: number;
  isPublished: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId?: string | null;
  productName: string;
  customerName: string;
  rating: number; // 1-5
  title?: string;
  quote: string;
  byline: string;
  image: string;
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  emoji?: string;
  category?: string;
  stock?: number;
  selectedVariant?: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Paid' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  variantTitle?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shippingFee: number;
  total: number;
  currency: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  errorDescription?: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  role: 'admin' | 'owner' | 'manager';
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  perCustomerLimit: number;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
  scope: 'all' | 'category' | 'product';
  scopeTarget?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  bannerText: string;
  isBannerActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  scope: 'all' | 'category';
  category?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  firstOrderDate?: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  lowStockProductsCount: number;
  activeOffersCount: number;
  activeCouponsCount: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
  salesByMonth?: { month: string; amount: number }[];
}
