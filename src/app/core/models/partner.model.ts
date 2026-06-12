export type PartnerStatus = 'active' | 'inactive' | 'pending';

export type PartnerApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PartnerDocumentMeta {
  url?: string;
  originalName?: string;
  mimeType?: string;
  uploadedAt?: string;
}

export interface PartnerDocuments {
  panCard?: PartnerDocumentMeta;
  gstCertificate?: PartnerDocumentMeta;
  fssaiLicense?: PartnerDocumentMeta;
}

export interface Partner {
  id: string;
  name: string;
  ownerName: string;
  email?: string;
  phone?: string;
  rating: number;
  totalOrders: number;
  cuisine: string;
  location: string;
  status: PartnerStatus;
  approvalStatus: PartnerApprovalStatus;
  rejectionReason?: string;
  reviewedAt?: string;
  image?: string;
}

export interface PartnerDetail extends Partner {
  documents?: PartnerDocuments;
  reviewedBy?: { name?: string; email?: string } | null;
  raw?: Record<string, unknown>;
}
