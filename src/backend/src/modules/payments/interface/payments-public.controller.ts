import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from '../application/payments.service';
import { PaymentWebhookDto } from './dto/webhook.dto';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Thanh toán (Public)')
@Public()
@Controller('payments')
export class PaymentsPublicController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook nhận callback từ ngân hàng' })
  async webhook(@Body() dto: PaymentWebhookDto) {
    const data = await this.paymentsService.handleWebhook(dto);
    return { message: 'Đã nhận webhook', data };
  }
}
