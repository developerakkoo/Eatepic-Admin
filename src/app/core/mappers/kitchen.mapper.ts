import {
  Partner,
  PartnerApprovalStatus,
  PartnerDetail,
  PartnerDocuments,
  PartnerStatus,
} from '../models/partner.model';

function toApprovalStatus(value: unknown): PartnerApprovalStatus {
  const v = String(value || '').toUpperCase();
  if (v === 'APPROVED' || v === 'REJECTED') return v;
  return 'PENDING';
}

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
    email: raw['email'] ? String(raw['email']) : undefined,
    phone: raw['phone'] ? String(raw['phone']) : undefined,
    rating: 4.2,
    totalOrders: Number(stats?.['totalOrders'] || raw['totalOrders'] || 0),
    cuisine: String(raw['cuisineType'] || raw['description'] || 'Multi cuisine'),
    location: String(raw['address'] || ''),
    status: uiStatus,
    approvalStatus: toApprovalStatus(raw['approvalStatus']),
    rejectionReason: raw['rejectionReason'] ? String(raw['rejectionReason']) : undefined,
    reviewedAt: raw['reviewedAt'] ? String(raw['reviewedAt']) : undefined,
    image: raw['profileImage'] as string | undefined,
  };
}

/**
 * Maps the detail endpoint shape `{ kitchen, approval, documents, stats }`
 * into a flat PartnerDetail.
 */
export function mapApiKitchenDetail(data: Record<string, unknown>): PartnerDetail {
  const kitchen = (data['kitchen'] as Record<string, unknown>) || data;
  const approval = (data['approval'] as Record<string, unknown>) || {};
  const stats = (data['stats'] as Record<string, unknown>) || {};
  const documents = (data['documents'] as PartnerDocuments) || {};
  const reviewedBy = approval['reviewedBy'] as Record<string, unknown> | null | undefined;

  const base = mapApiKitchen({ ...kitchen, stats });

  return {
    ...base,
    approvalStatus: toApprovalStatus(approval['approvalStatus'] ?? kitchen['approvalStatus']),
    rejectionReason: approval['rejectionReason']
      ? String(approval['rejectionReason'])
      : base.rejectionReason,
    reviewedAt: approval['reviewedAt'] ? String(approval['reviewedAt']) : base.reviewedAt,
    documents,
    reviewedBy: reviewedBy
      ? { name: String(reviewedBy['name'] ?? ''), email: String(reviewedBy['email'] ?? '') }
      : null,
    raw: data,
  };
}

export function uiPartnerStatusToApi(status: PartnerStatus | 'all'): Record<string, string> {
  if (status === 'all') return {};
  if (status === 'active') return { status: 'ACTIVE' };
  if (status === 'inactive') return { status: 'INACTIVE' };
  return { isActive: 'false' };
}
