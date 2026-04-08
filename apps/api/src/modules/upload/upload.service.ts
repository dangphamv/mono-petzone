import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { PresignedUrlDto, UploadImageDto } from './dto';

@Injectable()
export class UploadService {
  constructor(private readonly supabase: SupabaseService) {}

  async getPresignedUrl(userId: string, body: PresignedUrlDto) {
    const filePath = `${userId}/${Date.now()}-${body.filename}`;

    const { data, error } = await this.supabase.client.storage
      .from(body.bucket)
      .createSignedUploadUrl(filePath);

    if (error) throw new BadRequestException(error.message);

    return { url: data.signedUrl, path: data.path };
  }

  async uploadImage(userId: string, body: UploadImageDto) {
    const filePath = `${userId}/${Date.now()}-${body.filename}`;
    const buffer = Buffer.from(body.base64, 'base64');

    const contentType = this.inferContentType(body.filename);

    const { error: uploadError } = await this.supabase.client.storage
      .from(body.bucket)
      .upload(filePath, buffer, { contentType });

    if (uploadError) throw new BadRequestException(uploadError.message);

    const { data: urlData } = this.supabase.client.storage
      .from(body.bucket)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl };
  }

  private inferContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      heic: 'image/heic',
    };
    return map[ext ?? ''] ?? 'image/jpeg';
  }
}
