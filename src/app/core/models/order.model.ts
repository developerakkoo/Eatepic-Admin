export type OrderStatus = 'pending' | 'active' | 'delivered' | 'cancelled';
export type PaymentMethod = 'upi' | 'card' | 'cod' | 'wallet';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAvatar?: string;
  partner: string;
  items: OrderItem[];
  itemCount: number;
  amount: number;
  payment: PaymentMethod;
  status: OrderStatus;
  date: string;
  time: string;
  timeline: { step: string; done: boolean; at?: string }[];
  selfDelivery?: boolean;
}
