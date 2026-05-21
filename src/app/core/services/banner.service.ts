import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Banner {
  _id: string;
  title: string;
  image: string;
  redirectLink?: string;
  isActive?: boolean;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class BannerService {
  constructor(private api: ApiService) {}

  list(): Observable<Banner[]> {
    return this.api.get<Banner[]>('/api/admin/banner/list');
  }

  create(form: FormData): Observable<Banner> {
    return this.api.postForm<Banner>('/api/admin/banner/create', form);
  }

  update(id: string, form: FormData): Observable<Banner> {
    return this.api.put<Banner>(`/api/admin/banner/${id}`, form);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/api/admin/banner/${id}`);
  }
}
