import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

export type DriverStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';

export interface AdminDriverListItem {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  address: string;
  status: DriverStatus;
  isOnline: boolean;
  isAvailable: boolean;
  createdAt?: string;
  rejectionReason?: string;
}

export interface AdminDriverDetail extends AdminDriverListItem {
  profileImage?: string;
  vehicle?: Record<string, unknown>;
  documents?: Record<string, unknown>;
  reviewedAt?: string;
  reviewedBy?: { name?: string; email?: string };
  deletedAt?: string | null;
}

interface DriversListResponse {
  data: Record<string, unknown>[];
  pagination: { page: number; limit: number; total: number };
}

export interface DriversQuery {
  search?: string;
  status?: DriverStatus | 'all';
  page?: number;
  limit?: number;
}

function mapListRow(row: Record<string, unknown>): AdminDriverListItem {
  return {
    id: String(row['_id'] ?? ''),
    fullName: String(row['fullName'] ?? ''),
    email: String(row['email'] ?? ''),
    mobileNumber: String(row['mobileNumber'] ?? ''),
    address: String(row['address'] ?? ''),
    status: (row['status'] as DriverStatus) || 'PENDING',
    isOnline: Boolean(row['isOnline']),
    isAvailable: Boolean(row['isAvailable']),
    createdAt: row['createdAt'] ? String(row['createdAt']) : undefined,
    rejectionReason: row['rejectionReason'] ? String(row['rejectionReason']) : undefined,
  };
}

function mapDetail(row: Record<string, unknown>): AdminDriverDetail {
  const base = mapListRow(row);
  const reviewedBy = row['reviewedBy'] as Record<string, unknown> | undefined;
  return {
    ...base,
    profileImage: row['profileImage'] ? String(row['profileImage']) : undefined,
    vehicle: (row['vehicle'] as Record<string, unknown>) || undefined,
    documents: (row['documents'] as Record<string, unknown>) || undefined,
    reviewedAt: row['reviewedAt'] ? String(row['reviewedAt']) : undefined,
    reviewedBy: reviewedBy
      ? { name: String(reviewedBy['name'] ?? ''), email: String(reviewedBy['email'] ?? '') }
      : undefined,
    deletedAt: row['deletedAt'] ? String(row['deletedAt']) : null,
  };
}

@Injectable({ providedIn: 'root' })
export class DriversService {
  readonly drivers$ = new BehaviorSubject<AdminDriverListItem[]>([]);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly total$ = new BehaviorSubject<number>(0);
  readonly page$ = new BehaviorSubject<number>(1);

  constructor(private api: ApiService) {}

  load(query: DriversQuery = {}): Observable<void> {
    this.loading$.next(true);
    const params: Record<string, string> = {
      page: String(query.page ?? 1),
      limit: String(query.limit ?? 20),
    };
    if (query.search?.trim()) params['search'] = query.search.trim();
    if (query.status && query.status !== 'all') params['status'] = query.status;

    return this.api.get<DriversListResponse>('/api/admin/drivers', params).pipe(
      tap((res) => {
        const list = (res.data || []).map((r) => mapListRow(r));
        this.drivers$.next(list);
        this.total$.next(res.pagination?.total ?? list.length);
        this.page$.next(res.pagination?.page ?? 1);
      }),
      catchError((err) => {
        this.drivers$.next([]);
        this.total$.next(0);
        return throwError(() => err);
      }),
      finalize(() => this.loading$.next(false)),
      map(() => undefined)
    );
  }

  getById(id: string): Observable<AdminDriverDetail> {
    return this.api
      .get<{ data: Record<string, unknown> }>(`/api/admin/drivers/${id}`)
      .pipe(map((res) => mapDetail(res.data)));
  }

  update(
    id: string,
    body: Partial<{
      fullName: string;
      mobileNumber: string;
      address: string;
      profileImage: string;
      vehicle: Record<string, unknown>;
      documents: Record<string, unknown>;
      status: 'BLOCKED';
    }>
  ): Observable<AdminDriverDetail> {
    return this.api.patch<{ data: Record<string, unknown> }>(`/api/admin/drivers/${id}`, body).pipe(
      map((res) => mapDetail(res.data))
    );
  }

  approve(id: string): Observable<AdminDriverDetail> {
    return this.api.post<{ data: Record<string, unknown> }>(`/api/admin/drivers/${id}/approve`, {}).pipe(
      map((res) => mapDetail(res.data))
    );
  }

  reject(id: string, reason: string): Observable<AdminDriverDetail> {
    return this.api.post<{ data: Record<string, unknown> }>(`/api/admin/drivers/${id}/reject`, { reason }).pipe(
      map((res) => mapDetail(res.data))
    );
  }

  delete(id: string): Observable<void> {
    return this.api.delete(`/api/admin/drivers/${id}`).pipe(map(() => undefined));
  }
}
