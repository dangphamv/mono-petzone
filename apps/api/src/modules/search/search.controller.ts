import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import { searchProvidersSchema, type SearchProvidersInput } from '@petzone/validators';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodQueryValidationPipe } from '../../common/pipes/zod-query-validation.pipe';
import type { AuthUser } from '../../common/interfaces/auth-user';
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
  searchProviders(
    @Query(new ZodQueryValidationPipe(searchProvidersSchema)) query: SearchProvidersInput,
    @CurrentUser() user: AuthUser | undefined,
  ) {
    return this.searchService.searchProviders(query, user?.id);
  }

  @Post('favorites')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add provider to favorites' })
  @ApiResponse({ status: 201, description: 'Provider added to favorites' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @ApiResponse({ status: 409, description: 'Provider already in favorites' })
  addFavorite(@CurrentUser() user: AuthUser, @Body() body: AddFavoriteDto) {
    return this.searchService.addFavorite(user.id, body);
  }

  @Delete('favorites/:providerId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove provider from favorites' })
  @ApiResponse({ status: 200, description: 'Provider removed from favorites' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  removeFavorite(@CurrentUser() user: AuthUser, @Param('providerId') providerId: string) {
    return this.searchService.removeFavorite(user.id, providerId);
  }

  @Get('favorites')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List favorite providers' })
  @ApiResponse({ status: 200, description: 'Favorites list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getFavorites(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.getFavorites(user.id, {
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Get('history')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get search history' })
  @ApiResponse({ status: 200, description: 'Search history returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getHistory(@CurrentUser() user: AuthUser) {
    return this.searchService.getHistory(user.id);
  }
}
