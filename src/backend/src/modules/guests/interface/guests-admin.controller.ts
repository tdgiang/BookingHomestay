import {
  Controller, Get, Patch, Delete, Param, Body, Query, Res,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { GuestsService } from '../application/guests.service';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { GuestQueryDto } from './dto/guest-query.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin — Khách hàng')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/guests')
export class GuestsAdminController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách khách hàng' })
  async findAll(@Query() query: GuestQueryDto) {
    const data = await this.guestsService.findAll(query);
    return { message: 'Lấy danh sách khách thành công', data };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export danh sách khách (CSV)' })
  async export(@Res() res: Response, @Query() query: GuestQueryDto) {
    const csv = await this.guestsService.exportCsv(query.search, query.tags);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="guests.csv"');
    res.send('﻿' + csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết khách hàng' })
  @ApiParam({ name: 'id', description: 'UUID khách' })
  async findOne(@Param('id') id: string) {
    const data = await this.guestsService.findOne(id);
    return { message: 'Lấy thông tin khách thành công', data };
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Lịch sử đặt phòng của khách' })
  @ApiParam({ name: 'id', description: 'UUID khách' })
  async getHistory(@Param('id') id: string) {
    const data = await this.guestsService.getHistory(id);
    return { message: 'Lịch sử đặt phòng', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật tags / ghi chú' })
  @ApiParam({ name: 'id', description: 'UUID khách' })
  async update(@Param('id') id: string, @Body() dto: UpdateGuestDto) {
    const data = await this.guestsService.update(id, dto);
    return { message: 'Cập nhật khách thành công', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa khách (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID khách' })
  async remove(@Param('id') id: string) {
    const data = await this.guestsService.remove(id);
    return { message: 'Xóa khách thành công', data };
  }
}
