import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { OrdersPage } from './orders.page';
import { OrdersRoutingModule } from './orders-routing.module';

@NgModule({
  declarations: [OrdersPage],
  imports: [SharedModule, FormsModule, OrdersRoutingModule],
})
export class OrdersModule {}
