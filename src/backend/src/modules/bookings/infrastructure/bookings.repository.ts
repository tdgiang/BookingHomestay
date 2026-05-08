import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Booking } from '@prisma/client';
import { BaseRepository } from '../../../common/infrastructure/base.repository';

@Injectable()
export class BookingsRepository extends BaseRepository<
  Booking,
  Prisma.BookingCreateInput,
  Prisma.BookingUpdateInput,
  Prisma.BookingWhereUniqueInput,
  Prisma.BookingWhereInput,
  Prisma.BookingOrderByWithRelationInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.booking as any);
  }

  async findByCode(bookingCode: string) {
    return this.prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        room: { select: { id: true, name: true, images: true, floor: true } },
        guest: { select: { id: true, fullName: true, phone: true, email: true } },
        payment: true,
      },
    });
  }

  async findAllAdmin(params: {
    skip: number;
    take: number;
    where: Prisma.BookingWhereInput;
    orderBy: Prisma.BookingOrderByWithRelationInput;
  }) {
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        ...params,
        include: {
          room: { select: { id: true, name: true, images: true } },
          guest: { select: { id: true, fullName: true, phone: true, email: true } },
          payment: { select: { id: true, amount: true, status: true, bankRef: true } },
        },
      }),
      this.prisma.booking.count({ where: params.where }),
    ]);
    return [items, total] as const;
  }

  async countConflicts(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    excludeId?: string,
  ): Promise<number> {
    return this.prisma.booking.count({
      where: {
        roomId,
        deletedAt: null,
        status: { notIn: ['CANCELLED'] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }
}
