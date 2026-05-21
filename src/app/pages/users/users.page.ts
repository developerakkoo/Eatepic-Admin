import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { User, UserDetail, UserStatus } from '../../core/models/user.model';
import { UsersService } from '../../core/services/users.service';
import { messageFromApiError } from '../../core/utils/api-error';
import { Paginator } from '../../shared/utils/paginator';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: false,
})
export class UsersPage implements OnInit {
  readonly loading$ = this.usersService.loading$;
  readonly paginator = new Paginator<User>(10);

  search = '';
  statusFilter: UserStatus | 'all' = 'all';
  filtered: User[] = [];

  drawerOpen = false;
  selected: UserDetail | null = null;
  drawerLoading = false;

  constructor(
    private usersService: UsersService,
    private alert: AlertController,
    private toast: ToastController
  ) {}

  get totalCount(): number {
    return this.usersService.total$.value;
  }

  ngOnInit(): void {
    this.fetch();
    this.usersService.users$.subscribe((list) => {
      this.filtered = list;
      this.paginator.setServerPage(list, this.totalCount, this.usersService.page$.value);
    });
    this.usersService.total$.subscribe((total) => {
      this.paginator.setServerPage(this.filtered, total, this.usersService.page$.value);
    });
  }

  fetch(): void {
    this.usersService
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

  openDrawer(u: User): void {
    this.drawerLoading = true;
    this.drawerOpen = true;
    this.selected = null;
    this.usersService.getById(u.id).subscribe({
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

  onRowStatusChange(u: User, event: CustomEvent<{ checked: boolean }>): void {
    const wantActive = event.detail.checked;
    const wantBlocked = !wantActive;
    if ((u.status === 'blocked') === wantBlocked) return;
    this.applyBlock(u, wantBlocked);
  }

  onDrawerStatusChange(event: CustomEvent<{ checked: boolean }>): void {
    if (!this.selected) return;
    const wantActive = event.detail.checked;
    const wantBlocked = !wantActive;
    if ((this.selected.status === 'blocked') === wantBlocked) return;
    this.applyBlock(this.selected, wantBlocked);
  }

  private applyBlock(u: User, isBlocked: boolean): void {
    this.usersService.toggleBlock(u.id, isBlocked).subscribe({
      next: async () => {
        u.status = isBlocked ? 'blocked' : 'active';
        if (this.selected?.id === u.id) {
          this.selected.status = u.status;
        }
        const t = await this.toast.create({
          message: isBlocked ? 'User blocked' : 'User unblocked',
          color: 'success',
          duration: 2000,
        });
        await t.present();
        this.fetch();
      },
      error: async (err) => {
        const t = await this.toast.create({
          message: messageFromApiError(err),
          color: 'danger',
          duration: 2500,
        });
        await t.present();
        this.fetch();
      },
    });
  }

  async confirmDelete(u: User): Promise<void> {
    const a = await this.alert.create({
      header: 'Delete User',
      message: `Delete ${u.name}? This cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.usersService.deleteUser(u.id).subscribe({
              next: async () => {
                if (this.selected?.id === u.id) this.closeDrawer();
                const t = await this.toast.create({
                  message: 'User deleted',
                  duration: 2000,
                  color: 'success',
                });
                await t.present();
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
          },
        },
      ],
    });
    await a.present();
  }
}
