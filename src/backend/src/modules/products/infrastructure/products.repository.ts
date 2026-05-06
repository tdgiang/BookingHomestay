import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Product } from '@prisma/client';
import { BaseRepository } from '../../../common/infrastructure/base.repository';

@Injectable()
export class ProductsRepository extends BaseRepository<
  Product,
  Prisma.ProductCreateInput,
  Prisma.ProductUpdateInput,
  Prisma.ProductWhereUniqueInput,
  Prisma.ProductWhereInput,
  Prisma.ProductOrderByWithRelationInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.product as any);
  }

  readonly productSelect: Prisma.ProductSelect = {
    id: true,
    name: true,
    description: true,
    price: true,
    stock: true,
    category: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };
}
