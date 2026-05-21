import { ChartDataPoint, StatCard } from '../models/dashboard.model';
import { mapApiOrder } from './order.mapper';

export interface DashboardApiResponse {
  summary: Record<string, number>;
  orderStats: Record<string, number>;
  recentSales: { _id: string; totalSales: number; orderCount: number }[];
  paymentOverview: { _id: { method: string; paymentStatus: string }; totalOrders: number; totalAmount: number }[];
  recentOrders: Record<string, unknown>[];
}

export function mapDashboardStats(data: DashboardApiResponse): StatCard[] {
  const s = data.summary || {};
  const o = data.orderStats || {};
  const placed = Number(o['placed'] || 0);
  const completed = Number(o['completed'] || 0);

  return [
    {
      label: 'Total Orders (placed)',
      value: placed,
      trend: 0,
      trendUp: true,
      icon: 'receipt-outline',
      color: 'green',
    },
    {
      label: 'Revenue (delivered)',
      value: `₹${Number(s['totalSales'] || 0).toLocaleString('en-IN')}`,
      trend: 0,
      trendUp: true,
      icon: 'cash-outline',
      color: 'amber',
    },
    {
      label: 'Active kitchens',
      value: Number(s['activeKitchens'] || 0),
      trend: 0,
      trendUp: true,
      icon: 'storefront-outline',
      color: 'purple',
    },
    {
      label: 'Total users',
      value: Number(s['totalUsers'] || 0).toLocaleString('en-IN'),
      trend: 0,
      trendUp: true,
      icon: 'people-outline',
      color: 'blue',
    },
  ];
}

export function mapRecentSales(
  sales: DashboardApiResponse['recentSales'],
  range: '7' | '30' | '90'
): ChartDataPoint[] {
  const days = range === '7' ? 7 : range === '30' ? 30 : 90;
  const byDate = new Map(sales.map((row) => [row._id, row.orderCount || 0]));
  const data: ChartDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    data.push({
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      value: byDate.get(key) ?? 0,
    });
  }
  return data;
}

export function mapPaymentOverview(
  overview: DashboardApiResponse['paymentOverview']
): { label: string; value: number }[] {
  if (!overview?.length) {
    return [{ label: 'No data', value: 1 }];
  }
  return overview.map((row) => ({
    label: `${row._id?.method || 'N/A'} (${row._id?.paymentStatus || ''})`,
    value: row.totalAmount || row.totalOrders || 0,
  }));
}

export function mapRecentOrders(rows: Record<string, unknown>[]) {
  return rows.map((r) => mapApiOrder(r));
}

export function pendingOrdersFromStats(orderStats: Record<string, number>): number {
  return Number(orderStats['placed'] || 0);
}
