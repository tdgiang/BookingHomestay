import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class PaymentWebhookDto {
  @ApiProperty({ description: 'Mã tham chiếu ngân hàng (bankRef)' })
  @IsString()
  @IsNotEmpty()
  bankRef: string;

  @ApiProperty({ description: 'Số tiền chuyển khoản' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Nội dung chuyển khoản (chứa booking code)' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Thời điểm giao dịch (ISO string)' })
  @IsOptional()
  @IsString()
  transactionDate?: string;
}
