/**
 * Controller specs — DashboardController
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from '../application/dashboard.service';

const KPIS = { totalRooms: 5, checkInsToday: 2, revenueThisMonth: 5000000 };
const REVENUE = [{ date: '2026-07-01', revenue: 700000 }];
const TASKS = [{ id: 'b1', bookingCode: 'HSB-20260701-ABCD' }];
const CALENDAR = [{ id: 'b1', checkIn: '2026-07-01' }];

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    const mockService = {
      getKpis: jest.fn(),
      getRevenueChart: jest.fn(),
      getPendingTasks: jest.fn(),
      getCalendarEvents: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: mockService }],
    }).compile();

    controller = module.get(DashboardController);
    service = module.get(DashboardService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('getKpis — delegates to service.getKpis', async () => {
    service.getKpis.mockResolvedValue(KPIS as any);
    const result = await controller.getKpis();
    expect(service.getKpis).toHaveBeenCalled();
    expect(result.data).toEqual(KPIS);
  });

  it('getRevenue — delegates to service.getRevenueChart', async () => {
    service.getRevenueChart.mockResolvedValue(REVENUE);
    const result = await controller.getRevenue();
    expect(service.getRevenueChart).toHaveBeenCalled();
    expect(result.data).toEqual(REVENUE);
  });

  it('getTasks — delegates to service.getPendingTasks', async () => {
    service.getPendingTasks.mockResolvedValue(TASKS as any);
    const result = await controller.getTasks();
    expect(service.getPendingTasks).toHaveBeenCalled();
    expect(result.data).toEqual(TASKS);
  });

  it('getCalendar — passes year/month query to service.getCalendarEvents', async () => {
    service.getCalendarEvents.mockResolvedValue(CALENDAR as any);
    const result = await controller.getCalendar({ year: 2026, month: 7 } as any);
    expect(service.getCalendarEvents).toHaveBeenCalledWith(2026, 7);
    expect(result.data).toEqual(CALENDAR);
  });
});
