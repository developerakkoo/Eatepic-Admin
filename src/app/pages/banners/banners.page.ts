import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Banner, BannerService } from '../../core/services/banner.service';

@Component({
  selector: 'app-banners',
  templateUrl: './banners.page.html',
  styleUrls: ['./banners.page.scss'],
  standalone: false,
})
export class BannersPage implements OnInit {
  banners: Banner[] = [];
  loading = false;
  saving = false;

  showForm = false;
  editing: Banner | null = null;
  title = '';
  redirectLink = '';
  imageFile: File | null = null;

  constructor(
    private bannerService: BannerService,
    private toast: ToastController,
    private alert: AlertController
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.bannerService.list().subscribe({
      next: (items) => {
        this.banners = items;
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        await this.presentToast('Failed to load banners', 'danger');
      },
    });
  }

  openCreate(): void {
    this.editing = null;
    this.title = '';
    this.redirectLink = '';
    this.imageFile = null;
    this.showForm = true;
  }

  openEdit(banner: Banner): void {
    this.editing = banner;
    this.title = banner.title || '';
    this.redirectLink = banner.redirectLink || '';
    this.imageFile = null;
    this.showForm = true;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.imageFile = input.files?.[0] ?? null;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editing = null;
  }

  submit(): void {
    if (!this.title.trim()) {
      void this.presentToast('Title is required', 'warning');
      return;
    }
    if (!this.editing && !this.imageFile) {
      void this.presentToast('Image is required for new banner', 'warning');
      return;
    }

    const form = new FormData();
    form.append('title', this.title.trim());
    if (this.redirectLink.trim()) {
      form.append('redirectLink', this.redirectLink.trim());
    }
    if (this.imageFile) {
      form.append('image', this.imageFile);
    }

    this.saving = true;
    const req = this.editing
      ? this.bannerService.update(this.editing._id, form)
      : this.bannerService.create(form);

    req.subscribe({
      next: async () => {
        this.saving = false;
        this.showForm = false;
        await this.presentToast(this.editing ? 'Banner updated' : 'Banner created');
        this.load();
      },
      error: async () => {
        this.saving = false;
        await this.presentToast('Save failed', 'danger');
      },
    });
  }

  async confirmDelete(banner: Banner): Promise<void> {
    const alert = await this.alert.create({
      header: 'Delete banner?',
      message: `Remove "${banner.title}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.delete(banner._id),
        },
      ],
    });
    await alert.present();
  }

  delete(id: string): void {
    this.bannerService.delete(id).subscribe({
      next: async () => {
        await this.presentToast('Banner deleted');
        this.load();
      },
      error: async () => {
        await this.presentToast('Delete failed', 'danger');
      },
    });
  }

  private async presentToast(message: string, color = 'success'): Promise<void> {
    const t = await this.toast.create({ message, color, duration: 2200 });
    await t.present();
  }
}
