import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private api: ApiService) {}

  getProfile(): Observable<AdminProfile> {
    return this.api.get<{ data: AdminProfile }>('/api/admin/profile').pipe(map((r) => r.data));
  }

  updateProfile(body: { name?: string; email?: string }): Observable<AdminProfile> {
    return this.api.patch<{ data: AdminProfile }>('/api/admin/profile', body).pipe(map((r) => r.data));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.api
      .patch('/api/admin/password', { currentPassword, newPassword })
      .pipe(map(() => undefined));
  }

  listAdmins(): Observable<AdminProfile[]> {
    return this.api.get<{ data: AdminProfile[] }>('/api/admin/admins').pipe(map((r) => r.data || []));
  }

  createAdmin(body: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Observable<AdminProfile> {
    return this.api.post<{ data: AdminProfile }>('/api/admin/admins', body).pipe(map((r) => r.data));
  }
}
