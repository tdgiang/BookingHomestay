import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @ApiProperty({ example: 'Phòng Hoa Sen' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Phòng rộng, view biển, có ban công' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2, description: 'Sức chứa tối đa (người)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ example: 25.5, description: 'Diện tích m²' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  area?: number;

  @ApiPropertyOptional({ example: 2, description: 'Số tầng' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number;

  @ApiPropertyOptional({
    example: ['WiFi', 'AC', 'TV', 'Bếp'],
    description: 'Danh sách tiện nghi',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
