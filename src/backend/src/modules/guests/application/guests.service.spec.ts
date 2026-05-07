/**
 * User Journeys — GuestsService
 *
 * GJ-1: Booking system finds existing guest by phone and returns updated record
 * GJ-2: Booking system creates new guest when phone not found
 * GJ-3: Admin lists guests with optional full-text search
 * GJ-4: Admin views single guest; receives 404 for unknown id
 * GJ-5: Admin updates guest tags/notes; receives 404 for unknown id
 * GJ-6: Admin soft-deletes guest
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { GuestsRepository } from '../infrastructure/guests.repository';

const GUEST_STUB = {
  id: 'guest-1',
  fullName: 'Nguyễn Văn A',
  phone: '0901234567',
  email: 'a@example.com',
  notes: null,
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('GuestsService', () => {
  let service: GuestsService;
  let repository: jest.Mocked<GuestsRepository>;

  beforeEach(async () => {
    const mockRepo = {
      findByPhone: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestsService,
        { provide: GuestsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<GuestsService>(GuestsService);
    repository = module.get(GuestsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── GJ-1 & GJ-2: findOrCreate ────────────────────────────────────────────

  describe('findOrCreate', () => {
    it('GJ-1: returns updated record when guest with same phone exists', async () => {
      repository.findByPhone.mockResolvedValue(GUEST_STUB);
      repository.update.mockResolvedValue({ ...GUEST_STUB, fullName: 'Nguyễn Văn B' });

      const result = await service.findOrCreate({ fullName: 'Nguyễn Văn B', phone: '0901234567' });

      expect(repository.findByPhone).toHaveBeenCalledWith('0901234567');
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'guest-1' } }),
      );
      expect(repository.create).not.toHaveBeenCalled();
      expect((result as any).fullName).toBe('Nguyễn Văn B');
    });

    it('GJ-1: preserves existing email when dto email is undefined', async () => {
      repository.findByPhone.mockResolvedValue(GUEST_STUB);
      repository.update.mockResolvedValue(GUEST_STUB);

      await service.findOrCreate({ fullName: 'Nguyễn Văn A', phone: '0901234567' });

      const updateCall = repository.update.mock.calls[0][0];
      expect(updateCall.data.email).toBe(GUEST_STUB.email);
    });

    it('GJ-2: creates new guest when phone not found', async () => {
      repository.findByPhone.mockResolvedValue(null);
      repository.create.mockResolvedValue(GUEST_STUB);

      const result = await service.findOrCreate({
        fullName: 'Trần Thị B',
        phone: '0912345678',
        email: 'b@example.com',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '0912345678', fullName: 'Trần Thị B' }),
      );
      expect(result).toEqual(GUEST_STUB);
    });

    it('GJ-2: sets tags to empty array when not provided', async () => {
      repository.findByPhone.mockResolvedValue(null);
      repository.create.mockResolvedValue(GUEST_STUB);

      await service.findOrCreate({ fullName: 'X', phone: '0900000000' });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tags: [] }),
      );
    });
  });

  // ─── GJ-3: findAll ────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('GJ-3: returns paginated result with correct meta', async () => {
      repository.findAll.mockResolvedValue([[GUEST_STUB], 15]);

      const result = await service.findAll({ page: 2, limit: 5 } as any) as any;

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(15);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.page).toBe(2);
    });

    it('GJ-3: calculates correct skip for page 3, limit 10', async () => {
      repository.findAll.mockResolvedValue([[], 0]);

      await service.findAll({ page: 3, limit: 10 } as any);

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('GJ-3: applies OR search filter across fullName, phone, email', async () => {
      repository.findAll.mockResolvedValue([[GUEST_STUB], 1]);

      await service.findAll({ search: 'Nguyễn' } as any);

      const callArg = repository.findAll.mock.calls[0][0];
      expect(callArg.where.OR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ fullName: expect.anything() }),
          expect.objectContaining({ phone: expect.anything() }),
          expect.objectContaining({ email: expect.anything() }),
        ]),
      );
    });

    it('GJ-3: filters out deleted guests (deletedAt: null)', async () => {
      repository.findAll.mockResolvedValue([[], 0]);

      await service.findAll({} as any);

      const callArg = repository.findAll.mock.calls[0][0];
      expect(callArg.where.deletedAt).toBeNull();
    });
  });

  // ─── GJ-4: findOne ────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('GJ-4: returns guest when found', async () => {
      repository.findOne.mockResolvedValue(GUEST_STUB);

      const result = await service.findOne('guest-1');

      expect(result).toEqual(GUEST_STUB);
    });

    it('GJ-4: throws NotFoundException when guest does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('GJ-4: NotFoundException message contains the id', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-uuid')).rejects.toThrow('missing-uuid');
    });
  });

  // ─── GJ-5: update ────────────────────────────────────────────────────────

  describe('update', () => {
    it('GJ-5: updates and returns guest with new tags', async () => {
      repository.findOne.mockResolvedValue(GUEST_STUB);
      repository.update.mockResolvedValue({ ...GUEST_STUB, tags: ['VIP'] });

      const result = await service.update('guest-1', { tags: ['VIP'] });

      expect(repository.update).toHaveBeenCalledWith({
        where: { id: 'guest-1' },
        data: { tags: ['VIP'] },
      });
      expect((result as any).tags).toEqual(['VIP']);
    });

    it('GJ-5: throws NotFoundException when guest not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('bad-id', { notes: 'test' })).rejects.toThrow(NotFoundException);
    });
  });

  // ─── GJ-6: remove ────────────────────────────────────────────────────────

  describe('remove', () => {
    it('GJ-6: calls softRemove with the guest id', async () => {
      repository.findOne.mockResolvedValue(GUEST_STUB);
      repository.softRemove.mockResolvedValue({ ...GUEST_STUB, deletedAt: new Date() });

      await service.remove('guest-1');

      expect(repository.softRemove).toHaveBeenCalledWith({ id: 'guest-1' });
    });

    it('GJ-6: throws NotFoundException when guest not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('GJ-6: does not call hard remove', async () => {
      repository.findOne.mockResolvedValue(GUEST_STUB);
      repository.softRemove.mockResolvedValue({ ...GUEST_STUB, deletedAt: new Date() });

      await service.remove('guest-1');

      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
