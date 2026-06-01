import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Subscription, SubStatus } from '../../core/models/subscription.model';
import { SubscriptionsService } from '../../core/services/subscriptions.service';
import { messageFromApiError } from '../../core/utils/api-error';
import { Paginator } from '../../shared/utils/paginator';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.page.html',
  styleUrls: ['./subscriptions.page.scss'],
  standalone: false,
})
export class SubscriptionsPage implements OnInit {
  readonly subs$ = this.subsService.subscriptions$;
  readonly loading$ = this.subsService.loading$;
  readonly stats$ = this.subsService.stats$;
  readonly paginator = new Paginator<Subscription>(10);

  search = '';
  planFilter = 'all';
  statusFilter = 'all';
  drawerOpen = false;
  selected: Subscription | null = null;
  filtered: Subscription[] = [];
  drawerLoading = false;
  drawerDetail: Record<string, unknown> | null = null;
  drawerDeliveries: Record<string, unknown>[] = [];
  driverDraft: Record<string, string> = {};

  constructor(
    readonly subsService: SubscriptionsService,
    private toast: ToastController
  ) {}

  ngOnInit(): void {
    this.subsService.loadStats();
    this.fetch();
    this.subs$.subscribe((list) => {
      this.filtered = list;
      this.paginator.setServerPage(
        list,
        this.subsService.total$.value,
        this.subsService.page$.value
      );
    });
    this.subsService.total$.subscribe((total) => {
      this.paginator.setServerPage(this.filtered, total, this.subsService.page$.value);
    });
  }

  fetch(): void {
    const statusMap: Record<string, string> = {
      active: 'ACTIVE',
      paused: 'PAUSED',
      expired: 'CANCELLED',
    };
    this.subsService
      .load({
        search: this.search,
        status: this.statusFilter === 'all' ? undefined : statusMap[this.statusFilter],
        page: this.paginator.page,
        limit: this.paginator.pageSize,
      })
      .subscribe();
  }

  openDrawer(s: Subscription): void {
    this.selected = s;
    this.drawerOpen = true;
    this.drawerDetail = null;
    this.drawerDeliveries = [];
    this.drawerLoading = true;
    this.subsService.getById(s.id).subscribe({
      next: (data) => {
        this.drawerDetail = data.subscription;
        this.drawerDeliveries = data.deliveries || [];
        this.driverDraft = {};
        for (const d of this.drawerDeliveries) {
          const id = String(d['_id'] ?? '');
          if (!id) continue;
          const agent = d['deliveryBoyId'];
          if (agent && typeof agent === 'object' && '_id' in agent) {
            this.driverDraft[id] = String((agent as Record<string, unknown>)['_id']);
          } else {
            this.driverDraft[id] = '';
          }
        }
        this.drawerLoading = false;
      },
      error: async () => {
        this.drawerLoading = false;
        const t = await this.toast.create({
          message: 'Could not load subscription deliveries',
          color: 'danger',
          duration: 2500,
        });
        await t.present();
      },
    });
  }

  deliveryRowId(d: Record<string, unknown>): string {
    return String(d['_id'] ?? '');
  }

  /** Normalizes API payload for Angular `DatePipe` (strict templates reject `unknown`). */
  deliveryDateForPipe(
    d: Record<string, unknown>
  ): string | number | Date | null | undefined {
    const v = d['deliveryDate'];
    if (v === null || v === undefined) return v;
    if (typeof v === 'string' || typeof v === 'number' || v instanceof Date)
      return v;
    return null;
  }

  toggleRenew(s: Subscription): void {
    const next: SubStatus = s.autoRenew ? 'paused' : 'active';
    this.subsService.updateStatus(s.id, next).subscribe({
      next: () => {
        s.autoRenew = !s.autoRenew;
        s.status = next;
        this.fetch();
      },
      error: async (err) => {
        const t = await this.toast.create({
          message: messageFromApiError(err),
          color: 'danger',
          duration: 2500,
        });
        await t.present();
      },
    });
  }

  orderIdForRow(d: Record<string, unknown>): string {
    const o = d['linkedOrderId'];
    if (!o || typeof o !== 'object') return '';
    return String((o as Record<string, unknown>)['_id'] ?? '');
  }

  applyDriver(d: Record<string, unknown>): void {
    const subId = String(this.selected?.id ?? '');
    const delId = String(d['_id'] ?? '');
    if (!subId || !delId) return;
    const trimmed = (this.driverDraft[delId] ?? '').trim();
    const body =
      trimmed === '' ? { deliveryBoyId: null } : { deliveryBoyId: trimmed };
    this.subsService.patchSubscriptionDelivery(subId, delId, body).subscribe({
      next: (updated) => Object.assign(d, updated),
      error: async (err) => {
        const t = await this.toast.create({
          message: messageFromApiError(err),
          color: 'danger',
          duration: 2500,
        });
        await t.present();
      },
    });
  }

  skipDelivery(d: Record<string, unknown>, reason?: string): void {
    const subId = String(this.selected?.id ?? '');
    const delId = String(d['_id'] ?? '');
    if (!subId || !delId) return;
    this.subsService
      .patchSubscriptionDelivery(subId, delId, {
        status: 'SKIPPED',
        skipReason: reason || 'Skipped by admin',
      })
      .subscribe({
        next: (updated) => Object.assign(d, updated),
        error: async (err) => {
          const t = await this.toast.create({
            message: messageFromApiError(err),
            color: 'danger',
            duration: 2500,
          });
          await t.present();
        },
      });
  }

  unlinkOrder(d: Record<string, unknown>): void {
    const subId = String(this.selected?.id ?? '');
    const delId = String(d['_id'] ?? '');
    if (!subId || !delId) return;
    this.subsService
      .patchSubscriptionDelivery(subId, delId, { unlinkOrder: true })
      .subscribe({
        next: (updated) => Object.assign(d, updated),
        error: async (err) => {
          const t = await this.toast.create({
            message: messageFromApiError(err),
            color: 'danger',
            duration: 2500,
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
}
