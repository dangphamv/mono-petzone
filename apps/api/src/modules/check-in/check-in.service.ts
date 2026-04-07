import { Injectable } from '@nestjs/common';

@Injectable()
export class CheckInService {
  uploadPhotos(_orderId: string, _body: any) {
    return { message: 'TODO' };
  }

  getPhotos(_orderId: string) {
    return { message: 'TODO' };
  }
}
