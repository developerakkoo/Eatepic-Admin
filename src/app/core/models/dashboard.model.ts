export interface StatCard {
  label: string;
  value: string | number;
  trend: number;
  trendUp: boolean;
  icon: string;
  color: 'green' | 'amber' | 'purple' | 'blue';
}

export interface ChartDataPoint {
  label: string;
  value: number;
}
