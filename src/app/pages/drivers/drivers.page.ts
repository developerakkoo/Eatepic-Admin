import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import {
  AdminDriverDetail,
  AdminDriverListItem,
  DriverStatus,
  DriversService,
} from '../../core/services/drivers.service';
import { messageFromApiError } from '../../core/utils/api-error';
import { environment } from '../../../environments/environment';
import { Paginator } from '../../shared/utils/paginator';

@Component({
  selector: 'app-drivers',
  templateUrl: './drivers.page.html',
  styleUrls: ['./drivers.page.scss'],
  standalone: false,
})
export class DriversPage implements OnInit {
  readonly loading$ = this.driversService.loading$;
  readonly paginator = new Paginator<AdminDriverListItem>(20);

  search = '';
  statusFilter: DriverStatus | 'all' = 'all';
  filtered: AdminDriverListItem[] = [];

  drawerOpen = false;
  selected: AdminDriverDetail | null = null;
  drawerLoading = false;
  actionBusy = false;

  editFullName = '';
  editMobile = '';
  editAddress = '';

  constructor(
    private driversService: DriversService,
    private alert: AlertController,
    private toast: ToastController
  ) {}

  get totalCount(): number {
    return this.driversService.total$.value;
  }

  ngOnInit(): void {
    this.fetch();
    this.driversService.drivers$.subscribe((list) => {
      this.filtered = list;
      this.paginator.setServerPage(list, this.totalCount, this.driversService.page$.value);
    });
    this.driversService.total$.subscribe((total) => {
      this.paginator.setServerPage(this.filtered, total, this.driversService.page$.value);
    });
  }

  fetch(): void {
    this.driversService
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

  statusLabel(s: DriverStatus): string {
    return s;
  }

  statusColor(s: DriverStatus): string {
    switch (s) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'danger';
      case 'BLOCKED':
        return 'medium';
      default:
        return 'medium';
    }
  }

  openDrawer(d: AdminDriverListItem): void {
    this.drawerLoading = true;
    this.drawerOpen = true;
    this.selected = null;
    this.driversService.getById(d.id).subscribe({
      next: (detail) => {
        this.selected = detail;
        this.editFullName = detail.fullName;
        this.editMobile = detail.mobileNumber;
        this.editAddress = detail.address;
        this.drawerLoading = false;
      },
      error: async (err) => {
        this.drawerLoading = false;
        this.drawerOpen = false;
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
    this.selected = null;
  }

  mediaUrl(path: string | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  asString(value: unknown): string {
    return value != null && value !== undefined ? String(value) : '';
  }

  async confirmApprove(d: AdminDriverListItem): Promise<void> {
    const a = await this.alert.create({
      header: 'Approve driver',
      message: `Approve ${d.fullName}? They will be notified and can go online.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Approve',
          handler: () => {
            this.actionBusy = true;
            this.driversService.approve(d.id).subscribe({
              next: async () => {
                this.actionBusy = false;
                const t = await this.toast.create({
                  message: 'Driver approved',
                  color: 'success',
                  duration: 2000,
                });
                await t.present();
                if (this.selected?.id === d.id) this.openDrawer(d);
                this.fetch();
              },
              error: async (err) => {
                this.actionBusy = false;
                const t = await this.toast.create({
                  message: messageFromApiError(err),
                  color: 'danger',
                  duration: 3000,
                });
                await t.present();
              },
            });
          },
        },
      ],
    });
    await a.present();
  }

  async openRejectAlert(d: AdminDriverListItem): Promise<void> {
    const a = await this.alert.create({
      header: 'Reject registration',
      message: 'Provide a clear reason (min. 10 characters). The driver will see this message.',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Reason for rejection',
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          role: 'destructive',
          handler: (data) => {
            const reason = String(data?.['reason'] ?? '').trim();
            if (reason.length < 10) {
              void this.toast
                .create({
                  message: 'Reason must be at least 10 characters',
                  color: 'warning',
                  duration: 2500,
                })
                .then((t) => t.present());
              return false;
            }
            this.actionBusy = true;
            this.driversService.reject(d.id, reason).subscribe({
              next: async () => {
                this.actionBusy = false;
                const t = await this.toast.create({
                  message: 'Driver rejected',
                  color: 'success',
                  duration: 2000,
                });
                await t.present();
                if (this.selected?.id === d.id) this.openDrawer(d);
                this.fetch();
              },
              error: async (err) => {
                this.actionBusy = false;
                const t = await this.toast.create({
                  message: messageFromApiError(err),
                  color: 'danger',
                  duration: 3000,
                });
                await t.present();
              },
            });
            return true;
          },
        },
      ],
    });
    await a.present();
  }

  saveEdit(): void {
    if (!this.selected) return;
    this.actionBusy = true;
    this.driversService
      .update(this.selected.id, {
        fullName: this.editFullName.trim(),
        mobileNumber: this.editMobile.trim(),
        address: this.editAddress.trim(),
      })
      .subscribe({
        next: async (updated) => {
          this.actionBusy = false;
          this.selected = updated;
          const t = await this.toast.create({
            message: 'Driver updated',
            color: 'success',
            duration: 2000,
          });
          await t.present();
          this.fetch();
        },
        error: async (err) => {
          this.actionBusy = false;
          const t = await this.toast.create({
            message: messageFromApiError(err),
            color: 'danger',
            duration: 3000,
          });
          await t.present();
        },
      });
  }

  async confirmBlock(d: AdminDriverListItem): Promise<void> {
    const a = await this.alert.create({
      header: 'Block driver',
      message: `Block ${d.fullName}? They cannot accept deliveries.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Block',
          role: 'destructive',
          handler: () => {
            this.actionBusy = true;
            this.driversService.update(d.id, { status: 'BLOCKED' }).subscribe({
              next: async (updated) => {
                this.actionBusy = false;
                if (this.selected?.id === d.id) {
                  this.selected = updated;
                  this.editFullName = updated.fullName;
                  this.editMobile = updated.mobileNumber;
                  this.editAddress = updated.address;
                }
                const t = await this.toast.create({
                  message: 'Driver blocked',
                  color: 'success',
                  duration: 2000,
                });
                await t.present();
                this.fetch();
              },
              error: async (err) => {
                this.actionBusy = false;
                const t = await this.toast.create({
                  message: messageFromApiError(err),
                  color: 'danger',
                  duration: 3000,
                });
                await t.present();
              },
            });
          },
        },
      ],
    });
    await a.present();
  }

  async confirmArchive(d: AdminDriverListItem): Promise<void> {
    const a = await this.alert.create({
      header: 'Archive driver',
      message: `Archive ${d.fullName}? The account will be disabled and hidden from default lists.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Archive',
          handler: () => {
            this.actionBusy = true;
            this.driversService.delete(d.id).subscribe({
              next: async () => {
                this.actionBusy = false;
                if (this.selected?.id === d.id) this.closeDrawer();
                const t = await this.toast.create({
                  message: 'Driver archived',
                  color: 'success',
                  duration: 2000,
                });
                await t.present();
                this.fetch();
              },
              error: async (err) => {
                this.actionBusy = false;
                const t = await this.toast.create({
                  message: messageFromApiError(err),
                  color: 'danger',
                  duration: 3000,
                });
                await t.present();
              },
            });
          },
        },
      ],
    });
    await a.present();
  }
}
