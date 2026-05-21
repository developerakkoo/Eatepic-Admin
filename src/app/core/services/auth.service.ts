import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminRole } from '../models/admin-user.model';

export interface AuthUser {
  name: string;
  email: string;
  role: AdminRole;
}

interface LoginResponse {
  token: string;
  admin?: { name: string; email: string; role: string };
}

function mapApiRole(role?: string): AdminRole {
  if (role === 'SUB_ADMIN') return 'manager';
  return 'super_admin';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'foodadmin_token';
  readonly currentUser$ = new BehaviorSubject<AuthUser | null>(this.loadUser());
  readonly isAuthenticated$ = new BehaviorSubject<boolean>(!!this.getToken());

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  getToken(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/api/admin/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.storageKey, res.token);
          const user: AuthUser = {
            name: res.admin?.name || email.split('@')[0] || 'Admin',
            email: res.admin?.email || email,
            role: mapApiRole(res.admin?.role),
          };
          localStorage.setItem('foodadmin_user', JSON.stringify(user));
          this.currentUser$.next(user);
          this.isAuthenticated$.next(true);
        }),
        map(() => undefined)
      );
  }

  register(data: Record<string, string>) {
    return this.http
      .post(`${environment.apiBaseUrl}/api/admin/register`, {
        name: data['fullName'] || data['name'],
        email: data['email'],
        password: data['password'],
      })
      .pipe(
        tap(() => {
          /* registration only; user must log in */
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem('foodadmin_user');
    this.currentUser$.next(null);
    this.isAuthenticated$.next(false);
    this.router.navigate(['/auth/login']);
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem('foodadmin_user');
    return raw ? JSON.parse(raw) : null;
  }
}
