/**
 * Controller specs — PaymentsAdminController
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsAdminController } from './payments-admin.controller';
import { PaymentsService } from '../application/payments.service';

const PAYMENT = { id: 'pay-1', status: 'PAID', amount: 700000 };

describe('PaymentsAdminController', () => {
  let controller: PaymentsAdminController;
  let service: jest.Mocked<PaymentsService>;

  beforeEach(async () => {
    const mockService = { confirmManual: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsAdminController],
      providers: [{ provide: PaymentsService, useValue: mockService }],
    }).compile();

    controller = module.get(PaymentsAdminController);
    service = module.get(PaymentsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('confirm — passes payment id, adminId, dto to service.confirmManual', async () => {
    service.confirmManual.mockResolvedValue(PAYMENT as any);
    const req = { user: { sub: 'admin-1' } };
    const result = await controller.confirm('pay-1', { bankRef: 'REF123' } as any, req);
    expect(service.confirmManual).toHaveBeenCalledWith('pay-1', 'admin-1', { bankRef: 'REF123' });
    expect(result.data).toEqual(PAYMENT);
  });

  it('confirm — uses user.id when sub is absent', async () => {
    service.confirmManual.mockResolvedValue(PAYMENT as any);
    const req = { user: { id: 'admin-2' } };
    await controller.confirm('pay-1', {} as any, req);
    expect(service.confirmManual).toHaveBeenCalledWith('pay-1', 'admin-2', {});
  });
});
