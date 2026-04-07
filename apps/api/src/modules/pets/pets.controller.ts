import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PetsService } from './pets.service';

@ApiTags('Pets')
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new pet profile' })
  @ApiResponse({ status: 201, description: 'Pet created successfully' })
  create(@Body() body: any) {
    return this.petsService.create(body);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all pets for current user' })
  @ApiResponse({ status: 200, description: 'List of pets returned' })
  findAll() {
    return this.petsService.findAll();
  }

  @Get('breeds/:species')
  @Public()
  @ApiOperation({ summary: 'Get breeds for a species' })
  @ApiResponse({ status: 200, description: 'List of breeds returned' })
  getBreeds(@Param('species') species: string) {
    return this.petsService.getBreeds(species);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get pet by ID' })
  @ApiResponse({ status: 200, description: 'Pet details returned' })
  findOne(@Param('id') id: string) {
    return this.petsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update pet profile' })
  @ApiResponse({ status: 200, description: 'Pet updated successfully' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.petsService.update(id, body);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete pet profile' })
  @ApiResponse({ status: 200, description: 'Pet deleted successfully' })
  remove(@Param('id') id: string) {
    return this.petsService.remove(id);
  }
}
