import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { mapApiSubscription } from '../mappers/subscription.mapper';
import { SubStatus, Subscription } from '../models/subscription.model';
import { ApiService } from './api.service';

export interface SubscriptionStats {
  active: number;
  expiring: number;
  revenue: number;
}

export interface SubscriptionAnalytics {
  activeSubscriptions: number;
  newSubscriptions: number;
  churnRate: number;
  gmv: number;
  mrr: number;
  arr: number;
  commissionRevenue: number;
  settlementPending: number;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  readonly subscriptions$ = new BehaviorSubject<Subscription[]>([]);
  readonly stats$ = new BehaviorSubject<SubscriptionStats>({ active: 0, expiring: 0, revenue: 0 });
  readonly analytics$ = new BehaviorSubject<SubscriptionAnalytics | null>(null);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly total$ = new BehaviorSubject<number>(0);
  readonly page$ = new BehaviorSubject<number>(1);

  constructor(private api: ApiService) {}

  loadStats(): void {
    this.api
      .get<{ data: SubscriptionStats }>('/api/admin/subscriptions/stats')
      .pipe(
        tap((res) => this.stats$.next(res.data)),
        catchError(() => of(null))
      )
      .subscribe();
    this.api
      .get<{ data: SubscriptionAnalytics }>('/api/admin/subscriptions/analytics')
      .pipe(
        tap((res) => this.analytics$.next(res.data)),
        catchError(() => of(null))
      )
      .subscribe();
  }

  load(query: { search?: string; status?: string; page?: number; limit?: number } = {}): Observable<void> {
    this.loading$.next(true);
    const params: Record<string, string> = {
      page: String(query.page ?? 1),
      limit: String(query.limit ?? 20),
    };
    if (query.search?.trim()) params['search'] = query.search.trim();
    if (query.status && query.status !== 'all') params['status'] = query.status.toUpperCase();

    return this.api
      .get<{ data: Record<string, unknown>[]; pagination: { total: number; page: number } }>(
        '/api/admin/subscriptions',
        params
      )
      .pipe(
        tap((res) => {
          this.subscriptions$.next((res.data || []).map((r) => mapApiSubscription(r)));
          this.total$.next(res.pagination?.total ?? 0);
          this.page$.next(res.pagination?.page ?? 1);
        }),
        catchError(() => {
          this.subscriptions$.next([]);
          return of(undefined);
        }),
        finalize(() => this.loading$.next(false)),
        map(() => undefined)
      );
  }

  updateStatus(id: string, status: SubStatus): Observable<void> {
    const apiStatus =
      status === 'paused' ? 'PAUSED' : status === 'expired' ? 'CANCELLED' : 'ACTIVE';
    return this.api
      .patch(`/api/admin/subscriptions/${id}/status`, { status: apiStatus })
      .pipe(map(() => undefined));
  }

  getById(id: string): Observable<{ subscription: Record<string, unknown>; deliveries: Record<string, unknown>[] }> {
    return this.api.get<{ data: { subscription: Record<string, unknown>; deliveries: Record<string, unknown>[] } }>(
      `/api/admin/subscriptions/${id}`
    ).pipe(map((res) => res.data));
  }

  patchSubscriptionDelivery(
    subscriptionId: string,
    deliveryId: string,
    body: { deliveryBoyId?: string | null; status?: 'SKIPPED'; skipReason?: string; unlinkOrder?: boolean }
  ): Observable<Record<string, unknown>> {
    return this.api
      .patch<{ data: Record<string, unknown> }>(
        `/api/admin/subscriptions/${subscriptionId}/deliveries/${deliveryId}`,
        body
      )
      .pipe(map((res) => res.data));
  }
}
