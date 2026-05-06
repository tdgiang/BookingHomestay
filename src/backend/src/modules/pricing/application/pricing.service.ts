import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PricingRepository } from '../infrastructure/pricing.repository';
import { CreateRoomPriceDto } from '../interface/dto/create-room-price.dto';
import { UpdateRoomPriceDto } from '../interface/dto/update-room-price.dto';
import { BookingType, PriceType, RoomPrice } from '@prisma/client';

export interface NightBreakdown {
  date: string;       // YYYY-MM-DD
  price: number;
  priceType: PriceType;
}

export interface PriceResult {
  bookingType: BookingType;
  nights?: number;
  hours?: number;
  breakdown: NightBreakdown[];
  subtotal: number;
  discount: number;   // VND discount amount
  discountRate: number;
  totalPrice: number;
}

@Injectable()
export class PricingService {
  constructor(
    private readonly repository: PricingRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Admin CRUD ────────────────────────────────────────────────────────────

  async createPrice(roomId: string, dto: CreateRoomPriceDto) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException(`Không tìm thấy phòng: ${roomId}`);

    return this.repository.create({
      room: { connect: { id: roomId } },
      priceType: dto.priceType,
      price: dto.price,
      startDate: dto.startDate,
      endDate: dto.endDate,
      daysOfWeek: dto.daysOfWeek ?? [],
      hourFrom: dto.hourFrom,
      hourTo: dto.hourTo,
      minNights: dto.minNights,
      discount: dto.discount,
    });
  }

  async updatePrice(priceId: string, dto: UpdateRoomPriceDto) {
    const price = await this.repository.findOne({ id: priceId });
    if (!price) throw new NotFoundException(`Không tìm thấy rule giá: ${priceId}`);
    return this.repository.update({ where: { id: priceId }, data: dto });
  }

  async deletePrice(priceId: string) {
    const price = await this.repository.findOne({ id: priceId });
    if (!price) throw new NotFoundException(`Không tìm thấy rule giá: ${priceId}`);
    return this.repository.remove({ id: priceId });
  }

  async getPricesByRoom(roomId: string) {
    return this.repository.findByRoomId(roomId);
  }

  // ─── Price Calculation ─────────────────────────────────────────────────────

  async calculatePrice(
    roomId: string,
    bookingType: BookingType,
    checkIn: Date,
    checkOut?: Date,
    durationHours?: number,
  ): Promise<PriceResult> {
    const prices = await this.repository.findByRoomId(roomId);

    if (bookingType === BookingType.NIGHTLY) {
      if (!checkOut) throw new BadRequestException('checkOut là bắt buộc cho đặt phòng theo đêm');
      return this.calcNightly(prices, checkIn, checkOut);
    } else {
      if (!durationHours || durationHours < 2) {
        throw new BadRequestException('Số giờ thuê tối thiểu là 2 giờ');
      }
      return this.calcHourly(prices, checkIn, durationHours);
    }
  }

  // ─── Availability Check ────────────────────────────────────────────────────

