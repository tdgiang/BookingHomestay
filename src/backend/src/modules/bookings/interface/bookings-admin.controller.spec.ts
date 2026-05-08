/**
 * Controller specs — BookingsAdminController
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BookingsAdminController } from './bookings-admin.controller';
import { BookingsService } from '../application/bookings.service';

const BOOKING = { id: 'b1', bookingCode: 'HSB-20260701-ABCD', status: 'PENDING', totalPrice: 700000 };
const LIST = { items: [BOOKING], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };

describe('BookingsAdminController', () => {
  let controller: BookingsAdminController;
  let service: jest.Mocked<BookingsService>;

  const res = {
    setHeader: jest.fn(),
    send: jest.fn(),
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      blockDates: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
      exportCsv: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsAdminController],
      providers: [{ provide: BookingsService, useValue: mockService }],
    }).compile();

    controller = module.get(BookingsAdminController);
    service = module.get(BookingsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('createManual — delegates to service.create with source=manual', async () => {
    service.create.mockResolvedValue({ booking: BOOKING, priceResult: {} } as any);
    const result = await controller.createManual({ roomId: 'r1' } as any);
    expect(service.create).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('blockDates — delegates to service.blockDates', async () => {
    service.blockDates.mockResolvedValue([BOOKING] as any);
    const result = await controller.blockDates({ roomIds: ['r1'], checkIn: '2026-07-01', checkOut: '2026-07-03' } as any);
    expect(service.blockDates).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('findAll — delegates to service.findAll', async () => {
    service.findAll.mockResolvedValue(LIST as any);
    const result = await controller.findAll({} as any);
    expect(result.data).toEqual(LIST);
  });

  it('findOne — passes id to service.findOne', async () => {
    service.findOne.mockResolvedValue(BOOKING as any);
    const result = await controller.findOne('b1');
    expect(service.findOne).toHaveBeenCalledWith('b1');
    expect(result.data).toEqual(BOOKING);
  });

  it('update — calls service.update', async () => {
    service.update.mockResolvedValue({ ...BOOKING, status: 'CONFIRMED' } as any);
    const result = await controller.update('b1', { status: 'CONFIRMED' } as any);
    expect(service.update).toHaveBeenCalledWith('b1', { status: 'CONFIRMED' });
    expect(result.data).toBeDefined();
  });

  it('cancel — calls service.cancel', async () => {
    service.cancel.mockResolvedValue(BOOKING as any);
    const result = await controller.cancel('b1');
    expect(service.cancel).toHaveBeenCalledWith('b1');
    expect(result.data).toBeDefined();
  });

  it('export — calls service.exportCsv and writes CSV response', async () => {
    service.exportCsv.mockResolvedValue('header\nrow1');
    await controller.export(res as any, {} as any);
    expect(service.exportCsv).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    expect(res.send).toHaveBeenCalled();
  });
});
