import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UiStateService {
  readonly sidebarCollapsed$ = new BehaviorSubject<boolean>(false);
  readonly mobileSidebarOpen$ = new BehaviorSubject<boolean>(false);
  readonly pendingOrdersCount$ = new BehaviorSubject<number>(0);

  setPendingOrdersCount(count: number): void {
    this.pendingOrdersCount$.next(count);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed$.next(!this.sidebarCollapsed$.value);
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen$.next(!this.mobileSidebarOpen$.value);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen$.next(false);
  }
}
