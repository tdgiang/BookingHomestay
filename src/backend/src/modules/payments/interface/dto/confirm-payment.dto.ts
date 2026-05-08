import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiPropertyOptional({ description: 'Mã tham chiếu ngân hàng' })
  @IsOptional()
  @IsString()
  bankRef?: string;
}
