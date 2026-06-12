import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Partner, PartnerApprovalStatus, PartnerDetail, PartnerStatus } from '../../core/models/partner.model';
import { PartnersService } from '../../core/services/partners.service';
import { messageFromApiError } from '../../core/utils/api-error';
import { environment } from '../../../environments/environment';
import { Paginator } from '../../shared/utils/paginator';

@Component({
  selector: 'app-partners',
  templateUrl: './partners.page.html',
  styleUrls: ['./partners.page.scss'],
  standalone: false,
})
export class PartnersPage implements OnInit {
  readonly loading$ = this.partnersService.loading$;
  readonly paginator = new Paginator<Partner>(10);

  search = '';
  statusFilter: PartnerStatus | 'all' = 'all';
  approvalFilter: PartnerApprovalStatus | 'all' = 'all';
  filtered: Partner[] = [];

  drawerOpen = false;
  selected: PartnerDetail | null = null;
  drawerLoading = false;
  actionBusy = false;

  constructor(
    private partnersService: PartnersService,
    private alert: AlertController,
    private toast: ToastController
  ) {}

  get totalCount(): number {
    return this.partnersService.total$.value;
  }

  ngOnInit(): void {
    this.fetch();
    this.partnersService.partners$.subscribe((list) => {
      this.filtered = list;
      this.paginator.setServerPage(list, this.totalCount, this.partnersService.page$.value);
    });
  }

  fetch(): void {
    this.partnersService
      .load({
        search: this.search,
        status: this.statusFilter,
        approvalStatus: this.approvalFilter,
        page: this.paginator.page,
        limit: this.paginator.pageSize,
      })
      .subscribe();
  }

  onFilterChange(): void {
    this.paginator.resetPage();
    this.fetch();
  }

  onPageChange(page: number): void {
    this.paginator.goPage(page);
    this.fetch();
  }

  approvalColor(s: PartnerApprovalStatus): string {
    switch (s) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'danger';
      default:
        return 'medium';
    }
  }

  approvalLabel(s: PartnerApprovalStatus): string {
    if (s === 'APPROVED') return 'Approved';
    if (s === 'REJECTED') return 'Rejected';
    return 'Pending';
  }

  mediaUrl(path: string | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  openDrawer(p: Partner): void {
    this.drawerLoading = true;
    this.drawerOpen = true;
    this.selected = null;
    this.partnersService.getById(p.id).subscribe({
      next: (detail) => {
        this.selected = detail;
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

  async confirmApprove(p: Partner): Promise<void> {
    const a = await this.alert.create({
      header: 'Approve partner',
      message: `Approve ${p.name}? They will be notified and can sign in.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Approve',
          handler: () => {
            this.actionBusy = true;
            this.partnersService.approve(p.id).subscribe({
              next: async () => {
                this.actionBusy = false;
                const t = await this.toast.create({
                  message: 'Partner approved',
                  color: 'success',
                  duration: 2000,
                });
                await t.present();
                if (this.selected?.id === p.id) this.openDrawer(p);
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

  async openRejectAlert(p: Partner): Promise<void> {
    const a = await this.alert.create({
      header: 'Reject registration',
      message: 'Provide a clear reason (min. 10 characters). The partner will see this message.',
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
            this.partnersService.reject(p.id, reason).subscribe({
              next: async () => {
                this.actionBusy = false;
                const t = await this.toast.create({
                  message: 'Partner rejected',
                  color: 'success',
                  duration: 2000,
                });
                await t.present();
                if (this.selected?.id === p.id) this.openDrawer(p);
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

  async toggleStatus(partner: Partner): Promise<void> {
    const next = partner.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    this.partnersService.updateStatus(partner.id, next).subscribe({
      next: () => this.fetch(),
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
}
