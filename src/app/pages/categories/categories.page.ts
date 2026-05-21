import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Category, CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: false,
})
export class CategoriesPage implements OnInit {
  categories: Category[] = [];
  loading = false;
  saving = false;

  showForm = false;
  editing: Category | null = null;
  name = '';
  description = '';
  imageFile: File | null = null;

  constructor(
    private categoryService: CategoryService,
    private toast: ToastController,
    private alert: AlertController
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.categoryService.listPlatform().subscribe({
      next: (items) => {
        this.categories = items;
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        await this.presentToast('Failed to load categories', 'danger');
      },
    });
  }

  openCreate(): void {
    this.editing = null;
    this.name = '';
    this.description = '';
    this.imageFile = null;
    this.showForm = true;
  }

  openEdit(category: Category): void {
    this.editing = category;
    this.name = category.name || '';
    this.description = category.description || '';
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
    if (!this.name.trim()) {
      void this.presentToast('Name is required', 'warning');
      return;
    }

    const form = new FormData();
    form.append('name', this.name.trim());
    if (this.description.trim()) {
      form.append('description', this.description.trim());
    }
    if (this.imageFile) {
      form.append('image', this.imageFile);
    }

    this.saving = true;
    const req = this.editing
      ? this.categoryService.update(this.editing._id, form)
      : this.categoryService.create(form);

    req.subscribe({
      next: async () => {
        this.saving = false;
        this.showForm = false;
        await this.presentToast(this.editing ? 'Category updated' : 'Category created');
        this.load();
      },
      error: async () => {
        this.saving = false;
        await this.presentToast('Save failed', 'danger');
      },
    });
  }

  async confirmDelete(category: Category): Promise<void> {
    const alert = await this.alert.create({
      header: 'Delete category?',
      message: `Remove "${category.name}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.delete(category._id),
        },
      ],
    });
    await alert.present();
  }

  delete(id: string): void {
    this.categoryService.delete(id).subscribe({
      next: async () => {
        await this.presentToast('Category deleted');
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
