import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { NotificationsPage } from './notifications.page';
import { NotificationsRoutingModule } from './notifications-routing.module';

@NgModule({
  declarations: [NotificationsPage],
  imports: [SharedModule, FormsModule, ReactiveFormsModule, NotificationsRoutingModule],
})
export class NotificationsModule {}
