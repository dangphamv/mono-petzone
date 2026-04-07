import { Injectable } from '@nestjs/common';

@Injectable()
export class OrdersService {
  create(_body: any) {
    return { message: 'TODO' };
  }

  findAll() {
    return { message: 'TODO' };
  }

  findOne(_id: string) {
    return { message: 'TODO' };
  }

  updateStatus(_id: string, _body: any) {
    return { message: 'TODO' };
  }

  cancel(_id: string, _body: any) {
    return { message: 'TODO' };
  }

  getHistory(_id: string) {
    return { message: 'TODO' };
  }
}
