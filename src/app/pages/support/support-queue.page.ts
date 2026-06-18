import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AdminInboxService } from '../../core/services/admin-inbox.service';
import { AdminSupportSocketService } from '../../core/services/admin-support-socket.service';
import { SupportService, SupportTicket } from '../../core/services/support.service';
import { messageFromApiError } from '../../core/utils/api-error';
import { Paginator } from '../../shared/utils/paginator';

@Component({
  selector: 'app-support-queue',
  templateUrl: './support-queue.page.html',
  styleUrls: ['./support-queue.page.scss'],
  standalone: false,
})
export class SupportQueuePage implements OnInit, OnDestroy {
  readonly loading$ = this.supportService.loading$;
  readonly paginator = new Paginator<SupportTicket>(15);

  search = '';
  statusFilter = 'open';
  tickets: SupportTicket[] = [];
  presenceMap: Record<string, { isOnline?: boolean; lastSeenAt?: string }> = {};

  private subs = new Subscription();

  constructor(
    private supportService: SupportService,
    private supportSocket: AdminSupportSocketService,
    private inbox: AdminInboxService,
    private router: Router,
    private toast: ToastController
  ) {}

  get totalCount(): number {
    return this.supportService.total$.value;
  }

  ngOnInit(): void {
    this.supportSocket.connect();
    this.inbox.load().subscribe();
    this.fetch();

    this.subs.add(
      this.supportService.tickets$.subscribe((list) => {
        this.tickets = list;
        this.paginator.setServerPage(list, this.supportService.total$.value, this.supportService.page$.value);
      })
    );

    this.subs.add(
      this.supportSocket.userPresence$.subscribe((p) => {
        this.presenceMap[p.userId] = {
          isOnline: p.isOnline,
          lastSeenAt: p.lastSeenAt,
        };
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  fetch(): void {
    this.supportService
      .load({
        search: this.search,
        status: this.statusFilter,
        page: this.paginator.page,
        limit: this.paginator.pageSize,
      })
      .subscribe({
        error: async (err) => {
          const t = await this.toast.create({
            message: messageFromApiError(err),
            color: 'danger',
            duration: 3500,
          });
          await t.present();
        },
      });
  }

  onFilterChange(): void {
    this.paginator.resetPage();
    this.fetch();
  }

  onPageChange(page: number): void {
    this.paginator.goPage(page);
    this.fetch();
  }

  openTicket(ticket: SupportTicket): void {
    this.router.navigate(['/admin/support', ticket._id]);
  }

  userName(ticket: SupportTicket): string {
    return ticket.user?.fullName || 'User';
  }

  isOnline(ticket: SupportTicket): boolean {
    const userId = ticket.user?.id || ticket.userId;
    if (!userId) return false;
    const fromTicket = ticket.user?.supportPresence?.isOnline;
    if (fromTicket !== undefined) return !!fromTicket;
    return !!this.presenceMap[String(userId)]?.isOnline;
  }

  lastSeen(ticket: SupportTicket): string {
    const userId = ticket.user?.id || ticket.userId;
    const seen =
      ticket.user?.supportPresence?.lastSeenAt ||
      (userId ? this.presenceMap[String(userId)]?.lastSeenAt : undefined);
    if (!seen) return 'Unknown';
    return new Date(seen).toLocaleString();
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }
}
