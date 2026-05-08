import { Module } from '@nestjs/common';
import { BookingsService } from './application/bookings.service';
import { BookingsRepository } from './infrastructure/bookings.repository';
import { BookingsPublicController } from './interface/bookings-public.controller';
import { BookingsAdminController } from './interface/bookings-admin.controller';
import { GuestsModule } from '../guests/guests.module';
import { PricingModule } from '../pricing/pricing.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [GuestsModule, PricingModule, NotificationsModule],
  controllers: [BookingsPublicController, BookingsAdminController],
  providers: [BookingsService, BookingsRepository],
  exports: [BookingsService],
})
export class BookingsModule {}
