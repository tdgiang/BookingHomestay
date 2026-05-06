import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, UseInterceptors, UploadedFiles, HttpCode, HttpStatus, Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { RoomsService } from '../application/rooms.service';
import { UploadsService, MAX_IMAGE_SIZE } from '../../uploads/uploads.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomQueryDto } from './dto/room-query.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin — Phòng')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/rooms')
export class RoomsAdminController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Thêm phòng mới' })
  @ApiResponse({ status: 201, description: 'Tạo phòng thành công' })
  async create(@Body() dto: CreateRoomDto) {
    const data = await this.roomsService.create(dto);
    return { message: 'Tạo phòng thành công', data };
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách tất cả phòng (bao gồm inactive)' })
  async findAll(@Query() query: RoomQueryDto) {
    const data = await this.roomsService.findAll(query, true);
    return { message: 'Lấy danh sách phòng thành công', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết phòng + bảng giá' })
  @ApiParam({ name: 'id', description: 'UUID phòng' })
  async findOne(@Param('id') id: string) {
    const data = await this.roomsService.findOne(id);
    return { message: 'Lấy chi tiết phòng thành công', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin phòng' })
  @ApiParam({ name: 'id', description: 'UUID phòng' })
  async update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    const data = await this.roomsService.update(id, dto);
    return { message: 'Cập nhật phòng thành công', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa phòng (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID phòng' })
  async remove(@Param('id') id: string) {
    const data = await this.roomsService.remove(id);
    return { message: 'Xóa phòng thành công', data };
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Upload ảnh phòng (tối đa 10 ảnh/lần, 5MB/ảnh)' })
  @ApiParam({ name: 'id', description: 'UUID phòng' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files', maxCount: 10 }], {
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  async uploadImages(
    @Param('id') id: string,
    @Req() req: Request & { files?: { files?: Express.Multer.File[] } },
  ) {
    const files = req.files?.files ?? [];

    // Save files to disk using per-room storage
    const storage = this.uploadsService.roomImageStorage(id);
    const saved: Express.Multer.File[] = await Promise.all(
      files.map(
        (file) =>
          new Promise<Express.Multer.File>((resolve, reject) => {
            (storage as any)._handleFile(req, file, (err: Error | null, info: Partial<Express.Multer.File>) => {
              if (err) return reject(err);
              resolve({ ...file, ...info });
            });
          }),
      ),
    );

    const data = await this.roomsService.addImages(id, saved);
    return { message: 'Upload ảnh thành công', data };
  }

  @Delete(':id/images')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa một ảnh của phòng' })
  @ApiParam({ name: 'id', description: 'UUID phòng' })
  @ApiBody({ schema: { type: 'object', properties: { imageUrl: { type: 'string' } } } })
  async removeImage(@Param('id') id: string, @Body('imageUrl') imageUrl: string) {
    const data = await this.roomsService.removeImage(id, imageUrl);
    return { message: 'Xóa ảnh thành công', data };
  }
}
