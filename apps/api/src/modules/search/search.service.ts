import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchService {
  searchProviders(_query: any) {
    return { message: 'TODO' };
  }

  addFavorite(_body: any) {
    return { message: 'TODO' };
  }

  removeFavorite(_providerId: string) {
    return { message: 'TODO' };
  }

  getFavorites() {
    return { message: 'TODO' };
  }

  getHistory() {
    return { message: 'TODO' };
  }
}
