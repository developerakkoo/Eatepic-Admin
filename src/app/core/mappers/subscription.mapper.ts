import { PlanType, SubStatus, Subscription } from '../models/subscription.model';

function mapPlan(durationInDays?: number): PlanType {
 	const d = Number(durationInDays || 7);
  if (d <= 7) return 'weekly';
  if (d <= 31) return 'monthly';
  return 'daily';
}

function mapStatus(status: string): SubStatus {
  if (status === 'PAUSED') return 'paused';
  if (status === 'CANCELLED' || status === 'COMPLETED') return 'expired';
  return 'active';
}

export function mapApiSubscription(raw: Record<string, unknown>): Subscription {
  const user = raw['userId'] as Record<string, unknown> | undefined;
  const partner = raw['partnerId'] as Record<string, unknown> | undefined;
  const plan = raw['subscriptionPlanId'] as Record<string, unknown> | undefined;
  const start = raw['startDate'] ? new Date(String(raw['startDate'])) : new Date();
  const end = raw['endDate'] ? new Date(String(raw['endDate'])) : new Date();

  return {
    id: String(raw['_id'] || ''),
    customerName: user ? String(user['fullName'] || 'Customer') : 'Customer',
    customerPhone: user ? String(user['mobileNumber'] || '') : '',
    plan: mapPlan(Number(plan?.['durationInDays'])),
    partner: partner ? String(partner['kitchenName'] || '') : '',
    mealsPerDay: Number(plan?.['mealsPerDay'] || 1),
    startDate: start.toLocaleDateString('en-IN'),
    endDate: end.toLocaleDateString('en-IN'),
    amount: Number(raw['totalPrice'] || 0),
    status: mapStatus(String(raw['status'] || 'ACTIVE')),
    autoRenew: raw['status'] === 'ACTIVE',
  };
}
