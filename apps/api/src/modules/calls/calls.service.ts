import { Injectable } from '@nestjs/common';

@Injectable()
export class CallsService {
  initiate(_conversationId: string, _body: any) {
    return { message: 'TODO' };
  }

  getLog(_conversationId: string) {
    return { message: 'TODO' };
  }
}
