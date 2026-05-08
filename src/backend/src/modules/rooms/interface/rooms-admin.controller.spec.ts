/**
 * Controller specs — RoomsAdminController
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RoomsAdminController } from './rooms-admin.controller';
import { RoomsService } from '../application/rooms.service';
import { UploadsService } from '../../uploads/uploads.service';

const ROOM = { id: 'r1', name: 'Phòng 101', images: [] };
const LIST = { items: [ROOM], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };

describe('RoomsAdminController', () => {
  let controller: RoomsAdminController;
  let service: jest.Mocked<RoomsService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      addImages: jest.fn(),
      removeImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsAdminController],
      providers: [
        { provide: RoomsService, useValue: mockService },
        { provide: UploadsService, useValue: { saveFiles: jest.fn(), deleteFile: jest.fn() } },
      ],
    }).compile();

    controller = module.get(RoomsAdminController);
    service = module.get(RoomsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('create — delegates to service.create', async () => {
    service.create.mockResolvedValue(ROOM as any);
    const result = await controller.create({ name: 'Phòng 101', capacity: 2 } as any);
    expect(service.create).toHaveBeenCalled();
    expect(result.data).toEqual(ROOM);
  });

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

  it('update — passes id and dto to service.update', async () => {
    service.update.mockResolvedValue({ ...ROOM, name: 'Updated' } as any);
    const result = await controller.update('r1', { name: 'Updated' } as any);
    expect(service.update).toHaveBeenCalledWith('r1', { name: 'Updated' });
    expect(result.data).toBeDefined();
  });

  it('remove — calls service.remove', async () => {
    service.remove.mockResolvedValue(ROOM as any);
    const result = await controller.remove('r1');
    expect(service.remove).toHaveBeenCalledWith('r1');
    expect(result.message).toBeDefined();
  });

  it('removeImage — calls service.removeImage', async () => {
    service.removeImage.mockResolvedValue(ROOM as any);
    const result = await controller.removeImage('r1', '/uploads/img.jpg');
    expect(service.removeImage).toHaveBeenCalledWith('r1', '/uploads/img.jpg');
    expect(result.data).toBeDefined();
  });
});
