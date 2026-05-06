import { Module } from '@nestjs/common';
import { PricingService } from './application/pricing.service';
import { PricingRepository } from './infrastructure/pricing.repository';
import { PricingAdminController } from './interface/pricing-admin.controller';

@Module({
  controllers: [PricingAdminController],
  providers: [PricingService, PricingRepository],
  exports: [PricingService],
})
export class PricingModule {}
