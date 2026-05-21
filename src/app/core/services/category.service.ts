import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  partner?: string | null;
  isActive?: boolean;
}

interface CategoryListResponse {
  total: number;
  data: Category[];
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private api: ApiService) {}

  listPlatform(): Observable<Category[]> {
    return this.api.get<CategoryListResponse>('/api/admin/category/list').pipe(
      map((res) => (res.data ?? []).filter((c) => !c.partner))
    );
  }

  create(form: FormData): Observable<{ data: Category }> {
    return this.api.postForm<{ data: Category }>('/api/admin/category/create', form);
  }

  update(id: string, form: FormData): Observable<{ data: Category }> {
    return this.api.put<{ data: Category }>(`/api/admin/category/update/${id}`, form);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/api/admin/category/delete/${id}`);
  }
}
