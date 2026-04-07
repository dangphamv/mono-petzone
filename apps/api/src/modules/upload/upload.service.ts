import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  getPresignedUrl(_body: any) {
    return { message: 'TODO' };
  }

  uploadImage(_body: any) {
    return { message: 'TODO' };
  }
}
