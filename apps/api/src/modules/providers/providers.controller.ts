import { Controller, Get, Post, Patch, Delete, Param, Body, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ProvidersService } from './providers.service';

@ApiTags('Providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post('register')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Register as a provider' })
  @ApiResponse({ status: 201, description: 'Provider registered successfully' })
  register(@Body() body: any) {
    return this.providersService.register(body);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get provider public profile' })
  @ApiResponse({ status: 200, description: 'Provider profile returned' })
  findOne(@Param('id') id: string) {
    return this.providersService.findOne(id);
  }

  @Patch('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update own provider profile' })
  @ApiResponse({ status: 200, description: 'Provider profile updated' })
  updateMe(@Body() body: any) {
    return this.providersService.updateMe(body);
  }

  @Get('me/rooms')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List provider rooms' })
  @ApiResponse({ status: 200, description: 'Rooms returned' })
  getRooms() {
    return this.providersService.getRooms();
  }

  @Post('me/rooms')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created' })
  createRoom(@Body() body: any) {
    return this.providersService.createRoom(body);
  }

  @Patch('me/rooms/:roomId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a room' })
  @ApiResponse({ status: 200, description: 'Room updated' })
  updateRoom(@Param('roomId') roomId: string, @Body() body: any) {
    return this.providersService.updateRoom(roomId, body);
  }

  @Delete('me/rooms/:roomId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a room' })
  @ApiResponse({ status: 200, description: 'Room deleted' })
  deleteRoom(@Param('roomId') roomId: string) {
    return this.providersService.deleteRoom(roomId);
  }

  @Get('me/add-ons')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List provider add-ons' })
  @ApiResponse({ status: 200, description: 'Add-ons returned' })
  getAddOns() {
    return this.providersService.getAddOns();
  }

  @Post('me/add-ons')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create an add-on' })
  @ApiResponse({ status: 201, description: 'Add-on created' })
  createAddOn(@Body() body: any) {
    return this.providersService.createAddOn(body);
  }

  @Patch('me/add-ons/:addOnId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update an add-on' })
  @ApiResponse({ status: 200, description: 'Add-on updated' })
  updateAddOn(@Param('addOnId') addOnId: string, @Body() body: any) {
    return this.providersService.updateAddOn(addOnId, body);
  }

  @Delete('me/add-ons/:addOnId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete an add-on' })
  @ApiResponse({ status: 200, description: 'Add-on deleted' })
  deleteAddOn(@Param('addOnId') addOnId: string) {
    return this.providersService.deleteAddOn(addOnId);
  }

  @Get('me/availability')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get provider availability' })
  @ApiResponse({ status: 200, description: 'Availability returned' })
  getAvailability() {
    return this.providersService.getAvailability();
  }

  @Put('me/availability')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update provider availability' })
  @ApiResponse({ status: 200, description: 'Availability updated' })
  updateAvailability(@Body() body: any) {
    return this.providersService.updateAvailability(body);
  }
}
