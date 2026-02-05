export type UserRole = 'user' | 'admin' | 'superadmin';
export type Tier = 'gold' | 'silver' | 'bronze' | null;
export type BranchStatus = 'active' | 'inactive';
export type RedemptionStatus = 'pending' | 'approved' | 'rejected';
export type PurchaseStatus = 'pending' | 'approved' | 'rejected';

export interface SystemSettings {
  amountPerPoint: number; // e.g., $1000 pesos = 1 point
  amountPerStamp: number; // e.g., $20000 pesos = 1 stamp
  pointsExpirationDays: number;
}

export interface User {
  id: number;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  points: number;
  tier: Tier;
  branchId?: number; // For admins
}

export interface Purchase {
  id: number;
  userId: number;
  branchId?: number; // Which branch the purchase belongs to
  date: string;
  amount: number;
  points: number;
  description: string;
  status: PurchaseStatus;
  approvedAt?: string; // ISO string for rate limiting
  receipt?: string; // Optional receipt/invoice number or URL
}

export interface Reward {
  id: number;
  name: string;
  points: number;
  description: string;
  icon: string;
}

export interface Coupon {
  id: number;
  userId: number;
  code: string;
  name: string;
  description: string;
  generatedDate: string;
  status: 'active' | 'used' | 'expired';
}

export interface LoyaltyCard {
  id: number;
  name: string;
  description: string;
  totalStamps: number;
  reward: string;
  icon: string;
  category: string;
}

export interface UserStampCard {
  id: number;
  userId: number;
  cardId: number;
  stamps: number;
  completed: boolean;
  startDate: string;
  completedDate?: string;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  manager: string;
  status: BranchStatus;
  createdDate: string;
}

export interface Redemption {
  id: number;
  userId: number;
  rewardId: number;
  rewardName: string;
  points: number;
  date: string;
  status: RedemptionStatus;
}

export interface AppNotification {
  id: number;
  userId?: number; // Optional: If present, message is private to this user. If null, it's global.
  message: string;
  date: string;
  dateFormatted: string;
  time: string;
  sentBy: string;
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  type: 'multiplier' | 'bonus' | 'discount';
  value: number; // e.g., 2 for 2x multiplier, 100 for +100 bonus points
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
  bgColor?: string;
}