import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../../shared/shared.module';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginPage } from './login/login.page';
import { RegisterPage } from './register/register.page';

@NgModule({
  declarations: [LoginPage, RegisterPage],
  imports: [SharedModule, ReactiveFormsModule, IonicModule, AuthRoutingModule],
})
export class AuthModule {}
