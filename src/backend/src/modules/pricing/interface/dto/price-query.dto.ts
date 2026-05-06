import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingType } from '@prisma/client';

export class PriceQueryDto {
  @ApiProperty({ enum: BookingType, example: BookingType.NIGHTLY })
  @IsEnum(BookingType)
  bookingType: BookingType;

  @ApiProperty({ example: '2026-06-10T14:00:00', description: 'Thời điểm check-in (ISO 8601)' })
  @IsDateString()
  checkIn: string;

  @ApiPropertyOptional({ example: '2026-06-12T12:00:00', description: 'Thời điểm check-out (NIGHTLY)' })
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiPropertyOptional({ example: 3, description: 'Số giờ thuê (HOURLY, tối thiểu 2)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  durationHours?: number;
}

export class AvailabilityQueryDto {
  @ApiProperty({ example: '2026-06-10T14:00:00' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2026-06-12T12:00:00' })
  @IsDateString()
  checkOut: string;
}
