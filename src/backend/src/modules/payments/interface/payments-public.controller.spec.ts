/**
 * Controller specs — PaymentsPublicController
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsPublicController } from './payments-public.controller';
import { PaymentsService } from '../application/payments.service';

describe('PaymentsPublicController', () => {
  let controller: PaymentsPublicController;
  let service: jest.Mocked<PaymentsService>;

  beforeEach(async () => {
    const mockService = { handleWebhook: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsPublicController],
      providers: [{ provide: PaymentsService, useValue: mockService }],
    }).compile();

    controller = module.get(PaymentsPublicController);
    service = module.get(PaymentsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('webhook — passes DTO to service.handleWebhook', async () => {
    service.handleWebhook.mockResolvedValue({ processed: true } as any);
    const dto = { bookingCode: 'HSB-20260701-ABCD', amount: 700000, bankRef: 'REF' };
    const result = await controller.webhook(dto as any);
    expect(service.handleWebhook).toHaveBeenCalledWith(dto);
    expect(result.data).toEqual({ processed: true });
  });

  it('webhook — success message is returned', async () => {
    service.handleWebhook.mockResolvedValue({} as any);
    const result = await controller.webhook({} as any);
    expect(result.message).toContain('webhook');
  });
});
