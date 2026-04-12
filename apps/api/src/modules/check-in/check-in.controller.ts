import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { uploadCheckInPhotosSchema } from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { CheckInService } from './check-in.service';
import { UploadCheckInPhotosDto } from './dto';
import {
  ok,
  EXAMPLE_CHECK_IN_PHOTO,
  ERROR_400,
  ERROR_401,
  ERROR_404,
} from '../../common/swagger/examples';

@ApiTags('Check-in')
@ApiBearerAuth('access-token')
@Controller('check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post(':orderId/photos')
  @ApiOperation({ summary: 'Upload check-in photos for an order' })
  @ApiResponse({ status: 201, description: 'Photos uploaded successfully', schema: { example: ok([EXAMPLE_CHECK_IN_PHOTO], 'Photos uploaded successfully') } })
  @ApiResponse({ status: 400, description: 'Validation error or order not in check-in status', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  uploadPhotos(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Body(new ZodValidationPipe(uploadCheckInPhotosSchema)) body: UploadCheckInPhotosDto,
  ) {
    return this.checkInService.uploadPhotos(user.id, orderId, body);
  }

  @Get(':orderId/photos')
  @ApiOperation({ summary: 'Get check-in photos for an order' })
  @ApiResponse({ status: 200, description: 'Photos returned', schema: { example: ok([EXAMPLE_CHECK_IN_PHOTO]) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  getPhotos(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.checkInService.getPhotos(user.id, orderId);
  }
}
