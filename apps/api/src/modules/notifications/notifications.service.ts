import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  findAll() {
    return { message: 'TODO' };
  }

  markRead(_id: string) {
    return { message: 'TODO' };
  }

  markAllRead() {
    return { message: 'TODO' };
  }

  registerDeviceToken(_body: any) {
    return { message: 'TODO' };
  }

  removeDeviceToken(_token: string) {
    return { message: 'TODO' };
  }
}
