import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../../core/services/api.service';
import { Banner, BannerService } from '../../core/services/banner.service';
import { Category, CategoryService } from '../../core/services/category.service';

export type AppLinkNeeds = 'none' | 'category' | 'kitchen' | 'url';

export interface AppLinkOption {
  id: string;
  name: string;
  template: string;
  description: string;
  needs: AppLinkNeeds;
}

interface KitchenOption {
  id: string;
  name: string;
}

/**
 * Catalog of every redirect link the user app understands
 * (see food_app AppLinkRouter). Shown in the "Choose link" modal
 * so admins can pick without knowing the link formats.
 */
export const APP_LINK_OPTIONS: AppLinkOption[] = [
  {
    id: 'home-categories',
    name: 'Home – categories section',
    template: '/home#categories',
    description:
      'Opens the Home tab and scrolls down to the food categories section. Good for banners promoting the variety of cuisines.',
    needs: 'none',
  },
  {
    id: 'home-highlight-category',
    name: 'Home – highlight a category',
    template: '/home#category/{id}',
    description:
      'Opens the Home tab, scrolls to the categories row and briefly highlights the chosen category to draw attention to it. Pick the category below.',
    needs: 'category',
  },
  {
    id: 'category-page',
    name: 'Category kitchens page',
    template: '/category/{id}',
    description:
      'Opens a full page listing all kitchens that serve the chosen category. Use for banners like "Craving Biryani?". Pick the category below.',
    needs: 'category',
  },
  {
    id: 'kitchen-page',
    name: 'Kitchen page',
    template: '/kitchen/{id}',
    description:
      'Opens a specific kitchen\'s detail page with its full menu, ready to order. Use for banners promoting one kitchen. Pick the kitchen below.',
    needs: 'kitchen',
  },
  {
    id: 'search-tab',
    name: 'Search tab',
    template: '/search',
    description:
      'Switches to the Search tab where users can look up dishes and kitchens.',
    needs: 'none',
  },
  {
    id: 'subscriptions-tab',
    name: 'Subscriptions tab',
    template: '/subscriptions',
    description:
      'Switches to the Subscriptions tab showing the user\'s meal subscriptions and plans.',
    needs: 'none',
  },
  {
    id: 'create-subscription',
    name: 'Start a subscription',
    template: '/create-subscription',
    description:
      'Opens the form to create a new meal subscription. Good for banners advertising subscription offers.',
    needs: 'none',
  },
  {
    id: 'cart',
    name: 'Cart',
    template: '/cart',
    description:
      'Opens the user\'s cart with any items they have added, ready for checkout.',
    needs: 'none',
  },
  {
    id: 'orders',
    name: 'My orders',
    template: '/orders',
    description: 'Opens the list of the user\'s ongoing and past orders.',
    needs: 'none',
  },
  {
    id: 'notifications-tab',
    name: 'Notifications tab',
    template: '/notifications',
    description: 'Switches to the Notifications tab with the user\'s alerts and updates.',
    needs: 'none',
  },
  {
    id: 'account-tab',
    name: 'Account tab',
    template: '/account',
    description:
      'Switches to the Account tab with the user\'s profile, addresses and settings.',
    needs: 'none',
  },
  {
    id: 'support',
    name: 'Help & support',
    template: '/support',
    description: 'Opens the support tickets screen where users can get help.',
    needs: 'none',
  },
  {
    id: 'external',
    name: 'External website',
    template: 'https://…',
    description:
      'Opens any website inside the app in an in-app browser (the user stays in the app and can close it with one tap). Use for ads, campaigns or partner websites. Enter the full address below, starting with https://.',
    needs: 'url',
  },
];

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

  // Choose-link modal state
  linkModalOpen = false;
  linkOptions = APP_LINK_OPTIONS;
  selectedLinkOption: AppLinkOption | null = null;
  categories: Category[] = [];
  kitchens: KitchenOption[] = [];
  loadingLinkData = false;
  private linkDataLoaded = false;
  selectedCategoryId = '';
  selectedKitchenId = '';
  externalUrl = '';

  constructor(
    private bannerService: BannerService,
    private categoryService: CategoryService,
    private api: ApiService,
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

  /* ============ Choose-link modal ============ */

  openLinkPicker(): void {
    this.selectedLinkOption = null;
    this.selectedCategoryId = '';
    this.selectedKitchenId = '';
    this.externalUrl = '';
    this.linkModalOpen = true;
    this.loadLinkData();
  }

  closeLinkPicker(): void {
    this.linkModalOpen = false;
  }

  selectLinkOption(option: AppLinkOption): void {
    this.selectedLinkOption = option;
    this.selectedCategoryId = '';
    this.selectedKitchenId = '';
    this.externalUrl = '';
  }

  /** Final link built from the current selection, or '' while incomplete. */
  get builtLink(): string {
    const option = this.selectedLinkOption;
    if (!option) return '';
    switch (option.needs) {
      case 'none':
        return option.template;
      case 'category':
        return this.selectedCategoryId
          ? option.template.replace('{id}', this.selectedCategoryId)
          : '';
      case 'kitchen':
        return this.selectedKitchenId
          ? option.template.replace('{id}', this.selectedKitchenId)
          : '';
      case 'url': {
        return this.normalizedExternalUrl();
      }
    }
  }

  get externalUrlInvalid(): boolean {
    return !!this.externalUrl.trim() && !this.normalizedExternalUrl();
  }

  applyLink(): void {
    const link = this.builtLink;
    if (!link) return;
    this.redirectLink = link;
    this.linkModalOpen = false;
  }

  private normalizedExternalUrl(): string {
    let url = this.externalUrl.trim();
    if (!url) return '';
    if (url.startsWith('www.')) {
      url = `https://${url}`;
    }
    // Require an http(s) scheme and at least a dot in the host.
    const valid = /^https?:\/\/[^\s\/]+\.[^\s\/]+/i.test(url);
    return valid ? url : '';
  }

  private loadLinkData(): void {
    if (this.linkDataLoaded || this.loadingLinkData) return;
    this.loadingLinkData = true;

    let pending = 2;
    const done = () => {
      pending -= 1;
      if (pending === 0) {
        this.loadingLinkData = false;
        this.linkDataLoaded = true;
      }
    };

    this.categoryService.listPlatform().subscribe({
      next: (items) => {
        this.categories = items.filter((c) => c.isActive !== false);
        done();
      },
      error: () => done(),
    });

    this.api
      .get<{ data: Record<string, unknown>[] }>('/api/admin/kitchens', {
        page: '1',
        limit: '200',
      })
      .subscribe({
        next: (res) => {
          this.kitchens = (res.data || [])
            .map((row) => ({
              id: String(row['_id'] || ''),
              name: String(row['kitchenName'] || 'Kitchen'),
            }))
            .filter((k) => !!k.id);
          done();
        },
        error: () => done(),
      });
  }

  /* ============ Save / delete ============ */

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
