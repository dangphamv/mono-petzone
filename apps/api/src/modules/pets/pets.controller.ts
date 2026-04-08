import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PetsService } from './pets.service';
import { CreatePetDto, UpdatePetDto } from './dto';

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
  create(@CurrentUser() user: any, @Body() body: CreatePetDto) {
    return this.petsService.create(user.id, body);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all pets for current user' })
  @ApiResponse({ status: 200, description: 'List of pets returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: any) {
    return this.petsService.findAll(user.id);
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
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.petsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update pet profile' })
  @ApiResponse({ status: 200, description: 'Pet updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: UpdatePetDto) {
    return this.petsService.update(user.id, id, body);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete pet profile' })
  @ApiResponse({ status: 200, description: 'Pet deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.petsService.remove(user.id, id);
  }
}
