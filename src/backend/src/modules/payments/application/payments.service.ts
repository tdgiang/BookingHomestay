import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentsRepository } from '../infrastructure/payments.repository';
import { PaymentWebhookDto } from '../interface/dto/webhook.dto';
import { ConfirmPaymentDto } from '../interface/dto/confirm-payment.dto';
import { PaymentStatus, BookingStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly repository: PaymentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async handleWebhook(dto: PaymentWebhookDto) {
    // Extract booking code from description (format: HSB-YYYYMMDD-XXXX)
    const match = dto.description.match(/HSB-\d{8}-[A-Z0-9]{4}/);
    if (!match) {
      this.logger.warn(`Webhook: no booking code found in description: ${dto.description}`);
      return { received: true };
    }

    const bookingCode = match[0];
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode },
      include: { payment: true },
    });

    if (!booking || !booking.payment) {
      this.logger.warn(`Webhook: booking not found for code ${bookingCode}`);
      return { received: true };
    }

    if (booking.payment.status === PaymentStatus.PAID) {
      return { received: true, alreadyPaid: true };
    }

    if (Math.abs(dto.amount - booking.payment.amount) > 1000) {
      this.logger.warn(
        `Webhook: amount mismatch for ${bookingCode}: expected ${booking.payment.amount}, got ${dto.amount}`,
      );
      return { received: true, amountMismatch: true };
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: PaymentStatus.PAID,
          bankRef: dto.bankRef,
          paidAt: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
        },
      }),
      this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CONFIRMED },
      }),
    ]);

    this.logger.log(`Webhook: confirmed payment for booking ${bookingCode}`);
    return { received: true, bookingCode, confirmed: true };
  }

  async confirmManual(paymentId: string, adminId: string, dto: ConfirmPaymentDto) {
    const payment = await this.repository.findOne({ id: paymentId });
    if (!payment) throw new NotFoundException(`Không tìm thấy payment: ${paymentId}`);
    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Thanh toán đã được xác nhận trước đó');
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PAID,
          bankRef: dto.bankRef,
          paidAt: new Date(),
          confirmedBy: adminId,
        },
      }),
      this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: BookingStatus.CONFIRMED },
      }),
    ]);

    return this.repository.findOne({ id: paymentId });
  }
}
