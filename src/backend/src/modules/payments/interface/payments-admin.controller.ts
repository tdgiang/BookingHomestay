import { Controller, Patch, Param, Body, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PaymentsService } from '../application/payments.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin — Thanh toán')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/payments')
export class PaymentsAdminController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Xác nhận thanh toán thủ công' })
  @ApiParam({ name: 'id', description: 'UUID payment' })
  async confirm(
    @Param('id') id: string,
    @Body() dto: ConfirmPaymentDto,
    @Request() req: any,
  ) {
    const adminId: string = req.user?.sub ?? req.user?.id;
    const data = await this.paymentsService.confirmManual(id, adminId, dto);
    return { message: 'Xác nhận thanh toán thành công', data };
  }
}
