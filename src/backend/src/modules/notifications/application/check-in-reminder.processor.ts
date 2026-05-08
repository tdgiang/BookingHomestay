import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

export const CHECK_IN_REMINDER_QUEUE = 'check-in-reminder';

@Processor(CHECK_IN_REMINDER_QUEUE)
export class CheckInReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckInReminderProcessor.name);

  async process(job: Job) {
    const { bookingCode, guestName, guestEmail, checkIn } = job.data;
    // TODO: integrate with SMTP/SendGrid to send real emails
    this.logger.log(
      `[Email Queue] Check-in reminder → ${guestName} <${guestEmail}> — Booking: ${bookingCode} — Check-in: ${checkIn}`,
    );
  }
}
