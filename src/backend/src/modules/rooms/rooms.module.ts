import { Module } from '@nestjs/common';
import { RoomsService } from './application/rooms.service';
import { RoomsRepository } from './infrastructure/rooms.repository';
import { RoomsAdminController } from './interface/rooms-admin.controller';
import { RoomsPublicController } from './interface/rooms-public.controller';
import { UploadsModule } from '../uploads/uploads.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [UploadsModule, PricingModule],
  controllers: [RoomsAdminController, RoomsPublicController],
  providers: [RoomsService, RoomsRepository],
  exports: [RoomsService],
})
export class RoomsModule {}
