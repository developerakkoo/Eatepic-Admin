import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Order, OrderStatus } from '../../core/models/order.model';
import { AdminOrderSocketService } from '../../core/services/admin-order-socket.service';
import { OrdersService } from '../../core/services/orders.service';
import { messageFromApiError } from '../../core/utils/api-error';
import { Paginator } from '../../shared/utils/paginator';

type SortKey = 'id' | 'amount' | 'date';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: false,
})
export class OrdersPage implements OnInit {
  readonly loading$ = this.ordersService.loading$;
  readonly paginator = new Paginator<Order>(10);

  search = '';
  statusFilter: OrderStatus | 'all' = 'all';
  dateFilter = 'today';
  sortKey: SortKey = 'date';
  sortDir: SortDir = 'desc';
  selected = new Set<string>();
  drawerOpen = false;
  selectedOrder: Order | null = null;
  drawerStatus: OrderStatus = 'pending';
  drivers: { id: string; fullName: string; mobileNumber: string }[] = [];
  selectedDriverId = '';

  statusChips: { value: OrderStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  filteredOrders: Order[] = [];

  constructor(
    private ordersService: OrdersService,
    private adminSocket: AdminOrderSocketService,
    private toast: ToastController
  ) {}

  get totalCount(): number {
    return this.ordersService.total$.value;
  }

  ngOnInit(): void {
    this.adminSocket.connect();
    this.adminSocket.orderUpdate$.subscribe(() => this.fetch());
    this.ordersService.listDrivers().subscribe({
      next: (list) => (this.drivers = list),
      error: () => {},
    });
    this.fetch();
    this.ordersService.orders$.subscribe((orders) => {
      this.applyClientSort(orders);
    });
  }

  private dateRange(): { dateFrom?: string; dateTo?: string } {
    const now = new Date();
    const start = new Date(now);
    if (this.dateFilter === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (this.dateFilter === 'week') {
      start.setDate(start.getDate() - 7);
    } else {
      return {};
    }
    return { dateFrom: start.toISOString(), dateTo: now.toISOString() };
  }

  fetch(): void {
    this.ordersService
      .load({
        search: this.search,
        status: this.statusFilter,
        page: this.paginator.page,
        limit: this.paginator.pageSize,
        ...this.dateRange(),
      })
      .subscribe();
    this.ordersService.total$.subscribe((total) => {
      this.paginator.setServerPage(this.filteredOrders, total, this.paginator.page);
    });
  }

  applyClientSort(orders: Order[]): void {
    let list = [...orders];
    list.sort((a, b) => {
      let cmp = 0;
      if (this.sortKey === 'amount') cmp = a.amount - b.amount;
      else if (this.sortKey === 'id') cmp = a.id.localeCompare(b.id);
      else cmp = a.date.localeCompare(b.date);
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
    this.filteredOrders = list;
    this.paginator.setServerPage(list, this.ordersService.total$.value, this.ordersService.page$.value);
  }

  onSearch(): void {
    this.paginator.resetPage();
    this.fetch();
  }

  setStatus(s: OrderStatus | 'all'): void {
    this.statusFilter = s;
    this.paginator.resetPage();
    this.fetch();
  }

  toggleSort(key: SortKey): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'desc';
    }
    this.applyClientSort(this.ordersService.orders$.value);
  }

  resetFilters(): void {
    this.search = '';
    this.statusFilter = 'all';
    this.dateFilter = 'today';
    this.paginator.resetPage();
    this.fetch();
  }

  onPageChange(page: number): void {
    this.paginator.goPage(page);
    this.fetch();
  }

  activeFilters(): string[] {
    const chips: string[] = [];
    if (this.statusFilter !== 'all') chips.push(`Status: ${this.statusFilter}`);
    if (this.search) chips.push(`Search: ${this.search}`);
    return chips;
  }

  toggleSelect(id: string): void {
    if (this.selected.has(id)) this.selected.delete(id);
    else this.selected.add(id);
  }

  toggleAll(): void {
    const items = this.paginator.items;
    if (this.selected.size === items.length && items.length > 0) {
      this.selected.clear();
    } else {
      items.forEach((o) => this.selected.add(o.id));
    }
  }

  openDrawer(order: Order): void {
    this.ordersService.getById(order.id).subscribe({
      next: (detail) => {
        this.selectedOrder = detail;
        this.drawerStatus = detail.status;
        this.drawerOpen = true;
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

  closeDrawer(): void {
    this.drawerOpen = false;
  }

  saveStatus(): void {
    if (!this.selectedOrder) return;
    this.ordersService.updateStatus(this.selectedOrder.id, this.drawerStatus).subscribe({
      next: async (updated) => {
        this.selectedOrder = updated;
        const t = await this.toast.create({ message: 'Status updated', duration: 2000, color: 'success' });
        await t.present();
        this.fetch();
        this.closeDrawer();
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

  assignDriver(auto = false): void {
    if (!this.selectedOrder || this.selectedOrder.selfDelivery) return;
    const body = auto
      ? { autoAssign: true }
      : { deliveryAgentId: this.selectedDriverId || null };
    this.ordersService.assignDriver(this.selectedOrder.id, body).subscribe({
      next: async () => {
        const t = await this.toast.create({ message: 'Driver assignment updated', color: 'success', duration: 2000 });
        await t.present();
        this.fetch();
      },
      error: async (err) => {
        const t = await this.toast.create({ message: messageFromApiError(err), color: 'danger', duration: 2500 });
        await t.present();
      },
    });
  }

  cancelOrder(): void {
    if (!this.selectedOrder) return;
    this.ordersService.cancelOrder(this.selectedOrder.id, 'Cancelled by admin').subscribe({
      next: async () => {
        const t = await this.toast.create({ message: 'Order cancelled', duration: 2000, color: 'success' });
        await t.present();
        this.fetch();
        this.closeDrawer();
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

  paymentLabel(p: string): string {
    return { upi: 'UPI', card: 'Card', cod: 'COD', wallet: 'Wallet' }[p] || p;
  }

  paymentIcon(p: string): string {
    return { upi: 'phone-portrait-outline', card: 'card-outline', cod: 'cash-outline', wallet: 'wallet-outline' }[p] || 'card-outline';
  }
}
