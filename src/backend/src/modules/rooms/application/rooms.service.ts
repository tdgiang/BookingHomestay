import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { RoomsRepository } from '../infrastructure/rooms.repository';
import { UploadsService } from '../../uploads/uploads.service';
import { CreateRoomDto } from '../interface/dto/create-room.dto';
import { UpdateRoomDto } from '../interface/dto/update-room.dto';
import { RoomQueryDto } from '../interface/dto/room-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);
  private readonly listCacheKeys = new Set<string>();
  private readonly cacheTtl = 60000;

  constructor(
    private readonly repository: RoomsRepository,
    private readonly uploadsService: UploadsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(dto: CreateRoomDto) {
    const room = await this.repository.create({
      name: dto.name,
      description: dto.description,
      capacity: dto.capacity,
      area: dto.area,
      floor: dto.floor,
      amenities: dto.amenities ?? [],
      images: [],
      isActive: dto.isActive ?? true,
    });
    await this.invalidateListCache();
    this.logger.log(`Room created: ${room.id}`);
    return room;
  }

  async findAll(query: RoomQueryDto, adminView = false) {
    const cacheKey = `rooms_list_${JSON.stringify({ ...query, adminView })}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, isActive, capacity } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RoomWhereInput = { deletedAt: null };
    if (!adminView) where.isActive = true;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (capacity) where.capacity = { gte: capacity };

    const [items, total] = await this.repository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
      select: this.repository.roomSelect,
    });

    const result = { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    this.listCacheKeys.add(cacheKey);
    await this.cacheManager.set(cacheKey, result, this.cacheTtl);
    return result;
  }

  async findOne(id: string) {
    const cacheKey = `room_${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const room = await this.repository.findOne({ id }, this.repository.roomWithPricesSelect);
    if (!room) throw new NotFoundException(`Không tìm thấy phòng với ID: ${id}`);

    await this.cacheManager.set(cacheKey, room, this.cacheTtl);
    return room;
  }

  async update(id: string, dto: UpdateRoomDto) {
    await this.findOne(id);
    const room = await this.repository.update({ where: { id }, data: dto });
    await this.invalidateRoomCache(id);
    this.logger.log(`Room updated: ${id}`);
    return room;
  }

  async remove(id: string) {
    await this.findOne(id);
    const room = await this.repository.softRemove({ id });
    await this.invalidateRoomCache(id);
    this.logger.log(`Room soft-deleted: ${id}`);
    return room;
  }

  async addImages(id: string, files: Express.Multer.File[]) {
    const room = await this.findOne(id) as any;
    const newUrls = files.map((f) => this.uploadsService.getImageUrl(id, f.filename));
    const images = [...(room.images ?? []), ...newUrls];
    const updated = await this.repository.update({ where: { id }, data: { images } });
    await this.invalidateRoomCache(id);
    return updated;
  }

  async removeImage(id: string, imageUrl: string) {
    const room = await this.findOne(id) as any;
    const images: string[] = (room.images ?? []).filter((img: string) => img !== imageUrl);
    this.uploadsService.deleteFile(imageUrl);
    const updated = await this.repository.update({ where: { id }, data: { images } });
    await this.invalidateRoomCache(id);
    return updated;
  }

  private async invalidateRoomCache(id: string) {
    await this.cacheManager.del(`room_${id}`);
    await this.invalidateListCache();
  }

  private async invalidateListCache() {
    await Promise.all([...this.listCacheKeys].map((k) => this.cacheManager.del(k)));
    this.listCacheKeys.clear();
  }
}
