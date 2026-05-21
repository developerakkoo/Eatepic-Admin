import { Component, Input } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { UiStateService } from '../../../core/services/ui-state.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-shell',
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.scss'],
  standalone: false,
})
export class AdminShellComponent {
  @Input() pageTitle = 'Dashboard';

  readonly collapsed$ = this.ui.sidebarCollapsed$;
  readonly mobileOpen$ = this.ui.mobileSidebarOpen$;
  readonly pendingCount$ = this.ui.pendingOrdersCount$;
  readonly user$ = this.auth.currentUser$;

  navSections: NavSection[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', icon: 'grid-outline', route: '/admin/dashboard' },
        { label: 'Orders', icon: 'receipt-outline', route: '/admin/orders' },
        { label: 'Subscriptions', icon: 'calendar-outline', route: '/admin/subscriptions' },
      ],
    },
    {
      title: 'Catalog',
      items: [
        { label: 'Banners', icon: 'images-outline', route: '/admin/banners' },
        { label: 'Categories', icon: 'grid-outline', route: '/admin/categories' },
      ],
    },
    {
      title: 'People',
      items: [
        { label: 'Users', icon: 'people-outline', route: '/admin/users' },
        { label: 'Drivers', icon: 'bicycle-outline', route: '/admin/drivers' },
        { label: 'Partners', icon: 'storefront-outline', route: '/admin/partners' },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Notifications', icon: 'notifications-outline', route: '/admin/notifications' },
        { label: 'Settings', icon: 'settings-outline', route: '/admin/settings' },
      ],
    },
  ];

  constructor(
    public ui: UiStateService,
    private auth: AuthService
  ) {}

  toggleCollapse(): void {
    this.ui.toggleSidebar();
  }

  toggleMobile(): void {
    this.ui.toggleMobileSidebar();
  }

  closeMobile(): void {
    this.ui.closeMobileSidebar();
  }

  logout(): void {
    this.auth.logout();
  }
}
