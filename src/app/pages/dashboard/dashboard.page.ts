import { Component, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { Order } from '../../core/models/order.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { Paginator } from '../../shared/utils/paginator';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit {
  readonly stats$ = this.dashboard.stats$;
  readonly recentOrders$ = this.dashboard.recentOrders$;
  readonly loading$ = this.dashboard.loading$;
  readonly chartRange$ = this.dashboard.chartRange$;
  readonly recentPaginator = new Paginator<Order>(8);

  lineChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
    },
  };

  doughnutData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  constructor(private dashboard: DashboardService) {}

  ngOnInit(): void {
    this.dashboard.ordersChart$.subscribe((points) => {
      this.lineChartData = {
        labels: points.map((p) => p.label),
        datasets: [
          {
            data: points.map((p) => p.value),
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22, 163, 74, 0.15)',
            fill: true,
            tension: 0.4,
          },
        ],
      };
    });

    this.dashboard.revenueBreakdown$.subscribe((items) => {
      this.doughnutData = {
        labels: items.map((i) => i.label),
        datasets: [
          {
            data: items.map((i) => i.value),
            backgroundColor: ['#16a34a', '#f59e0b', '#dc2626'],
          },
        ],
      };
    });

    this.recentOrders$.subscribe((orders) => {
      this.recentPaginator.setSource(orders);
    });
  }

  setRange(range: '7' | '30' | '90'): void {
    this.dashboard.setChartRange(range);
  }

  onRecentPageChange(page: number): void {
    this.recentPaginator.goPage(page);
    const orders = this.dashboard.recentOrders$.value;
    this.recentPaginator.setSource(orders);
  }
}
