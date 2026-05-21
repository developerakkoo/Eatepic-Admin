import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { CategoriesPage } from './categories.page';
import { CategoriesRoutingModule } from './categories-routing.module';

@NgModule({
  declarations: [CategoriesPage],
  imports: [SharedModule, FormsModule, CategoriesRoutingModule],
})
export class CategoriesModule {}
