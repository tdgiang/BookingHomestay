/**
 * Controller specs — BookingsPublicController
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BookingsPublicController } from './bookings-public.controller';
import { BookingsService } from '../application/bookings.service';

const BOOKING = { id: 'b1', bookingCode: 'HSB-20260701-ABCD', totalPrice: 700000 };

describe('BookingsPublicController', () => {
  let controller: BookingsPublicController;
  let service: jest.Mocked<BookingsService>;

  beforeEach(async () => {
    const mockService = { create: jest.fn(), findByCode: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsPublicController],
      providers: [{ provide: BookingsService, useValue: mockService }],
    }).compile();

    controller = module.get(BookingsPublicController);
    service = module.get(BookingsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('create — delegates to service.create', async () => {
    service.create.mockResolvedValue({ booking: BOOKING, priceResult: {} } as any);
    const result = await controller.create({ roomId: 'r1', fullName: 'A', phone: '090' } as any);
    expect(service.create).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('findByCode — passes bookingCode to service.findByCode', async () => {
    service.findByCode.mockResolvedValue(BOOKING as any);
    const result = await controller.findByCode('HSB-20260701-ABCD');
    expect(service.findByCode).toHaveBeenCalledWith('HSB-20260701-ABCD');
    expect(result.data).toEqual(BOOKING);
  });
});
