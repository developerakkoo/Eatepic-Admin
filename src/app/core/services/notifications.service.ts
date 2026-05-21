import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  audience: string;
  sentAt: string;
  isRead: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  readonly notifications$ = new BehaviorSubject<AdminNotification[]>([]);
  readonly loading$ = new BehaviorSubject<boolean>(false);

  constructor(private api: ApiService) {}

  load(): Observable<void> {
    this.loading$.next(true);
    return this.api
      .get<{ data: Record<string, unknown>[] }>('/api/admin/notifications', { limit: '50' })
      .pipe(
        tap((res) => {
          const list = (res.data || []).map((n) => this.map(n));
          this.notifications$.next(list);
        }),
        catchError(() => {
          this.notifications$.next([]);
          return of(undefined);
        }),
        finalize(() => this.loading$.next(false)),
        map(() => undefined)
      );
  }

  send(payload: { title: string; message: string; audience: string }): Observable<void> {
    return this.api.post('/api/admin/notifications', payload).pipe(
      tap(() => this.load().subscribe()),
      map(() => undefined)
    );
  }

  markRead(id: string): Observable<void> {
    return this.api.patch(`/api/admin/notifications/${id}/read`, {}).pipe(
      tap(() => this.load().subscribe()),
      map(() => undefined)
    );
  }

  delete(id: string): Observable<void> {
    return this.api.delete(`/api/admin/notifications/${id}`).pipe(
      tap(() => this.load().subscribe()),
      map(() => undefined)
    );
  }

  unreadCount(): number {
    return this.notifications$.value.filter((n) => !n.isRead).length;
  }

  private map(raw: Record<string, unknown>): AdminNotification {
    const sent = raw['sentAt'] || raw['createdAt'];
    return {
      id: String(raw['_id'] || ''),
      title: String(raw['title'] || ''),
      message: String(raw['message'] || ''),
      audience: String(raw['audience'] || 'all_users'),
      sentAt: sent ? new Date(String(sent)).toLocaleString('en-IN') : '',
      isRead: Boolean(raw['isRead']),
    };
  }
}
