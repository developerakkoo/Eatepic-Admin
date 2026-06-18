import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadByAdmin: number;
  unreadByUser: number;
  user?: {
    id: string;
    fullName?: string;
    mobileNumber?: string;
    email?: string;
    supportPresence?: { isOnline?: boolean; lastSeenAt?: string };
  };
  userId?: string;
  rating?: { score?: number; comment?: string };
}

interface ListResponse {
  data: SupportTicket[];
  pagination: { page: number; limit: number; total: number };
}

interface DetailResponse {
  data: SupportTicket;
}

interface MessagesResponse {
  data: Record<string, unknown>[];
}

@Injectable({ providedIn: 'root' })
export class SupportService {
  readonly tickets$ = new BehaviorSubject<SupportTicket[]>([]);
  readonly loading$ = new BehaviorSubject(false);
  readonly total$ = new BehaviorSubject(0);
  readonly page$ = new BehaviorSubject(1);

  constructor(private api: ApiService) {}

  load(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    assigned?: string;
  }) {
    this.loading$.next(true);
    const query: Record<string, string> = {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    };
    if (params.status) query['status'] = params.status;
    if (params.search) query['search'] = params.search;
    if (params.assigned) query['assigned'] = params.assigned;

    return this.api.get<ListResponse>('/api/admin/support/tickets', query).pipe(
      tap((res) => {
        this.tickets$.next(res.data ?? []);
        this.total$.next(res.pagination?.total ?? 0);
        this.page$.next(res.pagination?.page ?? 1);
        this.loading$.next(false);
      })
    );
  }

  getById(id: string) {
    return this.api.get<DetailResponse>(`/api/admin/support/tickets/${id}`);
  }

  getMessages(id: string, before?: string) {
    const params: Record<string, string> = {};
    if (before) params['before'] = before;
    return this.api.get<MessagesResponse>(`/api/admin/support/tickets/${id}/messages`, params);
  }

  sendMessage(id: string, body: string) {
    return this.api.post(`/api/admin/support/tickets/${id}/messages`, { body });
  }

  assign(id: string) {
    return this.api.patch(`/api/admin/support/tickets/${id}/assign`, {});
  }

  requestRating(id: string) {
    return this.api.post(`/api/admin/support/tickets/${id}/request-rating`, {});
  }

  close(id: string) {
    return this.api.patch(`/api/admin/support/tickets/${id}/close`, {});
  }

  markRead(id: string) {
    return this.api.patch(`/api/admin/support/tickets/${id}/read`, {});
  }

  upsertTicket(ticket: SupportTicket): void {
    const list = [...this.tickets$.value];
    const idx = list.findIndex((t) => t._id === ticket._id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...ticket };
    } else {
      list.unshift(ticket);
    }
    list.sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
    this.tickets$.next(list);
  }
}
