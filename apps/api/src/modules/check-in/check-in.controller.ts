import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CheckInService } from './check-in.service';

@ApiTags('Check-in')
@ApiBearerAuth('access-token')
@Controller('check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post(':orderId/photos')
  @ApiOperation({ summary: 'Upload check-in photos for an order' })
  @ApiResponse({ status: 201, description: 'Photos uploaded successfully' })
  uploadPhotos(@Param('orderId') orderId: string, @Body() body: any) {
    return this.checkInService.uploadPhotos(orderId, body);
  }

  @Get(':orderId/photos')
  @ApiOperation({ summary: 'Get check-in photos for an order' })
  @ApiResponse({ status: 200, description: 'Photos returned' })
  getPhotos(@Param('orderId') orderId: string) {
    return this.checkInService.getPhotos(orderId);
  }
}
