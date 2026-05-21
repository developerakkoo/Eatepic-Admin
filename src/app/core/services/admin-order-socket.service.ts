import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminOrderSocketService implements OnDestroy {
  private socket: Socket | null = null;
  readonly orderUpdate$ = new Subject<Record<string, unknown>>();

  constructor(private auth: AuthService) {}

  ngOnDestroy(): void {
    this.disconnect();
  }

  connect(): void {
    const token = this.auth.getToken();
    if (!token || this.socket?.connected) return;

    this.socket = io(environment.apiBaseUrl, {
      auth: { token, role: 'ADMIN' },
      transports: ['websocket', 'polling'],
    });

    const join = () => {
      this.socket?.emit('join_admin', {}, () => undefined);
    };

    this.socket.on('connect', join);
    this.socket.on('order_update', (payload: Record<string, unknown>) => {
      this.orderUpdate$.next(payload);
    });
    this.socket.on('new_order', (payload: Record<string, unknown>) => {
      this.orderUpdate$.next({ ...payload, type: 'ORDER_CREATED' });
    });

    if (this.socket.connected) join();
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
