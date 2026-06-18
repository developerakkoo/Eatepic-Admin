import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AdminSupportSocketService } from './admin-support-socket.service';

export interface AdminInboxItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  data?: { ticketId?: string; userId?: string };
  isRead: boolean;
  createdAt: string;
}

interface InboxResponse {
  data: AdminInboxItem[];
  unreadCount: number;
}

@Injectable({ providedIn: 'root' })
export class AdminInboxService {
  readonly unreadCount$ = new BehaviorSubject(0);
  readonly items$ = new BehaviorSubject<AdminInboxItem[]>([]);

  constructor(
    private api: ApiService,
    private supportSocket: AdminSupportSocketService
  ) {
    this.supportSocket.adminNotification$.subscribe((n) => {
      const item = n as unknown as AdminInboxItem;
      if (item._id) {
        this.items$.next([item, ...this.items$.value]);
        if (!item.isRead) {
          this.unreadCount$.next(this.unreadCount$.value + 1);
        }
      }
    });
  }

  load() {
    return this.api.get<InboxResponse>('/api/admin/notifications/inbox').pipe(
      tap((res) => {
        this.items$.next(res.data ?? []);
        this.unreadCount$.next(res.unreadCount ?? 0);
      })
    );
  }

  markRead(id: string) {
    return this.api.patch(`/api/admin/notifications/inbox/${id}/read`, {}).pipe(
      tap(() => {
        this.items$.next(
          this.items$.value.map((item) =>
            item._id === id ? { ...item, isRead: true } : item
          )
        );
        this.unreadCount$.next(Math.max(0, this.unreadCount$.value - 1));
      })
    );
  }

  refreshUnread(): void {
    this.load().subscribe();
  }
}
