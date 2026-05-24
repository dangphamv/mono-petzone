import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import {
  adminCreatePetSchema,
  adminUpdatePetSchema,
} from '@petzone/validators';
import type { AdminCreatePetInput, AdminUpdatePetInput } from '@petzone/validators';
import { Roles } from '../../../common/decorators/roles.decorator';
import { StaffAccess } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../../common/interfaces/auth-user';
import { AdminPetsService } from './admin-pets.service';
import {
  ERROR_400,
  ERROR_401,
  ERROR_403,
  ERROR_404,
} from '../../../common/swagger/examples';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin')
export class AdminPetsController {
  constructor(private readonly service: AdminPetsService) {}

  @Get('pets')
  @StaffAccess('pets:view')
  @ApiOperation({ summary: 'List all pets across the platform' })
  @ApiResponse({ status: 200, description: 'Pets list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getPets(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('species') species?: string,
    @Query('search') search?: string,
    @Query('owner_id') ownerId?: string,
  ) {
    return this.service.getPets({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
      species,
      search,
      ownerId,
    });
  }

  @Get('pets/:id')
  @StaffAccess('pets:view')
  @ApiOperation({ summary: 'Get pet detail with owner info' })
  @ApiResponse({ status: 200, description: 'Pet detail returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Pet not found', schema: { example: ERROR_404 } })
  getPetDetail(@Param('id') id: string) {
    return this.service.getPetDetail(id);
  }

  @Post('pets')
  @StaffAccess('pets:manage')
  @ApiOperation({ summary: 'Create a pet on behalf of an owner' })
  @ApiResponse({ status: 201, description: 'Pet created' })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Owner not found', schema: { example: ERROR_404 } })
  createPet(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(adminCreatePetSchema)) body: AdminCreatePetInput,
  ) {
    return this.service.createPet(user.id, body);
  }

  @Patch('pets/:id')
  @StaffAccess('pets:manage')
  @ApiOperation({ summary: 'Update a pet (admin)' })
  @ApiResponse({ status: 200, description: 'Pet updated' })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Pet not found', schema: { example: ERROR_404 } })
  updatePet(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminUpdatePetSchema)) body: AdminUpdatePetInput,
  ) {
    return this.service.updatePet(user.id, id, body);
  }
}
