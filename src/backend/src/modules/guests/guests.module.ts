import { Module } from '@nestjs/common';
import { GuestsService } from './application/guests.service';
import { GuestsRepository } from './infrastructure/guests.repository';
import { GuestsAdminController } from './interface/guests-admin.controller';

@Module({
  controllers: [GuestsAdminController],
  providers: [GuestsService, GuestsRepository],
  exports: [GuestsService],
})
export class GuestsModule {}
