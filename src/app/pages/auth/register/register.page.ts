import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {
  showPassword = false;
  showConfirm = false;
  loading = false;

  roles = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'support', label: 'Support' },
  ];

  features = [
    'Onboard kitchens and delivery partners',
    'Configure payments and delivery zones',
    'Role-based access for your team',
  ];

  form = this.fb.group(
    {
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s-]{10,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['manager', Validators.required],
      secretKey: ['', Validators.required],
    },
    { validators: passwordMatch }
  );

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastController
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.auth.register(this.form.getRawValue() as Record<string, string>).subscribe({
      next: async () => {
        this.loading = false;
        const t = await this.toast.create({ message: 'Account created!', color: 'success', duration: 2000 });
        await t.present();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
