import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { CHECK_IN_REMINDER_QUEUE } from './check-in-reminder.processor';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue(CHECK_IN_REMINDER_QUEUE) private readonly reminderQueue: Queue,
    private readonly gateway: NotificationsGateway,
  ) {}

  async onNewBooking(data: {
    bookingCode: string;
    guestName: string;
    guestEmail?: string | null;
    roomName: string;
    checkIn: Date;
  }) {
    this.gateway.emitNewBooking({
      bookingCode: data.bookingCode,
      guestName: data.guestName,
      roomName: data.roomName,
      checkIn: data.checkIn.toISOString(),
    });

    if (data.guestEmail) {
      const reminderAt = new Date(data.checkIn);
      reminderAt.setDate(reminderAt.getDate() - 1);
      reminderAt.setHours(9, 0, 0, 0);
      const delay = reminderAt.getTime() - Date.now();
      if (delay > 0) {
        await this.reminderQueue.add(
          'check-in-reminder',
          {
            bookingCode: data.bookingCode,
            guestName: data.guestName,
            guestEmail: data.guestEmail,
            checkIn: data.checkIn.toISOString(),
          },
          { delay },
        );
      }
    }
  }
}
