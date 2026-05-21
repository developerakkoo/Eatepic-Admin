import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Partner, PartnerStatus } from '../../core/models/partner.model';
import { PartnersService } from '../../core/services/partners.service';
import { messageFromApiError } from '../../core/utils/api-error';
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
  filtered: Partner[] = [];

  constructor(
    private partnersService: PartnersService,
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
