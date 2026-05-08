/**
 * Controller specs — PricingAdminController
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PricingAdminController } from './pricing-admin.controller';
import { PricingService } from '../application/pricing.service';

const RULE = { id: 'pr1', roomId: 'r1', priceType: 'BASE_NIGHTLY', price: 350000 };

describe('PricingAdminController', () => {
  let controller: PricingAdminController;
  let service: jest.Mocked<PricingService> & { createPrice: jest.Mock; updatePrice: jest.Mock; deletePrice: jest.Mock };

  beforeEach(async () => {
    const mockService = {
      getPricesByRoom: jest.fn(),
      createPrice: jest.fn(),
      updatePrice: jest.fn(),
      deletePrice: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricingAdminController],
      providers: [{ provide: PricingService, useValue: mockService }],
    }).compile();

    controller = module.get(PricingAdminController);
    service = module.get(PricingService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('getByRoom — calls service.getPricesByRoom', async () => {
    service.getPricesByRoom.mockResolvedValue([RULE] as any);
    const result = await controller.getByRoom('r1');
    expect(service.getPricesByRoom).toHaveBeenCalledWith('r1');
    expect(result.data).toEqual([RULE]);
  });

  it('create — calls service.createPrice with roomId and dto', async () => {
    service.createPrice.mockResolvedValue(RULE as any);
    const result = await controller.create('r1', { priceType: 'BASE_NIGHTLY', price: 350000 } as any);
    expect(service.createPrice).toHaveBeenCalledWith('r1', expect.anything());
    expect(result.data).toEqual(RULE);
  });

  it('update — calls service.updatePrice with id and dto', async () => {
    service.updatePrice.mockResolvedValue({ ...RULE, price: 400000 } as any);
    const result = await controller.update('pr1', { price: 400000 } as any);
    expect(service.updatePrice).toHaveBeenCalledWith('pr1', { price: 400000 });
    expect(result.data).toBeDefined();
  });

  it('remove — calls service.deletePrice', async () => {
    service.deletePrice.mockResolvedValue(RULE as any);
    const result = await controller.remove('pr1');
    expect(service.deletePrice).toHaveBeenCalledWith('pr1');
    expect(result.data).toBeDefined();
  });
});
