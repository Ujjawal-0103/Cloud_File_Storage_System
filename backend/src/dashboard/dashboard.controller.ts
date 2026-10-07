import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get unified dashboard statistics and analytics',
    description:
      'Returns comprehensive user-scoped storage, file, folder, share, download, and recent activity metrics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard analytics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async getDashboard(
    @CurrentUser()
    user: {
      id: string;
      email: string;
    },
  ) {
    return this.dashboardService.getDashboardData(user.id);
  }

  @Get('activity')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get recent activity logs for authenticated user',
    description:
      'Returns paginated activity history with file/folder context and human-readable descriptions.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page (max 50)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    example: 10,
    description: 'Alias for limit (max 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity history retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async getRecentActivity(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @CurrentUser()
    user: {
      id: string;
      email: string;
    },
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = Number(page);
    const limitNum = Number(pageSize || limit);

    if (!Number.isInteger(pageNum) || pageNum < 1) {
      throw new BadRequestException('page must be a positive integer');
    }

    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 50) {
      throw new BadRequestException('limit/pageSize must be between 1 and 50');
    }

    return this.dashboardService.getRecentActivity(
      user.id,
      pageNum,
      limitNum,
    );
  }
}
