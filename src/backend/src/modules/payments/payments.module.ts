import { Module } from '@nestjs/common';
import { PaymentsService } from './application/payments.service';
import { PaymentsRepository } from './infrastructure/payments.repository';
import { PaymentsPublicController } from './interface/payments-public.controller';
import { PaymentsAdminController } from './interface/payments-admin.controller';

@Module({
  controllers: [PaymentsPublicController, PaymentsAdminController],
  providers: [PaymentsService, PaymentsRepository],
  exports: [PaymentsService],
})
export class PaymentsModule {}
