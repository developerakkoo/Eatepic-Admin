import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { SupportTicket, SupportService } from './support.service';

@Injectable({ providedIn: 'root' })
export class AdminSupportSocketService implements OnDestroy {
  private socket: Socket | null = null;

  readonly supportMessage$ = new Subject<Record<string, unknown>>();
  readonly ticketUpdated$ = new Subject<SupportTicket>();
  readonly userPresence$ = new Subject<{
    userId: string;
    isOnline: boolean;
    lastSeenAt?: string;
  }>();
  readonly adminNotification$ = new Subject<Record<string, unknown>>();

  constructor(
    private auth: AuthService,
    private supportService: SupportService
  ) {
    if (this.auth.getToken()) {
      this.connect();
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  connect(): void {
    const token = this.auth.getToken();
    if (!token || this.socket?.connected) return;

    this.socket = io(environment.apiBaseUrl, {
      auth: { token, role: 'ADMIN' },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    const joinSupport = () => {
      this.socket?.emit('join_support_admin', {}, () => undefined);
    };

    this.socket.on('connect', joinSupport);
    this.socket.on('support_message', (payload: Record<string, unknown>) => {
      this.supportMessage$.next(payload);
    });
    this.socket.on('support_ticket_updated', (payload: SupportTicket) => {
      this.supportService.upsertTicket(payload);
      this.ticketUpdated$.next(payload);
    });
    this.socket.on(
      'support_user_presence',
      (payload: { userId: string; isOnline: boolean; lastSeenAt?: string }) => {
        this.userPresence$.next(payload);
      }
    );
    this.socket.on('admin_notification', (payload: Record<string, unknown>) => {
      this.adminNotification$.next(payload);
    });

    if (this.socket.connected) joinSupport();
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinTicket(ticketId: string): void {
    this.socket?.emit('join_support_ticket', ticketId, () => undefined);
  }

  leaveTicket(ticketId: string): void {
    this.socket?.emit('leave_support_ticket', ticketId);
  }

  sendMessage(ticketId: string, body: string): void {
    this.socket?.emit('support_send_message', { ticketId, body }, () => undefined);
  }

  emitTyping(ticketId: string, isTyping: boolean): void {
    this.socket?.emit('support_typing', { ticketId, isTyping });
  }

  markRead(ticketId: string): void {
    this.socket?.emit('support_mark_read', { ticketId }, () => undefined);
  }
}
