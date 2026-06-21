import { Order, OrderItem, OrderStatus, PaymentMethod } from '../models/order.model';

const API_STATUSES = [
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
] as const;

export type ApiOrderStatus = (typeof API_STATUSES)[number];

export function uiStatusToApi(status: OrderStatus): ApiOrderStatus {
  switch (status) {
    case 'pending':
      return 'PLACED';
    case 'active':
      return 'ACCEPTED';
    case 'delivered':
      return 'DELIVERED';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return 'PLACED';
  }
}

export function apiStatusToUi(status: string): OrderStatus {
  switch (status) {
    case 'PLACED':
      return 'pending';
    case 'DELIVERED':
      return 'delivered';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'active';
  }
}

export function uiStatusFilterToQuery(status: OrderStatus | 'all'): Record<string, string> {
  if (status === 'all') return {};
  if (status === 'pending') return { status: 'PLACED' };
  if (status === 'delivered') return { status: 'DELIVERED' };
  if (status === 'cancelled') return { status: 'CANCELLED' };
  return { statusIn: 'ACCEPTED,PREPARING,READY,OUT_FOR_DELIVERY' };
}

function mapPayment(method?: string): PaymentMethod {
  const m = (method || '').toUpperCase();
  if (m === 'WALLET') return 'wallet';
  if (m === 'COD') return 'cod';
  if (m === 'ONLINE') return 'card';
  return 'upi';
}

function buildTimeline(status: string, timeline?: Record<string, string | Date>): Order['timeline'] {
  const steps = [
    { key: 'placedAt', step: 'Placed' },
    { key: 'acceptedAt', step: 'Confirmed' },
    { key: 'preparingAt', step: 'Prepared' },
    { key: 'readyAt', step: 'Ready' },
    { key: 'pickedAt', step: 'Dispatched' },
    { key: 'deliveredAt', step: 'Delivered' },
  ];
  const order = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const idx = order.indexOf(status);
  return steps.map((s, i) => {
    const at = timeline?.[s.key];
    const done = status === 'CANCELLED' ? s.key === 'placedAt' : i <= Math.max(idx, 0);
    return {
      step: s.step,
      done,
      at: at ? new Date(at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : undefined,
    };
  });
}

export function mapApiOrder(raw: Record<string, unknown>): Order {
  const user = raw['user'] as Record<string, unknown> | string | undefined;
  const partner = raw['partner'] as Record<string, unknown> | string | undefined;
  const items = (raw['items'] as Record<string, unknown>[]) || [];
  const price = raw['priceDetails'] as Record<string, unknown> | undefined;
  const payment = raw['payment'] as Record<string, unknown> | undefined;
  const timeline = raw['timeline'] as Record<string, string | Date> | undefined;
  const createdAt = raw['createdAt'] ? new Date(String(raw['createdAt'])) : new Date();
  const status = String(raw['status'] || 'PLACED');

  const customerName =
    typeof user === 'object' && user ? String(user['fullName'] || 'Customer') : 'Customer';
  const customerPhone =
    typeof user === 'object' && user
      ? `${user['countryCode'] || ''} ${user['mobileNumber'] || ''}`.trim()
      : '';
  const partnerName =
    typeof partner === 'object' && partner ? String(partner['kitchenName'] || 'Kitchen') : 'Kitchen';

  const mappedItems: OrderItem[] = items.map((item) => ({
    name: String(item['name'] || 'Item'),
    qty: Number(item['quantity'] || 1),
    price: Number(item['price'] || 0),
  }));

  return {
    id: String(raw['_id'] || raw['id'] || ''),
    customerName,
    customerPhone,
    partner: partnerName,
    items: mappedItems,
    itemCount: mappedItems.reduce((s, i) => s + i.qty, 0),
    amount: Number(price?.['totalAmount'] || 0),
    payment: mapPayment(payment?.['method'] as string),
    status: apiStatusToUi(status),
    date: createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    timeline: buildTimeline(status, timeline),
    selfDelivery: raw['selfDelivery'] === true,
  };
}
