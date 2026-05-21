import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { PartnersPage } from './partners.page';
import { PartnersRoutingModule } from './partners-routing.module';

@NgModule({
  declarations: [PartnersPage],
  imports: [SharedModule, FormsModule, PartnersRoutingModule],
})
export class PartnersModule {}
