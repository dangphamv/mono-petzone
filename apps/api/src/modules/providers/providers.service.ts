import { Injectable } from '@nestjs/common';

@Injectable()
export class ProvidersService {
  register(_body: any) {
    return { message: 'TODO' };
  }

  findOne(_id: string) {
    return { message: 'TODO' };
  }

  updateMe(_body: any) {
    return { message: 'TODO' };
  }

  getRooms() {
    return { message: 'TODO' };
  }

  createRoom(_body: any) {
    return { message: 'TODO' };
  }

  updateRoom(_roomId: string, _body: any) {
    return { message: 'TODO' };
  }

  deleteRoom(_roomId: string) {
    return { message: 'TODO' };
  }

  getAddOns() {
    return { message: 'TODO' };
  }

  createAddOn(_body: any) {
    return { message: 'TODO' };
  }

  updateAddOn(_addOnId: string, _body: any) {
    return { message: 'TODO' };
  }

  deleteAddOn(_addOnId: string) {
    return { message: 'TODO' };
  }

  getAvailability() {
    return { message: 'TODO' };
  }

  updateAvailability(_body: any) {
    return { message: 'TODO' };
  }
}
