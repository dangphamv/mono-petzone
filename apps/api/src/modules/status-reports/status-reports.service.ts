import { Injectable } from '@nestjs/common';

@Injectable()
export class StatusReportsService {
  create(_orderId: string, _body: any) {
    return { message: 'TODO' };
  }

  findAll(_orderId: string) {
    return { message: 'TODO' };
  }

  findOne(_orderId: string, _reportId: string) {
    return { message: 'TODO' };
  }
}
