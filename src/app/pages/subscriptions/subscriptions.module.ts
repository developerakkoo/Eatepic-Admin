import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { SubscriptionsPage } from './subscriptions.page';
import { SubscriptionsRoutingModule } from './subscriptions-routing.module';

@NgModule({
  declarations: [SubscriptionsPage],
  imports: [SharedModule, FormsModule, SubscriptionsRoutingModule],
})
export class SubscriptionsModule {}
