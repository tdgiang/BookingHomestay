import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BookingsRepository } from '../infrastructure/bookings.repository';
import { GuestsService } from '../../guests/application/guests.service';
import { PricingService } from '../../pricing/application/pricing.service';
import { CreateBookingDto } from '../interface/dto/create-booking.dto';
import { UpdateBookingDto } from '../interface/dto/update-booking.dto';
import { BookingQueryDto } from '../interface/dto/booking-query.dto';
import { BookingType, BookingStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function nanoid(size = 4): string {
  return Array.from(randomBytes(size)).map((b) => CHARS[b % CHARS.length]).join('');
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly repository: BookingsRepository,
    private readonly guestsService: GuestsService,
    private readonly pricingService: PricingService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateBookingDto) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (checkIn >= checkOut) {
      throw new BadRequestException('checkOut phải sau checkIn');
    }

    // 1. Verify room exists and is active
    const room = await this.prisma.room.findFirst({
      where: { id: dto.roomId, isActive: true, deletedAt: null },
    });
    if (!room) throw new NotFoundException(`Không tìm thấy phòng: ${dto.roomId}`);

    // 2. Check availability
    const conflicts = await this.repository.countConflicts(dto.roomId, checkIn, checkOut);
    if (conflicts > 0) {
      throw new ConflictException('Phòng đã được đặt trong khoảng thời gian này');
    }

    // 3. Calculate price
    const priceResult = await this.pricingService.calculatePrice(
      dto.roomId,
      dto.bookingType as BookingType,
      checkIn,
      dto.bookingType === BookingType.NIGHTLY ? checkOut : undefined,
      dto.durationHours,
    );

    // 4. Find or create guest
    const guest = await this.guestsService.findOrCreate({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
    });

    // 5. Generate booking code
    const dateStr = checkIn.toISOString().slice(0, 10).replace(/-/g, '');
    const bookingCode = `HSB-${dateStr}-${nanoid()}`;

    // 6. Create booking + payment in a transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          bookingCode,
          roomId: dto.roomId,
          guestId: guest.id,
          bookingType: dto.bookingType,
          checkIn,
          checkOut,
          durationHours: dto.durationHours,
          adults: dto.adults ?? 1,
          children: dto.children ?? 0,
          specialRequest: dto.specialRequest,
          totalPrice: priceResult.totalPrice,
          source: 'direct',
        },
        include: {
          room: { select: { id: true, name: true, images: true } },
          guest: { select: { id: true, fullName: true, phone: true, email: true } },
        },
      });

      await tx.payment.create({
        data: {
          bookingId: created.id,
          amount: priceResult.totalPrice,
          method: 'bank_transfer',
          status: 'PENDING',
        },
      });

      return created;
    });

    return { booking, priceResult };
  }

  async findByCode(bookingCode: string) {
    const booking = await this.repository.findByCode(bookingCode);
    if (!booking) throw new NotFoundException(`Không tìm thấy đặt phòng: ${bookingCode}`);
    return booking;
  }

  async findAll(query: BookingQueryDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status, roomId, date } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = { deletedAt: null };
    if (status) where.status = status;
    if (roomId) where.roomId = roomId;
    if (date) {
      const day = new Date(date);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      where.checkIn = { gte: day, lt: next };
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
    const booking = await this.repository.findOne({ id });
    if (!booking) throw new NotFoundException(`Không tìm thấy booking: ${id}`);
    return booking;
  }

  async update(id: string, dto: UpdateBookingDto) {
    await this.findOne(id);
    const updated = await this.repository.update({ where: { id }, data: dto });
    return updated;
  }

  async cancel(id: string) {
    const booking = await this.findOne(id);
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking đã bị hủy trước đó');
    }
    return this.repository.softRemove({ id });
  }
}
