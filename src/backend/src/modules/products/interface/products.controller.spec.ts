/**
 * Controller specs — ProductsController
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from '../application/products.service';

const PRODUCT = { id: 'p1', name: 'Test', price: 100 };
const LIST_RESULT = { items: [PRODUCT], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: mockService }],
    }).compile();

    controller = module.get(ProductsController);
    service = module.get(ProductsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('create — calls service.create and wraps response', async () => {
    service.create.mockResolvedValue(PRODUCT as any);
    const mockRes = { header: jest.fn() };
    const result = await controller.create({ name: 'Test', price: 100, stock: 1 } as any, mockRes as any);
    expect(service.create).toHaveBeenCalled();
    expect(result.data).toEqual(PRODUCT);
  });

  it('findAll — delegates to service.findAll', async () => {
    service.findAll.mockResolvedValue(LIST_RESULT as any);
    const result = await controller.findAll({} as any);
    expect(result.data).toEqual(LIST_RESULT);
  });

  it('findOne — passes id to service.findOne', async () => {
    service.findOne.mockResolvedValue(PRODUCT as any);
    const result = await controller.findOne('p1');
    expect(service.findOne).toHaveBeenCalledWith('p1');
    expect(result.data).toEqual(PRODUCT);
  });

  it('update — passes id and dto to service.update', async () => {
    service.update.mockResolvedValue({ ...PRODUCT, name: 'Updated' } as any);
    const result = await controller.update('p1', { name: 'Updated' } as any);
    expect(service.update).toHaveBeenCalledWith('p1', { name: 'Updated' });
    expect(result.data).toBeDefined();
  });

  it('remove — calls service.remove and returns success message', async () => {
    service.remove.mockResolvedValue({ ...PRODUCT, deletedAt: new Date() } as any);
    const result = await controller.remove('p1');
    expect(service.remove).toHaveBeenCalledWith('p1');
    expect(result.message).toBeDefined();
  });
});
