/**
 * Controller specs — RoomsPublicController
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RoomsPublicController } from './rooms-public.controller';
import { RoomsService } from '../application/rooms.service';
import { PricingService } from '../../pricing/application/pricing.service';

const ROOM = { id: 'r1', name: 'Phòng Hoa Sen' };
const LIST = { items: [ROOM], meta: { total: 1 } };
const AVAILABILITY = { available: true, conflicts: [] };
const PRICE = { totalPrice: 700000 };

describe('RoomsPublicController', () => {
  let controller: RoomsPublicController;
  let service: jest.Mocked<RoomsService>;

  let pricingService: { calculatePrice: jest.Mock; checkAvailability: jest.Mock };

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    const mockPricing = { calculatePrice: jest.fn(), checkAvailability: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsPublicController],
      providers: [
        { provide: RoomsService, useValue: mockService },
        { provide: PricingService, useValue: mockPricing },
      ],
    }).compile();

    controller = module.get(RoomsPublicController);
    service = module.get(RoomsService);
    pricingService = module.get(PricingService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('findAll — delegates to service.findAll', async () => {
    service.findAll.mockResolvedValue(LIST as any);
    const result = await controller.findAll({} as any);
    expect(service.findAll).toHaveBeenCalled();
    expect(result.data).toEqual(LIST);
  });

  it('findOne — passes id to service.findOne', async () => {
    service.findOne.mockResolvedValue(ROOM as any);
    const result = await controller.findOne('r1');
    expect(service.findOne).toHaveBeenCalledWith('r1');
    expect(result.data).toEqual(ROOM);
  });

  it('checkAvailability — delegates to pricingService.checkAvailability', async () => {
    pricingService.checkAvailability.mockResolvedValue(AVAILABILITY as any);
    const result = await controller.checkAvailability('r1', { checkIn: '2026-07-01', checkOut: '2026-07-03' } as any);
    expect(pricingService.checkAvailability).toHaveBeenCalled();
    expect(result.data).toEqual(AVAILABILITY);
  });

  it('calculatePrice — delegates to pricingService.calculatePrice', async () => {
    pricingService.calculatePrice.mockResolvedValue(PRICE as any);
    const result = await controller.calculatePrice('r1', {} as any);
    expect(pricingService.calculatePrice).toHaveBeenCalled();
    expect(result.data).toEqual(PRICE);
  });
});
