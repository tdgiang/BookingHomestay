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
import { ProductsService } from '../application/products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Sản phẩm (Products)')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Tạo sản phẩm mới (Admin only)' })
  @ApiResponse({ status: 201, description: 'Tạo sản phẩm thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const data = await this.productsService.create(createProductDto);
    res.header('Location', `/api/v1/products/${(data as any).id}`);
    return { message: 'Tạo sản phẩm thành công', data };
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm (Public)' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm với metadata phân trang' })
  async findAll(@Query() query: ProductQueryDto) {
    const data = await this.productsService.findAll(query);
    return { message: 'Lấy danh sách sản phẩm thành công', data };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm (Public)' })
  @ApiParam({ name: 'id', description: 'UUID của sản phẩm' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  async findOne(@Param('id') id: string) {
    const data = await this.productsService.findOne(id);
    return { message: 'Lấy chi tiết sản phẩm thành công', data };
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cập nhật sản phẩm (Admin only)' })
  @ApiParam({ name: 'id', description: 'UUID của sản phẩm' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const data = await this.productsService.update(id, updateProductDto);
    return { message: 'Cập nhật sản phẩm thành công', data };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa sản phẩm (Admin only, soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID của sản phẩm' })
  @ApiResponse({ status: 200, description: 'Xóa thành công (soft delete)' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  async remove(@Param('id') id: string) {
    const data = await this.productsService.remove(id);
    return { message: 'Xóa sản phẩm thành công', data };
  }
}
