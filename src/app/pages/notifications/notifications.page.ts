import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { AppNotification } from '../../core/models/notification.model';
import { NotificationsService } from '../../core/services/notifications.service';
import { messageFromApiError } from '../../core/utils/api-error';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: false,
})
export class NotificationsPage implements OnInit {
  readonly notifications$ = this.notificationsService.notifications$;
  readonly loading$ = this.notificationsService.loading$;
  tab: 'all' | 'unread' | 'sent' = 'all';
  modalOpen = false;
  scheduleEnabled = false;

  sendForm = this.fb.group({
    title: ['', Validators.required],
    message: ['', Validators.required],
    audience: ['all_users', Validators.required],
  });

  constructor(
    private notificationsService: NotificationsService,
    private fb: FormBuilder,
    private toast: ToastController
  ) {}

  ngOnInit(): void {
    this.notificationsService.load().subscribe();
  }

  toAppNotification(n: {
    id: string;
    title: string;
    message: string;
    audience: string;
    sentAt: string;
    isRead: boolean;
  }): AppNotification {
    return {
      id: n.id,
      type: 'system',
      title: n.title,
      message: n.message,
      timestamp: n.sentAt,
      audience: n.audience,
      read: n.isRead,
      sent: true,
    };
  }

  get filtered(): AppNotification[] {
    const list = this.notificationsService.notifications$.value.map((n) => this.toAppNotification(n));
    if (this.tab === 'unread') return list.filter((n) => !n.read);
    if (this.tab === 'sent') return list.filter((n) => n.sent);
    return list;
  }

  unreadCount(): number {
    return this.notificationsService.unreadCount();
  }

  markRead(n: AppNotification): void {
    this.notificationsService.markRead(n.id).subscribe({
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

  delete(n: AppNotification): void {
    this.notificationsService.delete(n.id).subscribe({
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

  openModal(): void {
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  async send(): Promise<void> {
    if (this.sendForm.invalid) {
      this.sendForm.markAllAsTouched();
      return;
    }
    const v = this.sendForm.getRawValue();
    this.notificationsService
      .send({ title: v.title!, message: v.message!, audience: v.audience! })
      .subscribe({
        next: async () => {
          this.closeModal();
          this.sendForm.reset({ audience: 'all_users' });
          const t = await this.toast.create({
            message: 'Notification sent',
            color: 'success',
            duration: 2000,
          });
          await t.present();
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

  iconFor(type: string): string {
    return ({ order: 'receipt', subscription: 'calendar', system: 'settings', promo: 'pricetag' } as Record<
      string,
      string
    >)[type] || 'notifications';
  }
}
