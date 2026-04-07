import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('providers')
  @Public()
  @ApiOperation({ summary: 'Search providers with filters' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  searchProviders(@Query() query: any) {
    return this.searchService.searchProviders(query);
  }

  @Post('favorites')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add provider to favorites' })
  @ApiResponse({ status: 201, description: 'Provider added to favorites' })
  addFavorite(@Body() body: any) {
    return this.searchService.addFavorite(body);
  }

  @Delete('favorites/:providerId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove provider from favorites' })
  @ApiResponse({ status: 200, description: 'Provider removed from favorites' })
  removeFavorite(@Param('providerId') providerId: string) {
    return this.searchService.removeFavorite(providerId);
  }

  @Get('favorites')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List favorite providers' })
  @ApiResponse({ status: 200, description: 'Favorites list returned' })
  getFavorites() {
    return this.searchService.getFavorites();
  }

  @Get('history')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get search history' })
  @ApiResponse({ status: 200, description: 'Search history returned' })
  getHistory() {
    return this.searchService.getHistory();
  }
}
