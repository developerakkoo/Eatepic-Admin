export type PlanType = 'daily' | 'weekly' | 'monthly';
export type SubStatus = 'active' | 'paused' | 'expired';

export interface Subscription {
  id: string;
  customerName: string;
  customerPhone: string;
  plan: PlanType;
  partner: string;
  mealsPerDay: number;
  startDate: string;
  endDate: string;
  amount: number;
  status: SubStatus;
  autoRenew: boolean;
}
