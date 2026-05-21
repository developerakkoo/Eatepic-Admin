import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, of, tap } from 'rxjs';
import { ChartDataPoint, StatCard } from '../models/dashboard.model';
import { Order } from '../models/order.model';
import {
  DashboardApiResponse,
  mapDashboardStats,
  mapPaymentOverview,
  mapRecentOrders,
  mapRecentSales,
  pendingOrdersFromStats,
} from '../mappers/dashboard.mapper';
import { ApiService } from './api.service';
import { UiStateService } from './ui-state.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  readonly stats$ = new BehaviorSubject<StatCard[]>([]);
  readonly ordersChart$ = new BehaviorSubject<ChartDataPoint[]>([]);
  readonly revenueBreakdown$ = new BehaviorSubject<{ label: string; value: number }[]>([]);
  readonly recentOrders$ = new BehaviorSubject<Order[]>([]);
  readonly loading$ = new BehaviorSubject<boolean>(true);
  readonly chartRange$ = new BehaviorSubject<'7' | '30' | '90'>('7');

  private lastPayload: DashboardApiResponse | null = null;

  constructor(
    private api: ApiService,
    private ui: UiStateService
  ) {
    this.load();
  }

  setChartRange(range: '7' | '30' | '90'): void {
    this.chartRange$.next(range);
    if (this.lastPayload) {
      this.ordersChart$.next(mapRecentSales(this.lastPayload.recentSales, range));
    }
  }

  load(): void {
    this.loading$.next(true);
    this.api
      .get<DashboardApiResponse>('/api/admin/dashboard')
      .pipe(
        tap((data) => {
          this.lastPayload = data;
          this.stats$.next(mapDashboardStats(data));
          this.revenueBreakdown$.next(mapPaymentOverview(data.paymentOverview));
          this.recentOrders$.next(mapRecentOrders(data.recentOrders || []));
          this.ordersChart$.next(mapRecentSales(data.recentSales, this.chartRange$.value));
          this.ui.setPendingOrdersCount(pendingOrdersFromStats(data.orderStats || {}));
        }),
        catchError(() => {
          this.stats$.next([]);
          this.recentOrders$.next([]);
          return of(null);
        }),
        finalize(() => this.loading$.next(false))
      )
      .subscribe();
  }
}
