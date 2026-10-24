import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AdminShellComponent } from './components/admin-shell/admin-shell.component';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { TablePaginationComponent } from './components/table-pagination/table-pagination.component';
import { DocumentGalleryComponent } from './components/document-gallery/document-gallery.component';

@NgModule({
  declarations: [AdminShellComponent, StatsCardComponent, TablePaginationComponent, DocumentGalleryComponent],
  imports: [CommonModule, RouterModule, IonicModule],
  exports: [
    AdminShellComponent,
    StatsCardComponent,
    TablePaginationComponent,
    DocumentGalleryComponent,
    CommonModule,
    RouterModule,
    IonicModule,
  ],
})
export class SharedModule {}
