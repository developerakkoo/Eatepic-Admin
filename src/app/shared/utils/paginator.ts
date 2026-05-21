export class Paginator<T> {
  page = 1;
  totalCount = 0;
  items: T[] = [];

  constructor(public pageSize = 10) {}

  setSource(filtered: T[]): void {
    this.totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize) || 1);
    if (this.page > totalPages) {
      this.page = totalPages;
    }
    if (this.page < 1) {
      this.page = 1;
    }
    const start = (this.page - 1) * this.pageSize;
    this.items = filtered.slice(start, start + this.pageSize);
  }

  /** Server-side pagination: items are already the current page. */
  setServerPage(items: T[], total: number, page: number): void {
    this.items = items;
    this.totalCount = total;
    this.page = page;
  }

  resetPage(): void {
    this.page = 1;
  }

  goPage(p: number): void {
    const totalPages = this.totalPages;
    if (p >= 1 && p <= totalPages) {
      this.page = p;
    }
  }

  get pageStart(): number {
    return this.totalCount ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get pageEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalCount);
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  /** Compact page list when many pages (current ± 2, first, last). */
  get visiblePageNumbers(): number[] {
    const total = this.totalPages;
    if (total <= 7) {
      return this.pageNumbers;
    }
    const pages = new Set<number>([1, total, this.page]);
    for (let i = this.page - 2; i <= this.page + 2; i++) {
      if (i >= 1 && i <= total) {
        pages.add(i);
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  }
}
