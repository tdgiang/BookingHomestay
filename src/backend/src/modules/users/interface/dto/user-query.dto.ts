import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEmail, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

const USER_SORT_FIELDS = ['createdAt', 'updatedAt', 'email', 'firstName', 'lastName'] as const;

export class UserQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Trường sắp xếp',
    enum: USER_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(USER_SORT_FIELDS)
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Lọc theo email chính xác' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Lọc theo trạng thái hoạt động' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
