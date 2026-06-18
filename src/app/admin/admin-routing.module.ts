import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('../pages/dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'orders',
        loadChildren: () => import('../pages/orders/orders.module').then((m) => m.OrdersModule),
      },
      {
        path: 'subscriptions',
        loadChildren: () => import('../pages/subscriptions/subscriptions.module').then((m) => m.SubscriptionsModule),
      },
      {
        path: 'users',
        loadChildren: () => import('../pages/users/users.module').then((m) => m.UsersModule),
      },
      {
        path: 'partners',
        loadChildren: () => import('../pages/partners/partners.module').then((m) => m.PartnersModule),
      },
      {
        path: 'drivers',
        loadChildren: () => import('../pages/drivers/drivers.module').then((m) => m.DriversModule),
      },
      {
        path: 'banners',
        loadChildren: () => import('../pages/banners/banners.module').then((m) => m.BannersModule),
      },
      {
        path: 'categories',
        loadChildren: () => import('../pages/categories/categories.module').then((m) => m.CategoriesModule),
      },
      {
        path: 'notifications',
        loadChildren: () => import('../pages/notifications/notifications.module').then((m) => m.NotificationsModule),
      },
      {
        path: 'support',
        loadChildren: () => import('../pages/support/support.module').then((m) => m.SupportModule),
      },
      {
        path: 'settings',
        loadChildren: () => import('../pages/settings/settings.module').then((m) => m.SettingsModule),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
