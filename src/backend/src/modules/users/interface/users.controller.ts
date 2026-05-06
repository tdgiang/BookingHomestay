import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from '../application/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Người dùng (Users)')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Tạo người dùng mới (Admin only)' })
  @ApiResponse({ status: 201, description: 'Tạo người dùng thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const data = await this.usersService.create(createUserDto);
    res.header('Location', `/api/v1/users/${data.id}`);
    return { message: 'Tạo người dùng thành công', data };
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Lấy danh sách người dùng (Admin only, hỗ trợ phân trang & tìm kiếm)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng với metadata phân trang' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async findAll(@Query() query: UserQueryDto) {
    const data = await this.usersService.findAll(query);
    return { message: 'Lấy danh sách người dùng thành công', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
  @ApiParam({ name: 'id', description: 'UUID của người dùng' })
  @ApiResponse({ status: 200, description: 'Thông tin người dùng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findOne(id);
    return { message: 'Lấy thông tin người dùng thành công', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiParam({ name: 'id', description: 'UUID của người dùng' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const data = await this.usersService.update(id, updateUserDto);
    return { message: 'Cập nhật người dùng thành công', data };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa mềm người dùng (Admin only)' })
  @ApiParam({ name: 'id', description: 'UUID của người dùng' })
  @ApiResponse({ status: 200, description: 'Xóa thành công (soft delete)' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async remove(@Param('id') id: string) {
    const data = await this.usersService.remove(id);
    return { message: 'Xóa người dùng thành công', data };
  }
}
