import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { SettingsService } from '../../core/services/settings.service';
import { messageFromApiError } from '../../core/utils/api-error';
import { Paginator } from '../../shared/utils/paginator';

interface AdminUserRow {
  name: string;
  email: string;
  role: string;
  status: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false,
})
export class SettingsPage implements OnInit {
  section = 'profile';

  navItems = [
    { id: 'profile', label: 'Profile' },
    { id: 'app', label: 'App Settings' },
    { id: 'payment', label: 'Payment Config' },
    { id: 'delivery', label: 'Delivery Zones' },
    { id: 'security', label: 'Security' },
    { id: 'admins', label: 'Admin Users' },
  ];

  profileForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', Validators.email],
    phone: [''],
  });

  appForm = this.fb.group({
    appName: ['FoodAdmin'],
    currency: ['INR'],
    timezone: ['Asia/Kolkata'],
    deliveryFee: [40],
    minOrder: [99],
    gst: [5],
  });

  paymentForm = this.fb.group({
    razorpayKey: [''],
    upiId: [''],
    cod: [true],
  });

  securityForm = this.fb.group({
    currentPassword: [''],
    newPassword: [''],
    twoFa: [false],
  });

  adminUsers: AdminUserRow[] = [];
  readonly adminPaginator = new Paginator<AdminUserRow>(10);
  sessions: { device: string; location: string; lastActive: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private toast: ToastController,
    private settings: SettingsService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadAdmins();
  }

  loadProfile(): void {
    this.settings.getProfile().subscribe({
      next: (p) => {
        this.profileForm.patchValue({ name: p.name, email: p.email });
      },
      error: () => {},
    });
  }

  loadAdmins(): void {
    this.settings.listAdmins().subscribe({
      next: (admins) => {
        this.adminUsers = admins.map((a) => ({
          name: a.name,
          email: a.email,
          role: a.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Sub Admin',
          status: 'active',
        }));
        this.adminPaginator.setSource(this.adminUsers);
      },
      error: () => {},
    });
  }

  onAdminPageChange(page: number): void {
    this.adminPaginator.goPage(page);
    this.adminPaginator.setSource(this.adminUsers);
  }

  async save(section: string): Promise<void> {
    if (section === 'profile') {
      if (this.profileForm.invalid) return;
      const v = this.profileForm.getRawValue();
      this.settings.updateProfile({ name: v.name!, email: v.email! }).subscribe({
        next: async () => {
          const t = await this.toast.create({ message: 'Profile saved', color: 'success', duration: 2000 });
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
      return;
    }
    if (section === 'security') {
      const v = this.securityForm.getRawValue();
      if (!v.currentPassword || !v.newPassword) {
        const t = await this.toast.create({ message: 'Enter current and new password', color: 'warning' });
        await t.present();
        return;
      }
      this.settings.changePassword(v.currentPassword!, v.newPassword!).subscribe({
        next: async () => {
          this.securityForm.patchValue({ currentPassword: '', newPassword: '' });
          const t = await this.toast.create({ message: 'Password updated', color: 'success', duration: 2000 });
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
      return;
    }
    const t = await this.toast.create({
      message: `${section} is configured on the server`,
      color: 'medium',
      duration: 2000,
    });
    await t.present();
  }
}
