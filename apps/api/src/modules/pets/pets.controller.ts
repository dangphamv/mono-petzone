import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PetsService } from './pets.service';
import { CreatePetDto, UpdatePetDto } from './dto';
import {
  createPetSchema,
  updatePetSchema,
} from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import {
  ok,
  okPaginated,
  EXAMPLE_PET,
  EXAMPLE_PET_2,
  EXAMPLE_BREED_LIST,
  ERROR_400,
  ERROR_401,
  ERROR_404,
} from '../../common/swagger/examples';

@ApiTags('Pets')
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new pet profile' })
  @ApiResponse({ status: 201, description: 'Pet created successfully', schema: { example: ok(EXAMPLE_PET, 'Pet created successfully') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createPetSchema)) body: CreatePetDto) {
    return this.petsService.create(user.id, body);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all pets for current user' })
  @ApiResponse({ status: 200, description: 'List of pets returned', schema: { example: okPaginated([EXAMPLE_PET, EXAMPLE_PET_2], 'Pets returned', 2) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
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
  @ApiResponse({ status: 200, description: 'List of breeds returned', schema: { example: ok(EXAMPLE_BREED_LIST, 'Breeds returned') } })
  @ApiResponse({ status: 400, description: 'Invalid species', schema: { example: ERROR_400 } })
  getBreeds(@Param('species') species: string) {
    return this.petsService.getBreeds(species);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get pet by ID' })
  @ApiResponse({ status: 200, description: 'Pet details returned', schema: { example: ok(EXAMPLE_PET) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Pet not found', schema: { example: ERROR_404 } })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.petsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update pet profile' })
  @ApiResponse({ status: 200, description: 'Pet updated successfully', schema: { example: ok(EXAMPLE_PET, 'Pet updated successfully') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Pet not found', schema: { example: ERROR_404 } })
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body(new ZodValidationPipe(updatePetSchema)) body: UpdatePetDto) {
    return this.petsService.update(user.id, id, body);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete pet profile' })
  @ApiResponse({ status: 200, description: 'Pet deleted successfully', schema: { example: ok({ id: EXAMPLE_PET.id, deleted: true }, 'Pet deleted successfully') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Pet not found', schema: { example: ERROR_404 } })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.petsService.remove(user.id, id);
  }
}
