/**
 * Controller specs — UsersController
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../application/users.service';

const USER = { id: 'u1', email: 'a@b.com', role: 'USER' };
const LIST = { items: [USER], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('create — calls service.create and wraps response', async () => {
    service.create.mockResolvedValue(USER as any);
    const mockRes = { header: jest.fn() };
    const result = await controller.create({ email: 'a@b.com', password: 'pw' } as any, mockRes as any);
    expect(service.create).toHaveBeenCalled();
    expect(result.data).toEqual(USER);
  });

  it('findAll — delegates to service.findAll', async () => {
    service.findAll.mockResolvedValue(LIST as any);
    const result = await controller.findAll({} as any);
    expect(result.data).toEqual(LIST);
  });

  it('findOne — passes id to service.findOne', async () => {
    service.findOne.mockResolvedValue(USER as any);
    const result = await controller.findOne('u1');
    expect(service.findOne).toHaveBeenCalledWith('u1');
    expect(result.data).toEqual(USER);
  });

  it('update — passes id and dto to service.update', async () => {
    service.update.mockResolvedValue({ ...USER, firstName: 'B' } as any);
    const result = await controller.update('u1', { firstName: 'B' } as any);
    expect(service.update).toHaveBeenCalledWith('u1', { firstName: 'B' });
    expect(result.data).toBeDefined();
  });

  it('remove — calls service.remove', async () => {
    service.remove.mockResolvedValue(USER as any);
    const result = await controller.remove('u1');
    expect(service.remove).toHaveBeenCalledWith('u1');
    expect(result.message).toBeDefined();
  });
});
