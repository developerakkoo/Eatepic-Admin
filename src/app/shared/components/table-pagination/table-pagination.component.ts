import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Paginator } from '../../utils/paginator';

@Component({
  selector: 'app-table-pagination',
  templateUrl: './table-pagination.component.html',
  standalone: false,
})
export class TablePaginationComponent {
  @Input() paginator!: Paginator<unknown>;
  @Input() entityLabel = 'items';
  @Output() pageChange = new EventEmitter<number>();

  get page(): number {
    return this.paginator?.page ?? 1;
  }

  get totalCount(): number {
    return this.paginator?.totalCount ?? 0;
  }

  get pageStart(): number {
    return this.paginator?.pageStart ?? 0;
  }

  get pageEnd(): number {
    return this.paginator?.pageEnd ?? 0;
  }

  get totalPages(): number {
    return this.paginator?.totalPages ?? 1;
  }

  get visiblePages(): number[] {
    return this.paginator?.visiblePageNumbers ?? [];
  }

  goPage(p: number): void {
    this.pageChange.emit(p);
  }
}
