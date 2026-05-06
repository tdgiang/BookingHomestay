import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Room } from '@prisma/client';
import { BaseRepository } from '../../../common/infrastructure/base.repository';

@Injectable()
export class RoomsRepository extends BaseRepository<
  Room,
  Prisma.RoomCreateInput,
  Prisma.RoomUpdateInput,
  Prisma.RoomWhereUniqueInput,
  Prisma.RoomWhereInput,
  Prisma.RoomOrderByWithRelationInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.room as any);
  }

  readonly roomSelect: Prisma.RoomSelect = {
    id: true,
    name: true,
    description: true,
    capacity: true,
    area: true,
    floor: true,
    amenities: true,
    images: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };

  readonly roomWithPricesSelect: Prisma.RoomSelect = {
    ...this.roomSelect,
    prices: {
      select: {
        id: true,
        priceType: true,
        price: true,
        startDate: true,
        endDate: true,
        daysOfWeek: true,
        hourFrom: true,
        hourTo: true,
        minNights: true,
        discount: true,
      },
    },
  };
}
