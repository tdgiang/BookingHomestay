import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { BookingsService } from '../application/bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Đặt phòng (Public)')
@Public()
@Controller('bookings')
export class BookingsPublicController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đặt phòng mới' })
  async create(@Body() dto: CreateBookingDto) {
    const data = await this.bookingsService.create(dto);
    return { message: 'Đặt phòng thành công', data };
  }

  @Get('code/:bookingCode')
  @ApiOperation({ summary: 'Tra cứu đặt phòng theo booking code' })
  @ApiParam({ name: 'bookingCode', example: 'HSB-20260610-A3F2' })
  async findByCode(@Param('bookingCode') bookingCode: string) {
    const data = await this.bookingsService.findByCode(bookingCode);
    return { message: 'Lấy thông tin đặt phòng thành công', data };
  }
}
