import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  create(_body: any) {
    return { message: 'TODO' };
  }

  callback() {
    return { message: 'TODO' };
  }

  findByOrder(_orderId: string) {
    return { message: 'TODO' };
  }

  refund(_orderId: string, _body: any) {
    return { message: 'TODO' };
  }

  getPayouts() {
    return { message: 'TODO' };
  }

  requestPayout(_body: any) {
    return { message: 'TODO' };
  }
}
