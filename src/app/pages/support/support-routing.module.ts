import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SupportQueuePage } from './support-queue.page';
import { SupportChatPage } from './support-chat.page';

const routes: Routes = [
  { path: '', component: SupportQueuePage },
  { path: ':ticketId', component: SupportChatPage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SupportRoutingModule {}
