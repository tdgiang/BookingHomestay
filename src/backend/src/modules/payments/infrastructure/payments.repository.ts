import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Payment } from '@prisma/client';
import { BaseRepository } from '../../../common/infrastructure/base.repository';

@Injectable()
export class PaymentsRepository extends BaseRepository<
  Payment,
  Prisma.PaymentCreateInput,
  Prisma.PaymentUpdateInput,
  Prisma.PaymentWhereUniqueInput,
  Prisma.PaymentWhereInput,
  Prisma.PaymentOrderByWithRelationInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.payment as any);
  }

  async findByBookingId(bookingId: string): Promise<Payment | null> {
    return this.delegate.findFirst({ where: { bookingId } });
  }
}
