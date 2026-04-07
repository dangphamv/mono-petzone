import { Injectable } from '@nestjs/common';

@Injectable()
export class PetsService {
  create(_body: any) {
    return { message: 'TODO' };
  }

  findAll() {
    return { message: 'TODO' };
  }

  findOne(_id: string) {
    return { message: 'TODO' };
  }

  update(_id: string, _body: any) {
    return { message: 'TODO' };
  }

  remove(_id: string) {
    return { message: 'TODO' };
  }

  getBreeds(_species: string) {
    return { message: 'TODO' };
  }
}
