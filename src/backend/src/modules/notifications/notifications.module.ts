import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsService } from './application/notifications.service';
import { CheckInReminderProcessor, CHECK_IN_REMINDER_QUEUE } from './application/check-in-reminder.processor';
import { NotificationsGateway } from './gateways/notifications.gateway';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') ?? 'localhost',
          port: config.get<number>('REDIS_PORT') ?? 6379,
          ...(config.get('REDIS_PASSWORD') ? { password: config.get('REDIS_PASSWORD') } : {}),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: CHECK_IN_REMINDER_QUEUE }),
  ],
  providers: [NotificationsService, CheckInReminderProcessor, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
