import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { BookingsService } from '../application/bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BlockDatesDto } from './dto/block-dates.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin — Đặt phòng')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/bookings')
export class BookingsAdminController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo booking thủ công (admin)' })
  async createManual(@Body() dto: CreateBookingDto) {
    const data = await this.bookingsService.create({ ...dto, source: 'manual' } as any);
    return { message: 'Tạo booking thành công', data };
  }

  @Post('block')
  @ApiOperation({ summary: 'Block ngày cho một hoặc nhiều phòng' })
  async blockDates(@Body() dto: BlockDatesDto) {
    const data = await this.bookingsService.blockDates(dto);
    return { message: 'Block ngày thành công', data };
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách booking' })
  async findAll(@Query() query: BookingQueryDto) {
    const data = await this.bookingsService.findAll(query);
    return { message: 'Lấy danh sách booking thành công', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết booking' })
  @ApiParam({ name: 'id', description: 'UUID booking' })
  async findOne(@Param('id') id: string) {
    const data = await this.bookingsService.findOne(id);
    return { message: 'Lấy chi tiết booking thành công', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật status / ghi chú nội bộ' })
  @ApiParam({ name: 'id', description: 'UUID booking' })
  async update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    const data = await this.bookingsService.update(id, dto);
    return { message: 'Cập nhật booking thành công', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hủy booking (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID booking' })
  async cancel(@Param('id') id: string) {
    const data = await this.bookingsService.cancel(id);
    return { message: 'Hủy booking thành công', data };
  }
}
