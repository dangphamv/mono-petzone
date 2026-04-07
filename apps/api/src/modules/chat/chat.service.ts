import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  getConversations() {
    return { message: 'TODO' };
  }

  getMessages(_id: string) {
    return { message: 'TODO' };
  }

  sendMessage(_id: string, _body: any) {
    return { message: 'TODO' };
  }

  markRead(_id: string) {
    return { message: 'TODO' };
  }
}
