import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsArray, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PriceType } from '@prisma/client';

export class CreateRoomPriceDto {
  @ApiProperty({ enum: PriceType, example: PriceType.BASE_NIGHTLY })
  @IsEnum(PriceType)
  priceType: PriceType;

  @ApiProperty({ example: 350000, description: 'Giá VND' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Ngày bắt đầu áp dụng (seasonal)' })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({
    example: [5, 6, 0],
    description: 'Ngày trong tuần: 0=CN, 1=T2...6=T7. Rỗng = tất cả ngày',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[];

  @ApiPropertyOptional({ example: 8, description: 'Giờ bắt đầu khung giờ (HOURLY, 0-23)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(23)
  hourFrom?: number;

  @ApiPropertyOptional({ example: 22, description: 'Giờ kết thúc khung giờ (HOURLY, 0-23, exclusive)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(23)
  hourTo?: number;

  @ApiPropertyOptional({ example: 7, description: 'Số đêm tối thiểu để áp dụng giảm giá dài hạn' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minNights?: number;

  @ApiPropertyOptional({ example: 0.1, description: 'Tỷ lệ giảm giá (0.1 = 10%)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  discount?: number;
}
