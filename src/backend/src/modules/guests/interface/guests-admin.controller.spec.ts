/**
 * Controller specs — GuestsAdminController
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GuestsAdminController } from './guests-admin.controller';
import { GuestsService } from '../application/guests.service';

const GUEST = { id: 'g1', fullName: 'Nguyen A', phone: '090', tags: [] };
const LIST = { items: [GUEST], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
const HISTORY = [{ id: 'b1', bookingCode: 'HSB-20260701-ABCD' }];

describe('GuestsAdminController', () => {
  let controller: GuestsAdminController;
  let service: jest.Mocked<GuestsService>;

  const res = { setHeader: jest.fn(), send: jest.fn() };

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getHistory: jest.fn(),
      exportCsv: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestsAdminController],
      providers: [{ provide: GuestsService, useValue: mockService }],
    }).compile();

    controller = module.get(GuestsAdminController);
    service = module.get(GuestsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('findAll — delegates to service.findAll', async () => {
    service.findAll.mockResolvedValue(LIST as any);
    const result = await controller.findAll({} as any);
    expect(result.data).toEqual(LIST);
  });

  it('export — calls exportCsv and sends CSV headers', async () => {
    service.exportCsv.mockResolvedValue('header\nrow');
    await controller.export(res as any, {} as any);
    expect(service.exportCsv).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    expect(res.send).toHaveBeenCalled();
  });

  it('findOne — passes id to service.findOne', async () => {
    service.findOne.mockResolvedValue(GUEST as any);
    const result = await controller.findOne('g1');
    expect(service.findOne).toHaveBeenCalledWith('g1');
    expect(result.data).toEqual(GUEST);
  });

  it('getHistory — passes id to service.getHistory', async () => {
    service.getHistory.mockResolvedValue(HISTORY as any);
    const result = await controller.getHistory('g1');
    expect(service.getHistory).toHaveBeenCalledWith('g1');
    expect(result.data).toEqual(HISTORY);
  });

  it('update — calls service.update', async () => {
    service.update.mockResolvedValue({ ...GUEST, tags: ['VIP'] } as any);
    const result = await controller.update('g1', { tags: ['VIP'] } as any);
    expect(service.update).toHaveBeenCalledWith('g1', { tags: ['VIP'] });
    expect(result.data).toBeDefined();
  });

  it('remove — calls service.remove', async () => {
    service.remove.mockResolvedValue(GUEST as any);
    const result = await controller.remove('g1');
    expect(service.remove).toHaveBeenCalledWith('g1');
    expect(result.data).toBeDefined();
  });
});
