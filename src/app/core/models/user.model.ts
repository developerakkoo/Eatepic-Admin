export type UserRole = 'customer' | 'admin' | 'support';
export type UserStatus = 'active' | 'blocked';

export interface UserAddress {
  label?: string;
  fullAddress: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  totalOrders: number;
  activeSub: boolean;
  joinedDate: string;
  status: UserStatus;
  avatar?: string;
}

export interface UserDetail extends User {
  walletBalance: number;
  subscriptionCount: number;
  addresses: UserAddress[];
  referralCode?: string;
}
