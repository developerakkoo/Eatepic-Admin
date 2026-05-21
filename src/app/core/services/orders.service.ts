import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { mapApiOrder, uiStatusFilterToQuery, uiStatusToApi } from '../mappers/order.mapper';
import { Order, OrderStatus } from '../models/order.model';
import { ApiService } from './api.service';

export interface OrdersQuery {
  search?: string;
  status?: OrderStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

interface OrdersListResponse {
  data: Record<string, unknown>[];
  pagination: { page: number; limit: number; total: number };
}

interface OrderDetailResponse {
  data: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  readonly orders$ = new BehaviorSubject<Order[]>([]);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly total$ = new BehaviorSubject<number>(0);
  readonly page$ = new BehaviorSubject<number>(1);

  constructor(private api: ApiService) {}

  load(query: OrdersQuery = {}): Observable<void> {
    this.loading$.next(true);
    const params: Record<string, string> = {
      page: String(query.page ?? 1),
      limit: String(query.limit ?? 20),
    };
    if (query.search?.trim()) params['search'] = query.search.trim();
    if (query.dateFrom) params['dateFrom'] = query.dateFrom;
    if (query.dateTo) params['dateTo'] = query.dateTo;
    Object.assign(params, uiStatusFilterToQuery(query.status ?? 'all'));

    return this.api.get<OrdersListResponse>('/api/admin/orders', params).pipe(
      tap((res) => {
        const orders = (res.data || []).map((row) => mapApiOrder(row));
        this.orders$.next(orders);
        this.total$.next(res.pagination?.total ?? orders.length);
        this.page$.next(res.pagination?.page ?? 1);
      }),
      catchError(() => {
        this.orders$.next([]);
        this.total$.next(0);
        return of(undefined);
      }),
      finalize(() => this.loading$.next(false)),
      map(() => undefined)
    );
  }

  getById(id: string): Observable<Order> {
    return this.api.get<OrderDetailResponse>(`/api/admin/orders/${id}`).pipe(
      map((res) => mapApiOrder(res.data))
    );
  }

  updateStatus(id: string, status: OrderStatus): Observable<Order> {
    return this.api
      .patch<OrderDetailResponse>(`/api/admin/orders/${id}/status`, {
        status: uiStatusToApi(status),
      })
      .pipe(map((res) => mapApiOrder(res.data)));
  }

  cancelOrder(id: string, reason?: string): Observable<Order> {
    return this.api
      .patch<OrderDetailResponse>(`/api/admin/orders/${id}/cancel`, { reason })
      .pipe(map((res) => mapApiOrder(res.data)));
  }

  assignDriver(
    orderId: string,
    body: { deliveryAgentId?: string | null; autoAssign?: boolean }
  ): Observable<void> {
    return this.api.patch(`/api/admin/orders/${orderId}/assign-driver`, body).pipe(map(() => undefined));
  }

  listDrivers(): Observable<{ id: string; fullName: string; mobileNumber: string }[]> {
    return this.api
      .get<{ data: Record<string, unknown>[] }>('/api/admin/drivers', {
        status: 'APPROVED',
        limit: '200',
        page: '1',
      })
      .pipe(
        map((res) =>
          (res.data || []).map((d) => ({
            id: String(d['_id'] || ''),
            fullName: String(d['fullName'] || 'Driver'),
            mobileNumber: String(d['mobileNumber'] || ''),
          }))
        )
      );
  }
}
