import { Controller, Get, Post, Patch, Delete, Param, Body, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProvidersService } from './providers.service';
import { RegisterProviderDto, UpdateListingDto, CreateRoomDto, UpdateRoomDto, CreateAddOnDto, UpdateAddOnDto, UpdateAvailabilityDto } from './dto';

@ApiTags('Providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post('register')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Register as a provider' })
  @ApiResponse({ status: 201, description: 'Provider registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'User already registered as provider' })
  register(@CurrentUser() user: any, @Body() body: RegisterProviderDto) {
    return this.providersService.register(user.id, body);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get provider public profile' })
  @ApiResponse({ status: 200, description: 'Provider profile returned' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  findOne(@Param('id') id: string) {
    return this.providersService.findOne(id);
  }

  @Patch('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update own provider profile' })
  @ApiResponse({ status: 200, description: 'Provider profile updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a provider' })
  updateMe(@CurrentUser() user: any, @Body() body: UpdateListingDto) {
    return this.providersService.updateMe(user.id, body);
  }

  @Get('me/rooms')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List provider rooms' })
  @ApiResponse({ status: 200, description: 'Rooms returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a provider' })
  getRooms(@CurrentUser() user: any) {
    return this.providersService.getRooms(user.id);
  }

  @Post('me/rooms')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a provider' })
  createRoom(@CurrentUser() user: any, @Body() body: CreateRoomDto) {
    return this.providersService.createRoom(user.id, body);
  }

  @Patch('me/rooms/:roomId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a room' })
  @ApiResponse({ status: 200, description: 'Room updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a provider' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  updateRoom(@CurrentUser() user: any, @Param('roomId') roomId: string, @Body() body: UpdateRoomDto) {
    return this.providersService.updateRoom(user.id, roomId, body);
  }

  @Delete('me/rooms/:roomId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a room' })
  @ApiResponse({ status: 200, description: 'Room deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a provider' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  deleteRoom(@CurrentUser() user: any, @Param('roomId') roomId: string) {
    return this.providersService.deleteRoom(user.id, roomId);
  }

  @Get('me/add-ons')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List provider add-ons' })
  @ApiResponse({ status: 200, description: 'Add-ons returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a provider' })
  getAddOns(@CurrentUser() user: any) {
    return this.providersService.getAddOns(user.id);
  }

  @Post('me/add-ons')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create an add-on' })
  @ApiResponse({ status: 201, description: 'Add-on created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a provider' })
  createAddOn(@CurrentUser() user: any, @Body() body: CreateAddOnDto) {
    return this.providersService.createAddOn(user.id, body);
  }

  @Patch('me/add-ons/:addOnId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update an add-on' })
  @ApiResponse({ status: 200, description: 'Add-on updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a provider' })
  @ApiResponse({ status: 404, description: 'Add-on not found' })
  updateAddOn(@CurrentUser() user: any, @Param('addOnId') addOnId: string, @Body() body: UpdateAddOnDto) {
    return this.providersService.updateAddOn(user.id, addOnId, body);
  }

  @Delete('me/add-ons/:addOnId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete an add-on' })
  @ApiResponse({ status: 200, description: 'Add-on deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a provider' })
  @ApiResponse({ status: 404, description: 'Add-on not found' })
  deleteAddOn(@CurrentUser() user: any, @Param('addOnId') addOnId: string) {
    return this.providersService.deleteAddOn(user.id, addOnId);
  }

  @Get('me/availability')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get provider availability' })
  @ApiResponse({ status: 200, description: 'Availability returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a provider' })
  getAvailability(@CurrentUser() user: any) {
    return this.providersService.getAvailability(user.id);
  }

  @Put('me/availability')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update provider availability' })
  @ApiResponse({ status: 200, description: 'Availability updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a provider' })
  updateAvailability(@CurrentUser() user: any, @Body() body: UpdateAvailabilityDto) {
    return this.providersService.updateAvailability(user.id, body);
  }
}
