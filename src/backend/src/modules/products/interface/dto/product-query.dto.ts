import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

const PRODUCT_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'price', 'stock'] as const;

export class ProductQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Trường sắp xếp',
    enum: PRODUCT_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(PRODUCT_SORT_FIELDS)
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Lọc theo danh mục',
    example: 'Smartphones',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái hoạt động',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
