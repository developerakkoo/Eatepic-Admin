import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminInboxService, AdminInboxItem } from '../../../core/services/admin-inbox.service';
import { AdminSupportSocketService } from '../../../core/services/admin-support-socket.service';
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
export class AdminShellComponent implements OnInit {
  @Input() pageTitle = 'Dashboard';

  readonly collapsed$ = this.ui.sidebarCollapsed$;
  readonly mobileOpen$ = this.ui.mobileSidebarOpen$;
  readonly pendingCount$ = this.ui.pendingOrdersCount$;
  readonly user$ = this.auth.currentUser$;
  readonly inboxUnread$ = this.inbox.unreadCount$;
  readonly inboxItems$ = this.inbox.items$;

  inboxOpen = false;

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
        { label: 'Support', icon: 'chatbubbles-outline', route: '/admin/support' },
        { label: 'Notifications', icon: 'notifications-outline', route: '/admin/notifications' },
        { label: 'Settings', icon: 'settings-outline', route: '/admin/settings' },
      ],
    },
  ];

  constructor(
    public ui: UiStateService,
    private auth: AuthService,
    private inbox: AdminInboxService,
    private supportSocket: AdminSupportSocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.getToken()) {
      this.supportSocket.connect();
      this.inbox.load().subscribe();
    }
  }

  toggleInbox(): void {
    this.inboxOpen = !this.inboxOpen;
    if (this.inboxOpen) {
      this.inbox.load().subscribe();
    }
  }

  openInboxItem(item: AdminInboxItem): void {
    this.inboxOpen = false;
    if (!item.isRead) {
      this.inbox.markRead(item._id).subscribe();
    }
    const ticketId = item.data?.ticketId;
    if (ticketId) {
      this.router.navigate(['/admin/support', ticketId]);
    }
  }

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
