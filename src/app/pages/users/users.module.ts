import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { UsersPage } from './users.page';
import { UsersRoutingModule } from './users-routing.module';

@NgModule({
  declarations: [UsersPage],
  imports: [SharedModule, FormsModule, UsersRoutingModule],
})
export class UsersModule {}
