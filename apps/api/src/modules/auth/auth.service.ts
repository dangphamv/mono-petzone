import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  sendOtp(_body: any) {
    return { message: 'TODO' };
  }

  verifyOtp(_body: any) {
    return { message: 'TODO' };
  }

  login(_body: any) {
    return { message: 'TODO' };
  }

  register(_body: any) {
    return { message: 'TODO' };
  }

  google(_body: any) {
    return { message: 'TODO' };
  }

  refresh(_body: any) {
    return { message: 'TODO' };
  }

  selectRole(_body: any) {
    return { message: 'TODO' };
  }

  logout() {
    return { message: 'TODO' };
  }
}
