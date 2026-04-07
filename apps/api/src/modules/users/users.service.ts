import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  getMe() {
    return { message: 'TODO' };
  }

  updateMe(_body: any) {
    return { message: 'TODO' };
  }

  getById(_id: string) {
    return { message: 'TODO' };
  }

  updateNotificationPreferences(_body: any) {
    return { message: 'TODO' };
  }
}
