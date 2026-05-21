import { User, UserAddress, UserDetail, UserStatus } from '../models/user.model';

function formatPhone(raw: Record<string, unknown>): string {
  const mobile = String(raw['mobileNumber'] || '').trim();
  if (!mobile) return '—';
  const code = String(raw['countryCode'] || '+91').trim();
  return `${code} ${mobile}`.trim();
}

function mapStatus(isBlocked: unknown): UserStatus {
  return isBlocked ? 'blocked' : 'active';
}

export function mapApiUser(raw: Record<string, unknown>): User {
  const created = raw['createdAt'] ? new Date(String(raw['createdAt'])) : new Date();
  return {
    id: String(raw['_id'] || ''),
    name: String(raw['fullName'] || 'User'),
    email: String(raw['email'] || '—'),
    phone: formatPhone(raw),
    role: 'customer',
    totalOrders: Number(raw['orderCount'] ?? 0),
    activeSub: Boolean(raw['hasSubscription']),
    joinedDate: created.toLocaleDateString('en-IN'),
    status: mapStatus(raw['isBlocked']),
  };
}

export function mapApiUserDetail(payload: {
  user: Record<string, unknown>;
  stats: Record<string, unknown>;
}): UserDetail {
  const user = payload.user || {};
  const stats = payload.stats || {};
  const base = mapApiUser({
    ...user,
    orderCount: stats['orderCount'],
    hasSubscription: stats['activeSubscription'],
  });

  const addressesRaw = (user['addresses'] as Record<string, unknown>[]) || [];
  const addresses: UserAddress[] = addressesRaw.map((a) => ({
    label: a['label'] ? String(a['label']) : undefined,
    fullAddress: String(a['fullAddress'] || ''),
    city: a['city'] ? String(a['city']) : undefined,
    state: a['state'] ? String(a['state']) : undefined,
    pincode: a['pincode'] ? String(a['pincode']) : undefined,
    isDefault: Boolean(a['isDefault']),
  }));

  return {
    ...base,
    walletBalance: Number(user['walletBalance'] ?? 0),
    subscriptionCount: Number(stats['subscriptionCount'] ?? 0),
    addresses,
    referralCode: user['referralCode'] ? String(user['referralCode']) : undefined,
  };
}
