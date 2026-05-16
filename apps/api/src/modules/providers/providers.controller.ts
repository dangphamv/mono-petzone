import { Controller, Get, Post, Patch, Delete, Param, Body, Put, Query, ParseUUIDPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  registerProviderSchema,
  updateListingSchema,
  createRoomSchema,
  updateRoomSchema,
  createAddOnSchema,
  updateAddOnSchema,
  updateAvailabilitySchema,
  bulkUpdateAvailabilitySchema,
  uploadDocumentsSchema,
  updateProviderBankSchema,
} from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { ProvidersService } from './providers.service';
import {
  RegisterProviderDto, UpdateListingDto, UploadDocumentsDto,
  CreateRoomDto, UpdateRoomDto, CreateAddOnDto, UpdateAddOnDto,
  UpdateAvailabilityDto, BulkUpdateAvailabilityDto,
  UpdateProviderBankDto,
  VerificationStatusResponseDto,
} from './dto';
import {
  ok,
  okPaginated,
  EXAMPLE_PROVIDER,
  EXAMPLE_PROVIDER_DOCUMENTS_UPLOAD,
  EXAMPLE_VERIFICATION_STATUS,
  EXAMPLE_ORDER_LIST_ITEM,
  EXAMPLE_PROVIDER_STATS,
  EXAMPLE_ROOM,
  EXAMPLE_ADDON,
  EXAMPLE_AVAILABILITY,
  ERROR_400,
  ERROR_401,
  ERROR_403,
  ERROR_404,
  ERROR_409,
} from '../../common/swagger/examples';

