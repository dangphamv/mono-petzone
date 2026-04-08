import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UploadService } from './upload.service';
import { PresignedUrlDto, UploadImageDto } from './dto';

@ApiTags('Upload')
@ApiBearerAuth('access-token')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned')
  @ApiOperation({ summary: 'Get a presigned URL for file upload' })
  @ApiResponse({ status: 201, description: 'Presigned URL returned' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getPresignedUrl(@CurrentUser() user: any, @Body() body: PresignedUrlDto) {
    return this.uploadService.getPresignedUrl(user.id, body);
  }

  @Post('image')
  @ApiOperation({ summary: 'Upload an image directly' })
  @ApiResponse({ status: 201, description: 'Image uploaded, URL returned' })
  @ApiResponse({ status: 400, description: 'Invalid image data or unsupported format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 413, description: 'File too large' })
  uploadImage(@CurrentUser() user: any, @Body() body: UploadImageDto) {
    return this.uploadService.uploadImage(user.id, body);
  }
}
