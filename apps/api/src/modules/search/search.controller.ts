import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import { searchProvidersSchema } from '@petzone/validators';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodQueryValidationPipe } from '../../common/pipes/zod-query-validation.pipe';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { SearchService } from './search.service';
import { SearchProvidersDto, AddFavoriteDto } from './dto';
import {
  ok,
  okPaginated,
  EXAMPLE_PROVIDER_LIST_ITEM,
  EXAMPLE_FAVORITE,
  EXAMPLE_SEARCH_HISTORY_ITEM,
  ERROR_400,
  ERROR_401,
  ERROR_404,
  ERROR_409,
} from '../../common/swagger/examples';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('providers')
  @Public()
  @ApiOperation({ summary: 'Search providers with filters' })
  @ApiResponse({ status: 200, description: 'Search results returned', schema: { example: okPaginated([EXAMPLE_PROVIDER_LIST_ITEM], 'Search results returned', 12) } })
  @ApiResponse({ status: 400, description: 'Invalid search parameters', schema: { example: ERROR_400 } })
  searchProviders(
    @Query(new ZodQueryValidationPipe(searchProvidersSchema)) query: SearchProvidersDto,
    @CurrentUser() user: AuthUser | undefined,
  ) {
    return this.searchService.searchProviders(query, user?.id);
  }

  @Post('favorites')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add provider to favorites' })
  @ApiResponse({ status: 201, description: 'Provider added to favorites', schema: { example: ok(EXAMPLE_FAVORITE, 'Provider added to favorites') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Provider not found', schema: { example: ERROR_404 } })
  @ApiResponse({ status: 409, description: 'Provider already in favorites', schema: { example: ERROR_409 } })
  addFavorite(@CurrentUser() user: AuthUser, @Body() body: AddFavoriteDto) {
    return this.searchService.addFavorite(user.id, body);
  }

  @Delete('favorites/:providerId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove provider from favorites' })
  @ApiResponse({ status: 200, description: 'Provider removed from favorites', schema: { example: ok({ provider_id: EXAMPLE_FAVORITE.provider_id, removed: true }, 'Provider removed from favorites') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Favorite not found', schema: { example: ERROR_404 } })
  removeFavorite(@CurrentUser() user: AuthUser, @Param('providerId') providerId: string) {
    return this.searchService.removeFavorite(user.id, providerId);
  }

  @Get('favorites')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List favorite providers' })
  @ApiResponse({ status: 200, description: 'Favorites list returned', schema: { example: okPaginated([EXAMPLE_FAVORITE], 'Favorites list returned', 8) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
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
  @ApiResponse({ status: 200, description: 'Search history returned', schema: { example: ok([EXAMPLE_SEARCH_HISTORY_ITEM]) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  getHistory(@CurrentUser() user: AuthUser) {
    return this.searchService.getHistory(user.id);
  }
}
