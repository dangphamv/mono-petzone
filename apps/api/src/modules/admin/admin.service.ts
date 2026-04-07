import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  getDashboard() {
    return { message: 'TODO' };
  }

  getProviders() {
    return { message: 'TODO' };
  }

  verifyProvider(_id: string, _body: any) {
    return { message: 'TODO' };
  }

  getOrders() {
    return { message: 'TODO' };
  }

  getDisputes() {
    return { message: 'TODO' };
  }

  resolveDispute(_id: string, _body: any) {
    return { message: 'TODO' };
  }

  getUsers() {
    return { message: 'TODO' };
  }

  suspendUser(_id: string, _body: any) {
    return { message: 'TODO' };
  }

  getFlaggedReviews() {
    return { message: 'TODO' };
  }

  moderateReview(_id: string, _body: any) {
    return { message: 'TODO' };
  }

  getAnalytics() {
    return { message: 'TODO' };
  }

  getConfig() {
    return { message: 'TODO' };
  }

  updateConfig(_body: any) {
    return { message: 'TODO' };
  }
}
