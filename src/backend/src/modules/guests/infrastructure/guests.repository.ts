import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Guest } from '@prisma/client';
import { BaseRepository } from '../../../common/infrastructure/base.repository';

@Injectable()
export class GuestsRepository extends BaseRepository<
  Guest,
  Prisma.GuestCreateInput,
  Prisma.GuestUpdateInput,
  Prisma.GuestWhereUniqueInput,
  Prisma.GuestWhereInput,
  Prisma.GuestOrderByWithRelationInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.guest as any);
  }

  async findByPhone(phone: string): Promise<Guest | null> {
    return this.delegate.findFirst({ where: { phone, deletedAt: null } });
  }

  async findHistoryByGuestId(guestId: string) {
    return this.prisma.booking.findMany({
      where: { guestId, deletedAt: null },
      include: {
        room: { select: { id: true, name: true, images: true } },
        payment: { select: { id: true, status: true, amount: true } },
      },
      orderBy: { checkIn: 'desc' },
    });
  }

  async findAllForExport(where: Prisma.GuestWhereInput): Promise<Guest[]> {
    return this.prisma.guest.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
}
