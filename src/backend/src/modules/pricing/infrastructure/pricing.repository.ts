import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, RoomPrice } from '@prisma/client';
import { BaseRepository } from '../../../common/infrastructure/base.repository';

@Injectable()
export class PricingRepository extends BaseRepository<
  RoomPrice,
  Prisma.RoomPriceCreateInput,
  Prisma.RoomPriceUpdateInput,
  Prisma.RoomPriceWhereUniqueInput,
  Prisma.RoomPriceWhereInput,
  Prisma.RoomPriceOrderByWithRelationInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.roomPrice as any);
  }

  async findByRoomId(roomId: string): Promise<RoomPrice[]> {
    const [prices] = await this.findAll({ where: { roomId } });
    return prices;
  }
}
