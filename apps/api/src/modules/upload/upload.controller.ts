import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UploadService } from './upload.service';
import { PresignedUrlDto, UploadImageDto } from './dto';
import {
  presignedUrlSchema,
  uploadImageSchema,
} from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import {
  ok,
  EXAMPLE_PRESIGNED_URL,
  EXAMPLE_UPLOADED_IMAGE,
  ERROR_400,
  ERROR_401,
  ERROR_413,
} from '../../common/swagger/examples';

@ApiTags('Upload')
@ApiBearerAuth('access-token')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned')
  @ApiOperation({ summary: 'Get a presigned URL for file upload' })
  @ApiResponse({ status: 201, description: 'Presigned URL returned', schema: { example: ok(EXAMPLE_PRESIGNED_URL, 'Presigned URL returned') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  getPresignedUrl(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(presignedUrlSchema)) body: PresignedUrlDto) {
    return this.uploadService.getPresignedUrl(user.id, body);
  }

  @Post('image')
  @ApiOperation({ summary: 'Upload an image directly' })
  @ApiResponse({ status: 201, description: 'Image uploaded, URL returned', schema: { example: ok(EXAMPLE_UPLOADED_IMAGE, 'Image uploaded') } })
  @ApiResponse({ status: 400, description: 'Invalid image data or unsupported format', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 413, description: 'File too large', schema: { example: ERROR_413 } })
  uploadImage(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(uploadImageSchema)) body: UploadImageDto) {
    return this.uploadService.uploadImage(user.id, body);
  }
}
