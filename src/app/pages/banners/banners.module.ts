import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { BannersPage } from './banners.page';
import { BannersRoutingModule } from './banners-routing.module';

@NgModule({
  declarations: [BannersPage],
  imports: [SharedModule, FormsModule, BannersRoutingModule],
})
export class BannersModule {}
