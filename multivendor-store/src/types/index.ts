import { Document, Types } from 'mongoose';

export type UserRole = 'customer' | 'vendor' | 'admin';
export type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type ProductType = 'physical' | 'digital';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  addresses: IAddress[];
  wishlist: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  _id?: Types.ObjectId;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

export interface IVendor extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  storeName: string;
  storeSlug: string;
  description?: string;
  logo?: string;
  banner?: string;
  status: VendorStatus;
  commissionRate: number;
  totalEarnings: number;
  availableBalance: number;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    iban?: string;
  };
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  vendor: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  sku?: string;
  type: ProductType;
  category: Types.ObjectId;
  images: string[];
  downloadUrl?: string;
  stock: number;
  trackStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  attributes: { name: string; value: string }[];
  rating: number;
  totalReviews: number;
  totalSales: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
}

export interface ICart extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  product: Types.ObjectId;
  vendor: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IAddress;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVendorOrder extends Document {
  _id: Types.ObjectId;
  order: Types.ObjectId;
  vendor: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  commission: number;
  vendorEarnings: number;
  status: OrderStatus;
  trackingNumber?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  product: Types.ObjectId;
  vendor: Types.ObjectId;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