@ApiTags('Providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Register as a provider' })
  @ApiResponse({ status: 201, description: 'Provider registered successfully', schema: { example: ok(EXAMPLE_PROVIDER, 'Provider registered successfully') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 409, description: 'User already registered as provider', schema: { example: ERROR_409 } })
  register(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(registerProviderSchema)) body: RegisterProviderDto) {
    return this.providersService.register(user.id, body);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get own provider profile' })
  @ApiResponse({ status: 200, description: 'Provider profile returned', schema: { example: ok(EXAMPLE_PROVIDER) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  getMe(@CurrentUser() user: AuthUser) {
    return this.providersService.getMe(user.id);
  }

  @Patch('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update own provider profile' })
  @ApiResponse({ status: 200, description: 'Provider profile updated', schema: { example: ok(EXAMPLE_PROVIDER, 'Provider profile updated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  updateMe(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(updateListingSchema)) body: UpdateListingDto) {
    return this.providersService.updateMe(user.id, body);
  }

  @Post('me/documents')
  @Throttle({ default: { ttl: 60000, limit: 15 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload provider verification documents' })
  @ApiResponse({ status: 201, description: 'Documents uploaded', schema: { example: ok(EXAMPLE_PROVIDER_DOCUMENTS_UPLOAD, 'Documents uploaded') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  uploadDocuments(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(uploadDocumentsSchema)) body: UploadDocumentsDto) {
    return this.providersService.uploadDocuments(user.id, body);
  }

  @Post('me/submit-verification')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Submit provider for admin verification' })
  @ApiResponse({ status: 201, description: 'Submitted for verification', schema: { example: ok({ verification_status: 'pending', submitted_at: '2026-04-12T10:00:00.000Z' }, 'Submitted for verification') } })
  @ApiResponse({ status: 400, description: 'Missing required documents', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  submitVerification(@CurrentUser() user: AuthUser) {
    return this.providersService.submitVerification(user.id);
  }

  @Get('me/verification-status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Check provider verification status' })
  @ApiResponse({
    status: 200,
    description: 'Verification status returned. One of: pending, approved, rejected, suspended.',
    type: VerificationStatusResponseDto,
    schema: { example: ok(EXAMPLE_VERIFICATION_STATUS) },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  getVerificationStatus(@CurrentUser() user: AuthUser) {
    return this.providersService.getVerificationStatus(user.id);
  }

  @Get('me/orders')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List orders for this provider' })
  @ApiResponse({ status: 200, description: 'Provider orders returned', schema: { example: okPaginated([EXAMPLE_ORDER_LIST_ITEM], 'Provider orders returned', 28) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  getOrders(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.providersService.getOrders(user.id, {
      status,
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Get('me/stats')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get provider monthly stats' })
  @ApiResponse({ status: 200, description: 'Stats returned', schema: { example: ok(EXAMPLE_PROVIDER_STATS) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  getStats(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    return this.providersService.getStats(user.id, month);
  }

  @Get('me/rooms')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List provider rooms' })
  @ApiResponse({ status: 200, description: 'Rooms returned', schema: { example: ok([EXAMPLE_ROOM]) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  getRooms(@CurrentUser() user: AuthUser) {
    return this.providersService.getRooms(user.id);
  }

  @Post('me/rooms')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created', schema: { example: ok(EXAMPLE_ROOM, 'Room created') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  createRoom(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createRoomSchema)) body: CreateRoomDto) {
    return this.providersService.createRoom(user.id, body);
  }

  @Patch('me/rooms/:roomId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a room' })
  @ApiResponse({ status: 200, description: 'Room updated', schema: { example: ok(EXAMPLE_ROOM, 'Room updated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Room not found', schema: { example: ERROR_404 } })
  updateRoom(@CurrentUser() user: AuthUser, @Param('roomId', ParseUUIDPipe) roomId: string, @Body(new ZodValidationPipe(updateRoomSchema)) body: UpdateRoomDto) {
    return this.providersService.updateRoom(user.id, roomId, body);
  }

  @Delete('me/rooms/:roomId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a room' })
  @ApiResponse({ status: 200, description: 'Room deleted', schema: { example: ok({ id: EXAMPLE_ROOM.id, deleted: true }, 'Room deleted') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Room not found', schema: { example: ERROR_404 } })
  deleteRoom(@CurrentUser() user: AuthUser, @Param('roomId', ParseUUIDPipe) roomId: string) {
    return this.providersService.deleteRoom(user.id, roomId);
  }

  @Get('me/add-ons')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List provider add-ons' })
  @ApiResponse({ status: 200, description: 'Add-ons returned', schema: { example: ok([EXAMPLE_ADDON]) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  getAddOns(@CurrentUser() user: AuthUser) {
    return this.providersService.getAddOns(user.id);
  }

  @Post('me/add-ons')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create an add-on' })
  @ApiResponse({ status: 201, description: 'Add-on created', schema: { example: ok(EXAMPLE_ADDON, 'Add-on created') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  createAddOn(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createAddOnSchema)) body: CreateAddOnDto) {
    return this.providersService.createAddOn(user.id, body);
  }

  @Patch('me/add-ons/:addOnId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update an add-on' })
  @ApiResponse({ status: 200, description: 'Add-on updated', schema: { example: ok(EXAMPLE_ADDON, 'Add-on updated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Add-on not found', schema: { example: ERROR_404 } })
  updateAddOn(@CurrentUser() user: AuthUser, @Param('addOnId', ParseUUIDPipe) addOnId: string, @Body(new ZodValidationPipe(updateAddOnSchema)) body: UpdateAddOnDto) {
    return this.providersService.updateAddOn(user.id, addOnId, body);
  }

  @Delete('me/add-ons/:addOnId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete an add-on' })
  @ApiResponse({ status: 200, description: 'Add-on deleted', schema: { example: ok({ id: EXAMPLE_ADDON.id, deleted: true }, 'Add-on deleted') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Add-on not found', schema: { example: ERROR_404 } })
  deleteAddOn(@CurrentUser() user: AuthUser, @Param('addOnId', ParseUUIDPipe) addOnId: string) {
    return this.providersService.deleteAddOn(user.id, addOnId);
  }

  @Get('me/availability')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get provider availability' })
  @ApiResponse({ status: 200, description: 'Availability returned', schema: { example: ok([EXAMPLE_AVAILABILITY]) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  getAvailability(@CurrentUser() user: AuthUser) {
    return this.providersService.getAvailability(user.id);
  }

  @Put('me/availability')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update provider availability' })
  @ApiResponse({ status: 200, description: 'Availability updated', schema: { example: ok(EXAMPLE_AVAILABILITY, 'Availability updated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  updateAvailability(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(updateAvailabilitySchema)) body: UpdateAvailabilityDto) {
    return this.providersService.updateAvailability(user.id, body);
  }

  @Put('me/availability/bulk')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Bulk update availability for a date range' })
  @ApiResponse({ status: 200, description: 'Availability bulk updated', schema: { example: ok({ updated_count: 30, from: '2026-04-20', to: '2026-05-20' }, 'Availability bulk updated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  bulkUpdateAvailability(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(bulkUpdateAvailabilitySchema)) body: BulkUpdateAvailabilityDto) {
    return this.providersService.bulkUpdateAvailability(user.id, body);
  }

  @Get('me/bank')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get own bank info (masked)' })
  @ApiResponse({ status: 200, description: 'Bank info returned' })
  @ApiResponse({ status: 403, schema: { example: ERROR_403 } })
  getBankInfo(@CurrentUser() user: AuthUser) {
    return this.providersService.getBankInfo(user.id);
  }

  @Put('me/bank')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update own bank info (required for v2 payouts)' })
  @ApiResponse({ status: 200, description: 'Bank info updated' })
  @ApiResponse({ status: 400, schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, schema: { example: ERROR_403 } })
  updateBankInfo(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(updateProviderBankSchema)) body: UpdateProviderBankDto) {
    return this.providersService.updateBankInfo(user.id, body);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get provider public profile' })
  @ApiResponse({ status: 200, description: 'Provider profile returned', schema: { example: ok(EXAMPLE_PROVIDER) } })
  @ApiResponse({ status: 404, description: 'Provider not found', schema: { example: ERROR_404 } })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.providersService.findOne(id);
  }

  @Get(':id/rooms')
  @Public()
  @ApiOperation({ summary: 'Get provider room types' })
  @ApiResponse({ status: 200, description: 'Rooms returned', schema: { example: ok([EXAMPLE_ROOM]) } })
  @ApiResponse({ status: 404, description: 'Provider not found', schema: { example: ERROR_404 } })
  getPublicRooms(@Param('id', ParseUUIDPipe) id: string) {
    return this.providersService.getPublicRooms(id);
  }

  @Get(':id/addons')
  @Public()
  @ApiOperation({ summary: 'Get provider add-on services' })
  @ApiResponse({ status: 200, description: 'Add-ons returned', schema: { example: ok([EXAMPLE_ADDON]) } })
  @ApiResponse({ status: 404, description: 'Provider not found', schema: { example: ERROR_404 } })
  getPublicAddOns(@Param('id', ParseUUIDPipe) id: string) {
    return this.providersService.getPublicAddOns(id);
  }
}
