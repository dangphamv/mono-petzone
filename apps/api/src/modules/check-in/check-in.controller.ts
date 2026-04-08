import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { uploadCheckInPhotosSchema } from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import type { UploadCheckInPhotosInput } from '@petzone/validators';
import { CheckInService } from './check-in.service';
import { UploadCheckInPhotosDto } from './dto';

@ApiTags('Check-in')
@ApiBearerAuth('access-token')
@Controller('check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post(':orderId/photos')
  @ApiOperation({ summary: 'Upload check-in photos for an order' })
  @ApiResponse({ status: 201, description: 'Photos uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or order not in check-in status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  uploadPhotos(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Body(new ZodValidationPipe(uploadCheckInPhotosSchema)) body: UploadCheckInPhotosInput,
  ) {
    return this.checkInService.uploadPhotos(user.id, orderId, body);
  }

  @Get(':orderId/photos')
  @ApiOperation({ summary: 'Get check-in photos for an order' })
  @ApiResponse({ status: 200, description: 'Photos returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getPhotos(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.checkInService.getPhotos(user.id, orderId);
  }
}
