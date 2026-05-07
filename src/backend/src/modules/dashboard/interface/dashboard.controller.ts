import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from '../application/dashboard.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

class CalendarQueryDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(2020) @Max(2099)
  year?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12)
  month?: number;
}

@ApiTags('Admin — Dashboard')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'KPI tổng quan' })
  async getKpis() {
    const data = await this.dashboardService.getKpis();
    return { message: 'Lấy KPI thành công', data };
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Biểu đồ doanh thu 30 ngày gần nhất' })
  async getRevenue() {
    const data = await this.dashboardService.getRevenueChart(30);
    return { message: 'Lấy dữ liệu doanh thu thành công', data };
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Danh sách booking đang chờ xác nhận' })
  async getTasks() {
    const data = await this.dashboardService.getPendingTasks();
    return { message: 'Lấy task list thành công', data };
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Events cho Gantt calendar theo tháng' })
  @ApiQuery({ name: 'year', required: false }) @ApiQuery({ name: 'month', required: false })
  async getCalendar(@Query() query: CalendarQueryDto) {
    const now = new Date();
    const year  = query.year  ?? now.getFullYear();
    const month = query.month ?? now.getMonth() + 1;
    const data = await this.dashboardService.getCalendarEvents(year, month);
    return { message: 'Lấy dữ liệu calendar thành công', data };
  }
}
