import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { mapApiUser, mapApiUserDetail } from '../mappers/user.mapper';
import { User, UserDetail, UserStatus } from '../models/user.model';
import { ApiService } from './api.service';

export interface UsersQuery {
  search?: string;
  status?: UserStatus | 'all';
  page?: number;
  limit?: number;
}

interface UsersListResponse {
  data: Record<string, unknown>[];
  pagination: { page: number; limit: number; total: number };
}

interface UserDetailResponse {
  data: {
    user: Record<string, unknown>;
    stats: Record<string, unknown>;
  };
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  readonly users$ = new BehaviorSubject<User[]>([]);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly total$ = new BehaviorSubject<number>(0);
  readonly page$ = new BehaviorSubject<number>(1);

  constructor(private api: ApiService) {}

  load(query: UsersQuery = {}): Observable<void> {
    this.loading$.next(true);
    const params: Record<string, string> = {
      page: String(query.page ?? 1),
      limit: String(query.limit ?? 20),
    };
    if (query.search?.trim()) params['search'] = query.search.trim();
    if (query.status && query.status !== 'all') params['status'] = query.status;

    return this.api.get<UsersListResponse>('/api/admin/users', params).pipe(
      tap((res) => {
        const list = (res.data || []).map((r) => mapApiUser(r));
        this.users$.next(list);
        this.total$.next(res.pagination?.total ?? list.length);
        this.page$.next(res.pagination?.page ?? 1);
      }),
      catchError((err) => {
        this.users$.next([]);
        this.total$.next(0);
        return throwError(() => err);
      }),
      finalize(() => this.loading$.next(false)),
      map(() => undefined)
    );
  }

  getById(id: string): Observable<UserDetail> {
    return this.api.get<UserDetailResponse>(`/api/admin/users/${id}`).pipe(
      map((res) => mapApiUserDetail(res.data))
    );
  }

  toggleBlock(id: string, isBlocked: boolean): Observable<void> {
    return this.api.patch(`/api/admin/users/${id}/block`, { isBlocked }).pipe(map(() => undefined));
  }

  deleteUser(id: string): Observable<void> {
    return this.api.delete(`/api/admin/users/${id}`).pipe(map(() => undefined));
  }
}
