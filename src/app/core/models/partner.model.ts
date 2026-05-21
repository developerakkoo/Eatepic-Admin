export type PartnerStatus = 'active' | 'inactive' | 'pending';

export interface Partner {
  id: string;
  name: string;
  ownerName: string;
  rating: number;
  totalOrders: number;
  cuisine: string;
  location: string;
  status: PartnerStatus;
  image?: string;
}
