import { Injectable, NotFoundException } from '@nestjs/common';
import { GuestsRepository } from '../infrastructure/guests.repository';
import { CreateGuestDto } from '../interface/dto/create-guest.dto';
import { UpdateGuestDto } from '../interface/dto/update-guest.dto';
import { GuestQueryDto } from '../interface/dto/guest-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GuestsService {
  constructor(private readonly repository: GuestsRepository) {}

  async findOrCreate(dto: CreateGuestDto) {
    const existing = await this.repository.findByPhone(dto.phone);
    if (existing) {
      return this.repository.update({
        where: { id: existing.id },
        data: { fullName: dto.fullName, email: dto.email ?? existing.email },
      });
    }
    return this.repository.create({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      tags: dto.tags ?? [],
    });
  }

  async findAll(query: GuestQueryDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, tags } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.GuestWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tags?.length) {
      where.tags = { hasSome: tags };
    }
    const [items, total] = await this.repository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const guest = await this.repository.findOne({ id });
    if (!guest) throw new NotFoundException(`Không tìm thấy khách: ${id}`);
    return guest;
  }

  async update(id: string, dto: UpdateGuestDto) {
    await this.findOne(id);
    return this.repository.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repository.softRemove({ id });
  }

  async getHistory(id: string) {
    await this.findOne(id);
    return this.repository.findHistoryByGuestId(id);
  }

  async exportCsv(search?: string, tags?: string[]): Promise<string> {
    const where: Prisma.GuestWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tags?.length) {
      where.tags = { hasSome: tags };
    }
    const guests = await this.repository.findAllForExport(where);
    const header = 'ID,Họ tên,Số điện thoại,Email,Tags,Ghi chú,Ngày tạo';
    const rows = guests.map((g) =>
      [
        g.id,
        `"${g.fullName.replace(/"/g, '""')}"`,
        g.phone,
        g.email ?? '',
        `"${g.tags.join('; ')}"`,
        `"${(g.notes ?? '').replace(/"/g, '""')}"`,
        new Date(g.createdAt).toLocaleDateString('vi-VN'),
      ].join(','),
    );
    return [header, ...rows].join('\n');
  }
}
