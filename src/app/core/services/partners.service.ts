import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { mapApiKitchen, uiPartnerStatusToApi } from '../mappers/kitchen.mapper';
import { Partner, PartnerStatus } from '../models/partner.model';
import { ApiService } from './api.service';

export interface PartnersQuery {
  search?: string;
  status?: PartnerStatus | 'all';
  page?: number;
  limit?: number;
}

interface KitchenListResponse {
  data: Record<string, unknown>[];
  pagination: { page: number; limit: number; total: number };
}

@Injectable({ providedIn: 'root' })
export class PartnersService {
  readonly partners$ = new BehaviorSubject<Partner[]>([]);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly total$ = new BehaviorSubject<number>(0);
  readonly page$ = new BehaviorSubject<number>(1);

  constructor(private api: ApiService) {}

  load(query: PartnersQuery = {}): Observable<void> {
    this.loading$.next(true);
    const params: Record<string, string> = {
      page: String(query.page ?? 1),
      limit: String(query.limit ?? 20),
    };
    if (query.search?.trim()) params['search'] = query.search.trim();
    Object.assign(params, uiPartnerStatusToApi(query.status ?? 'all'));

    return this.api.get<KitchenListResponse>('/api/admin/kitchens', params).pipe(
      tap((res) => {
        const list = (res.data || []).map((row) => mapApiKitchen(row));
        this.partners$.next(list);
        this.total$.next(res.pagination?.total ?? list.length);
        this.page$.next(res.pagination?.page ?? 1);
      }),
      catchError(() => {
        this.partners$.next([]);
        this.total$.next(0);
        return of(undefined);
      }),
      finalize(() => this.loading$.next(false)),
      map(() => undefined)
    );
  }

  getById(id: string): Observable<Partner & { raw?: Record<string, unknown> }> {
    return this.api
      .get<{ data: Record<string, unknown> }>(`/api/admin/kitchens/${id}`)
      .pipe(
        map((res) => ({
          ...mapApiKitchen({ ...res.data, stats: res.data['stats'] }),
          raw: res.data,
        }))
      );
  }

  updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Observable<void> {
    return this.api.put(`/api/admin/kitchen/status/${id}`, { status }).pipe(map(() => undefined));
  }
}
