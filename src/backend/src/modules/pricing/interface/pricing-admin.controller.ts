import {
  Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PricingService } from '../application/pricing.service';
import { CreateRoomPriceDto } from './dto/create-room-price.dto';
import { UpdateRoomPriceDto } from './dto/update-room-price.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin — Bảng giá')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/pricing')
export class PricingAdminController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('rooms/:roomId')
  @ApiOperation({ summary: 'Xem tất cả rule giá của một phòng' })
  @ApiParam({ name: 'roomId', description: 'UUID phòng' })
  async getByRoom(@Param('roomId') roomId: string) {
    const data = await this.pricingService.getPricesByRoom(roomId);
    return { message: 'Lấy bảng giá thành công', data };
  }

  @Post('rooms/:roomId')
  @ApiOperation({ summary: 'Thêm rule giá cho phòng' })
  @ApiParam({ name: 'roomId', description: 'UUID phòng' })
  async create(@Param('roomId') roomId: string, @Body() dto: CreateRoomPriceDto) {
    const data = await this.pricingService.createPrice(roomId, dto);
    return { message: 'Tạo rule giá thành công', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật rule giá' })
  @ApiParam({ name: 'id', description: 'UUID rule giá' })
  async update(@Param('id') id: string, @Body() dto: UpdateRoomPriceDto) {
    const data = await this.pricingService.updatePrice(id, dto);
    return { message: 'Cập nhật rule giá thành công', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa rule giá' })
  @ApiParam({ name: 'id', description: 'UUID rule giá' })
  async remove(@Param('id') id: string) {
    const data = await this.pricingService.deletePrice(id);
    return { message: 'Xóa rule giá thành công', data };
  }
}
