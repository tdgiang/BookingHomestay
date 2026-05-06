import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { RoomsService } from '../application/rooms.service';
import { PricingService } from '../../pricing/application/pricing.service';
import { RoomQueryDto } from './dto/room-query.dto';
import { PriceQueryDto, AvailabilityQueryDto } from '../../pricing/interface/dto/price-query.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { BookingType } from '@prisma/client';

@ApiTags('Phòng (Public)')
@Public()
@Controller('rooms')
export class RoomsPublicController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly pricingService: PricingService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách phòng còn hoạt động' })
  @ApiResponse({ status: 200, description: 'Danh sách phòng' })
  async findAll(@Query() query: RoomQueryDto) {
    const data = await this.roomsService.findAll(query, false);
    return { message: 'Lấy danh sách phòng thành công', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết phòng + bảng giá' })
  @ApiParam({ name: 'id', description: 'UUID phòng' })
  async findOne(@Param('id') id: string) {
    const data = await this.roomsService.findOne(id);
    return { message: 'Lấy chi tiết phòng thành công', data };
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Kiểm tra phòng còn trống trong khoảng thời gian' })
  @ApiParam({ name: 'id', description: 'UUID phòng' })
  async checkAvailability(
    @Param('id') id: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    const data = await this.pricingService.checkAvailability(
      id,
      new Date(query.checkIn),
      new Date(query.checkOut),
    );
    return { message: 'Kiểm tra phòng thành công', data };
  }

  @Get(':id/pricing')
  @ApiOperation({ summary: 'Tính giá dự kiến cho khoảng thời gian' })
  @ApiParam({ name: 'id', description: 'UUID phòng' })
  async calculatePrice(
    @Param('id') id: string,
    @Query() query: PriceQueryDto,
  ) {
    const data = await this.pricingService.calculatePrice(
      id,
      query.bookingType as BookingType,
      new Date(query.checkIn),
      query.checkOut ? new Date(query.checkOut) : undefined,
      query.durationHours,
    );
    return { message: 'Tính giá thành công', data };
  }
}
