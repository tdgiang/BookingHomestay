import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UsersRepository } from '../infrastructure/users.repository';
import { CreateUserDto } from '../interface/dto/create-user.dto';
import { UpdateUserDto } from '../interface/dto/update-user.dto';
import { UserQueryDto } from '../interface/dto/user-query.dto';
import * as bcrypt from 'bcrypt';
import { Prisma, Role } from '@prisma/client';

/** Public user shape — no password, no deletedAt. Used by guards and auth service. */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly listCacheKeys = new Set<string>();

  constructor(
    private readonly repository: UsersRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.repository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    await this.invalidateListCache();
    this.logger.log(`User created: ${user.email}`);
    const { password: _password, ...result } = user;
    return result;
  }

  async findAll(query: UserQueryDto) {
    const cacheKey = `users_list_${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      email,
      isActive,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (email) where.email = email;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await this.repository.findAll({
      skip,
      take: limit,
      where,
      orderBy: {
        [sortBy as keyof Prisma.UserOrderByWithRelationInput]: sortOrder,
      },
      select: this.repository.userSelect,
    });

    const result = {
      items: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    this.listCacheKeys.add(cacheKey);
    await this.cacheManager.set(cacheKey, result, 60000);
    return result;
  }

  async findOne(id: string): Promise<AuthUser> {
    const cacheKey = `user_${id}`;
    const cached = await this.cacheManager.get<AuthUser>(cacheKey);
    if (cached) return cached;

    const user = await this.repository.findOne(
      { id },
      this.repository.userSelect,
    );
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }

    const authUser = user as unknown as AuthUser;
    await this.cacheManager.set(cacheKey, authUser, 60000);
    return authUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id); // ensure exists

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.repository.update({
      where: { id },
      data: updateUserDto,
    });
    await this.invalidateUserCache(id);
    this.logger.log(`User updated: ${id}`);

    const { password: _password, ...result } = user;
    return result;
  }

  async remove(id: string) {
    await this.findOne(id); // ensure exists

    const user = await this.repository.softRemove({ id });
    await this.invalidateUserCache(id);
    this.logger.log(`User soft-deleted: ${id}`);

    const { password: _password, ...result } = user;
    return result;
  }

  /** Finds an active, non-deleted user by email. Used for authentication. */
  async findByEmail(email: string) {
    return this.repository.findFirst({ email, deletedAt: null } as any);
  }

  private async invalidateUserCache(id: string) {
    await this.cacheManager.del(`user_${id}`);
    await this.invalidateListCache();
  }

  private async invalidateListCache() {
    await Promise.all(
      [...this.listCacheKeys].map((k) => this.cacheManager.del(k)),
    );
    this.listCacheKeys.clear();
  }
}
