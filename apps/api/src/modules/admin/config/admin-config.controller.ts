import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { updateConfigSchema } from '@petzone/validators';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../../common/interfaces/auth-user';
import { AdminConfigService } from './admin-config.service';
import { UpdateConfigDto } from '../dto';
import {
  ok,
  EXAMPLE_ADMIN_CONFIG,
  ERROR_400,
  ERROR_401,
  ERROR_403,
} from '../../../common/swagger/examples';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin')
export class AdminConfigController {
  constructor(private readonly service: AdminConfigService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get platform configuration' })
  @ApiResponse({ status: 200, description: 'Config returned', schema: { example: ok(EXAMPLE_ADMIN_CONFIG) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getConfig() {
    return this.service.getConfig();
  }

  @Put('config')
  @ApiOperation({ summary: 'Update platform configuration' })
  @ApiResponse({ status: 200, description: 'Config updated', schema: { example: ok(EXAMPLE_ADMIN_CONFIG, 'Config updated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  updateConfig(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(updateConfigSchema)) body: UpdateConfigDto) {
    return this.service.updateConfig(user.id, body);
  }
}
