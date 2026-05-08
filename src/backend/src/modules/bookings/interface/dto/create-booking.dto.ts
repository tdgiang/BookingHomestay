import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsEnum, IsDateString, IsInt, Min, IsOptional, IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingType } from '@prisma/client';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-room-id' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ enum: BookingType, example: BookingType.NIGHTLY })
  @IsEnum(BookingType)
  bookingType: BookingType;

  @ApiProperty({ example: '2026-06-10T14:00:00.000Z' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2026-06-12T12:00:00.000Z' })
  @IsDateString()
  checkOut: string;

  @ApiPropertyOptional({ example: 3, description: 'Số giờ thuê (HOURLY, tối thiểu 2)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  durationHours?: number;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'guest@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 2, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  children?: number;

  @ApiPropertyOptional({ example: 'Cần thêm gối' })
  @IsOptional()
  @IsString()
  specialRequest?: string;
}
