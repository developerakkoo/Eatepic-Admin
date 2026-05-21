import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { DriversPage } from './drivers.page';
import { DriversRoutingModule } from './drivers-routing.module';

@NgModule({
  declarations: [DriversPage],
  imports: [SharedModule, FormsModule, DriversRoutingModule],
})
export class DriversModule {}
