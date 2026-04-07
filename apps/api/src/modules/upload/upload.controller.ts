import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@ApiBearerAuth('access-token')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned')
  @ApiOperation({ summary: 'Get a presigned URL for file upload' })
  @ApiResponse({ status: 201, description: 'Presigned URL returned' })
  getPresignedUrl(@Body() body: any) {
    return this.uploadService.getPresignedUrl(body);
  }

  @Post('image')
  @ApiOperation({ summary: 'Upload an image directly' })
  @ApiResponse({ status: 201, description: 'Image uploaded, URL returned' })
  uploadImage(@Body() body: any) {
    return this.uploadService.uploadImage(body);
  }
}
