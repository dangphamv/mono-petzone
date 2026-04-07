import { Injectable } from '@nestjs/common';

@Injectable()
export class ReviewsService {
  create(_body: any) {
    return { message: 'TODO' };
  }

  findByProvider(_providerId: string) {
    return { message: 'TODO' };
  }

  respond(_id: string, _body: any) {
    return { message: 'TODO' };
  }

  findOne(_id: string) {
    return { message: 'TODO' };
  }
}