  async checkAvailability(roomId: string, checkIn: Date, checkOut: Date) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, isActive: true, deletedAt: null },
    });
    if (!room) throw new NotFoundException(`Không tìm thấy phòng: ${roomId}`);

    const conflicting = await this.prisma.booking.count({
      where: {
        roomId,
        deletedAt: null,
        status: { notIn: ['CANCELLED'] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    });

    return { available: conflicting === 0, roomId, checkIn, checkOut };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private calcNightly(prices: RoomPrice[], checkIn: Date, checkOut: Date): PriceResult {
    const nights = this.diffDays(checkIn, checkOut);
    if (nights < 1) throw new BadRequestException('Thời gian lưu trú tối thiểu 1 đêm');

    const nightlyPrices = prices.filter(
      (p) => p.priceType !== PriceType.HOURLY,
    );

    const breakdown: NightBreakdown[] = [];
    for (let i = 0; i < nights; i++) {
      const night = new Date(checkIn);
      night.setDate(night.getDate() + i);
      const { price, priceType } = this.resolveNightlyPrice(nightlyPrices, night);
      breakdown.push({ date: this.toDateStr(night), price, priceType });
    }

    const subtotal = breakdown.reduce((s, b) => s + b.price, 0);

    // Long-stay discount: find the applicable rule with highest minNights <= actual nights
    const discountRule = nightlyPrices
      .filter((p) => p.minNights != null && p.minNights <= nights && p.discount != null)
      .sort((a, b) => (b.minNights ?? 0) - (a.minNights ?? 0))[0];

    const discountRate = discountRule?.discount ?? 0;
    const discount = Math.round(subtotal * discountRate);

    return {
      bookingType: BookingType.NIGHTLY,
      nights,
      breakdown,
      subtotal,
      discount,
      discountRate,
      totalPrice: subtotal - discount,
    };
  }

  private resolveNightlyPrice(
    prices: RoomPrice[],
    night: Date,
  ): { price: number; priceType: PriceType } {
    const dow = night.getDay(); // 0=Sun..6=Sat

    // Priority 1: SEASONAL — has explicit date range matching this night
    const seasonal = prices
      .filter(
        (p) =>
          p.priceType === PriceType.SEASONAL_NIGHTLY &&
          p.startDate != null &&
          p.endDate != null &&
          night >= p.startDate &&
          night <= p.endDate &&
          (p.daysOfWeek.length === 0 || p.daysOfWeek.includes(dow)),
      )
      .sort((a, b) => b.price - a.price)[0]; // highest wins when multiple overlap
    if (seasonal) return { price: seasonal.price, priceType: PriceType.SEASONAL_NIGHTLY };

    // Priority 2: WEEKEND
    const weekend = prices.find(
      (p) =>
        p.priceType === PriceType.WEEKEND_NIGHTLY &&
        (p.daysOfWeek.length === 0 || p.daysOfWeek.includes(dow)),
    );
    if (weekend) {
      const isWeekend = [0, 5, 6].includes(dow);
      if (isWeekend) return { price: weekend.price, priceType: PriceType.WEEKEND_NIGHTLY };
    }

    // Priority 3: BASE
    const base = prices.find((p) => p.priceType === PriceType.BASE_NIGHTLY);
    if (base) return { price: base.price, priceType: PriceType.BASE_NIGHTLY };

    return { price: 0, priceType: PriceType.BASE_NIGHTLY };
  }

  private calcHourly(
    prices: RoomPrice[],
    startTime: Date,
    durationHours: number,
  ): PriceResult {
    const startHour = startTime.getHours();
    const hourlyPrices = prices.filter((p) => p.priceType === PriceType.HOURLY);

    const matched = hourlyPrices.find((p) => {
      if (p.hourFrom == null || p.hourTo == null) return true; // no restriction
      return this.isHourInRange(startHour, p.hourFrom, p.hourTo);
    });

    const pricePerHour = matched?.price ?? 0;
    const subtotal = pricePerHour * durationHours;

    const breakdown: NightBreakdown[] = [
      {
        date: this.toDateStr(startTime),
        price: subtotal,
        priceType: PriceType.HOURLY,
      },
    ];

    return {
      bookingType: BookingType.HOURLY,
      hours: durationHours,
      breakdown,
      subtotal,
      discount: 0,
      discountRate: 0,
      totalPrice: subtotal,
    };
  }

  /** Returns true if `hour` falls within [from, to) handling overnight wrap. */
  isHourInRange(hour: number, from: number, to: number): boolean {
    if (from < to) return hour >= from && hour < to;
    // Wrap-around: e.g. 22-8 means 22,23,0..7
    return hour >= from || hour < to;
  }

  private diffDays(a: Date, b: Date): number {
    return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  }

  private toDateStr(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
