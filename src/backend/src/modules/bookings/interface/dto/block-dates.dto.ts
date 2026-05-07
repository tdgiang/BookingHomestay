import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BlockDatesDto {
  @ApiProperty({ description: 'Danh sách roomId cần block', example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @IsString({ each: true })
  roomIds: string[];

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2026-08-05T23:59:59.000Z' })
  @IsDateString()
  checkOut: string;

  @ApiPropertyOptional({ example: 'Bảo trì phòng' })
  @IsOptional()
  @IsString()
  reason?: string;
}
