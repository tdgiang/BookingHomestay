import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { BaseRepository } from '../../../common/infrastructure/base.repository';

@Injectable()
export class UsersRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereUniqueInput,
  Prisma.UserWhereInput,
  Prisma.UserOrderByWithRelationInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.user as any);
  }

  /** Excludes password and deletedAt from standard responses. */
  readonly userSelect: Prisma.UserSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };
}
