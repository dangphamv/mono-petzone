import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PetsService } from './pets.service';
import { CreatePetDto, UpdatePetDto } from './dto';
import {
  createPetSchema,
  type CreatePetInput,
  updatePetSchema,
  type UpdatePetInput,
} from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';

@ApiTags('Pets')
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new pet profile' })
  @ApiResponse({ status: 201, description: 'Pet created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createPetSchema)) body: CreatePetInput) {
    return this.petsService.create(user.id, body);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all pets for current user' })
  @ApiResponse({ status: 200, description: 'List of pets returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.petsService.findAll(user.id, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Get('breeds/:species')
  @Public()
  @ApiOperation({ summary: 'Get breeds for a species' })
  @ApiResponse({ status: 200, description: 'List of breeds returned' })
  @ApiResponse({ status: 400, description: 'Invalid species' })
  getBreeds(@Param('species') species: string) {
    return this.petsService.getBreeds(species);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get pet by ID' })
  @ApiResponse({ status: 200, description: 'Pet details returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.petsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update pet profile' })
  @ApiResponse({ status: 200, description: 'Pet updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(updatePetSchema)) body: UpdatePetInput) {
    return this.petsService.update(user.id, id, body);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete pet profile' })
  @ApiResponse({ status: 200, description: 'Pet deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.petsService.remove(user.id, id);
  }
}
