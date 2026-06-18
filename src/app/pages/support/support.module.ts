import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { SupportQueuePage } from './support-queue.page';
import { SupportChatPage } from './support-chat.page';
import { SupportRoutingModule } from './support-routing.module';

@NgModule({
  declarations: [SupportQueuePage, SupportChatPage],
  imports: [SharedModule, FormsModule, SupportRoutingModule],
})
export class SupportModule {}
