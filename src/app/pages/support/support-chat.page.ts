import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AdminSupportSocketService } from '../../core/services/admin-support-socket.service';
import { SupportService, SupportTicket } from '../../core/services/support.service';
import { messageFromApiError } from '../../core/utils/api-error';

interface ChatMessage {
  _id: string;
  senderType: string;
  messageType: string;
  body: string;
  createdAt: string;
}

@Component({
  selector: 'app-support-chat',
  templateUrl: './support-chat.page.html',
  styleUrls: ['./support-chat.page.scss'],
  standalone: false,
})
export class SupportChatPage implements OnInit, OnDestroy {
  ticket: SupportTicket | null = null;
  messages: ChatMessage[] = [];
  draft = '';
  loading = true;
  sending = false;
  typingLabel = '';
  ticketId = '';

  private subs = new Subscription();
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supportService: SupportService,
    private supportSocket: AdminSupportSocketService,
    private toast: ToastController
  ) {}

  ngOnInit(): void {
    this.supportSocket.connect();
    this.subs.add(
      this.route.paramMap.subscribe((params) => {
        this.ticketId = params.get('ticketId') || '';
        if (this.ticketId) {
          this.loadTicket();
        }
      })
    );

    this.subs.add(
      this.supportSocket.supportMessage$.subscribe((msg) => {
        if (String(msg['ticketId']) !== this.ticketId) return;
        const id = String(msg['_id'] ?? '');
        if (this.messages.some((m) => m._id === id)) return;
        this.messages = [...this.messages, msg as unknown as ChatMessage];
      })
    );

    this.subs.add(
      this.supportSocket.ticketUpdated$.subscribe((ticket) => {
        if (ticket._id === this.ticketId) {
          this.ticket = { ...this.ticket, ...ticket } as SupportTicket;
        }
      })
    );
  }

  ngOnDestroy(): void {
    if (this.ticketId) {
      this.supportSocket.leaveTicket(this.ticketId);
    }
    this.subs.unsubscribe();
  }

  loadTicket(): void {
    this.loading = true;
    this.supportService.getById(this.ticketId).subscribe({
      next: (res) => {
        this.ticket = res.data;
        this.loading = false;
        this.supportSocket.joinTicket(this.ticketId);
        this.supportService.markRead(this.ticketId).subscribe();
        this.supportSocket.markRead(this.ticketId);
        this.loadMessages();
      },
      error: async (err) => {
        this.loading = false;
        const t = await this.toast.create({
          message: messageFromApiError(err),
          color: 'danger',
          duration: 3500,
        });
        await t.present();
        this.router.navigate(['/admin/support']);
      },
    });
  }

  loadMessages(): void {
    this.supportService.getMessages(this.ticketId).subscribe({
      next: (res) => {
        this.messages = (res.data ?? []) as unknown as ChatMessage[];
      },
    });
  }

  send(): void {
    const body = this.draft.trim();
    if (!body || this.sending || !this.ticket) return;
    if (['RESOLVED', 'CLOSED'].includes(this.ticket.status)) return;

    this.sending = true;
    this.supportService.sendMessage(this.ticketId, body).subscribe({
      next: (res) => {
        this.draft = '';
        this.sending = false;
        const data = res as { data?: ChatMessage };
        if (data.data) {
          const id = data.data._id;
          if (!this.messages.some((m) => m._id === id)) {
            this.messages = [...this.messages, data.data];
          }
        }
      },
      error: async (err) => {
        this.sending = false;
        const t = await this.toast.create({
          message: messageFromApiError(err),
          color: 'danger',
          duration: 3500,
        });
        await t.present();
      },
    });
  }

  onDraftChange(): void {
    this.supportSocket.emitTyping(this.ticketId, true);
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.supportSocket.emitTyping(this.ticketId, false);
    }, 1200);
  }

  assignSelf(): void {
    this.supportService.assign(this.ticketId).subscribe({
      next: (res) => {
        const data = res as { data?: SupportTicket };
        if (data.data) this.ticket = data.data;
      },
    });
  }

  requestRating(): void {
    this.supportService.requestRating(this.ticketId).subscribe({
      next: (res) => {
        const data = res as { data?: SupportTicket };
        if (data.data) this.ticket = data.data;
        this.loadMessages();
      },
      error: async (err) => {
        const t = await this.toast.create({
          message: messageFromApiError(err),
          color: 'danger',
          duration: 3500,
        });
        await t.present();
      },
    });
  }

  closeTicket(): void {
    this.supportService.close(this.ticketId).subscribe({
      next: (res) => {
        const data = res as { data?: SupportTicket };
        if (data.data) this.ticket = data.data;
        this.loadMessages();
      },
    });
  }

  back(): void {
    this.router.navigate(['/admin/support']);
  }

  isMine(msg: ChatMessage): boolean {
    return msg.senderType === 'ADMIN';
  }

  isSystem(msg: ChatMessage): boolean {
    return msg.senderType === 'SYSTEM';
  }

  userOnline(): boolean {
    return !!this.ticket?.user?.supportPresence?.isOnline;
  }
}
