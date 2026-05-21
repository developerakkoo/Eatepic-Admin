import { Partner, PartnerStatus } from '../models/partner.model';

export function mapApiKitchen(raw: Record<string, unknown>): Partner {
  const status = String(raw['status'] || '');
  const isActive = raw['isActive'] === true;
  let uiStatus: PartnerStatus = 'pending';
  if (status === 'ACTIVE' && isActive) uiStatus = 'active';
  else if (status === 'INACTIVE' || !isActive) uiStatus = 'inactive';
  else uiStatus = 'pending';

  const stats = raw['stats'] as Record<string, unknown> | undefined;

  return {
    id: String(raw['_id'] || ''),
    name: String(raw['kitchenName'] || 'Kitchen'),
    ownerName: String(raw['ownerName'] || ''),
    rating: 4.2,
    totalOrders: Number(stats?.['totalOrders'] || raw['totalOrders'] || 0),
    cuisine: String(raw['cuisineType'] || raw['description'] || 'Multi cuisine'),
    location: String(raw['address'] || ''),
    status: uiStatus,
    image: raw['profileImage'] as string | undefined,
  };
}

export function uiPartnerStatusToApi(status: PartnerStatus | 'all'): Record<string, string> {
  if (status === 'all') return {};
  if (status === 'active') return { status: 'ACTIVE' };
  if (status === 'inactive') return { status: 'INACTIVE' };
  return { isActive: 'false' };
}
