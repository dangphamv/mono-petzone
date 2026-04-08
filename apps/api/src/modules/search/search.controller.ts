import { Controller, Get, Post, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SearchService } from './search.service';
import { SearchProvidersDto, AddFavoriteDto } from './dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('providers')
  @Public()
  @ApiOperation({ summary: 'Search providers with filters' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  @ApiResponse({ status: 400, description: 'Invalid search parameters' })
  searchProviders(@Query() query: SearchProvidersDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.searchService.searchProviders(query, userId);
  }

  @Post('favorites')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add provider to favorites' })
  @ApiResponse({ status: 201, description: 'Provider added to favorites' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @ApiResponse({ status: 409, description: 'Provider already in favorites' })
  addFavorite(@CurrentUser() user: any, @Body() body: AddFavoriteDto) {
    return this.searchService.addFavorite(user.id, body);
  }

  @Delete('favorites/:providerId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove provider from favorites' })
  @ApiResponse({ status: 200, description: 'Provider removed from favorites' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  removeFavorite(@CurrentUser() user: any, @Param('providerId') providerId: string) {
    return this.searchService.removeFavorite(user.id, providerId);
  }

  @Get('favorites')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List favorite providers' })
  @ApiResponse({ status: 200, description: 'Favorites list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getFavorites(@CurrentUser() user: any) {
    return this.searchService.getFavorites(user.id);
  }

  @Get('history')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get search history' })
  @ApiResponse({ status: 200, description: 'Search history returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getHistory(@CurrentUser() user: any) {
    return this.searchService.getHistory(user.id);
  }
}
