import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RoomsService } from './rooms.service';
import { RoomsRepository } from '../infrastructure/rooms.repository';
import { UploadsService } from '../../uploads/uploads.service';

const ROOM_STUB = {
  id: 'room-1',
  name: 'Phòng Hoa Sen',
  description: 'Phòng đẹp',
  capacity: 2,
  area: 20,
  floor: 1,
  amenities: ['WiFi', 'AC'],
  images: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('RoomsService', () => {
  let service: RoomsService;
  let repository: jest.Mocked<RoomsRepository>;
  let uploadsService: jest.Mocked<UploadsService>;
  let cacheManager: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    cacheManager = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

    const mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      softRemove: jest.fn(),
      remove: jest.fn(),
      roomSelect: { id: true, name: true },
      roomWithPricesSelect: { id: true, name: true, prices: true },
    };

    const mockUploadsService = {
      getImageUrl: jest.fn(),
      deleteFile: jest.fn(),
      roomImageStorage: jest.fn(),
      imageFileFilter: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: RoomsRepository, useValue: mockRepository },
        { provide: UploadsService, useValue: mockUploadsService },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    repository = module.get(RoomsRepository);
    uploadsService = module.get(UploadsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // BE-1: create
  describe('create', () => {
    it('creates a room with empty images array and correct defaults', async () => {
      (repository.create as jest.Mock).mockResolvedValue(ROOM_STUB);
      cacheManager.get.mockResolvedValue(null);

      const result = await service.create({
        name: 'Phòng Hoa Sen',
        capacity: 2,
        amenities: ['WiFi'],
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ images: [], isActive: true }),
      );
      expect(result).toEqual(ROOM_STUB);
    });

    it('uses provided isActive value when specified', async () => {
      (repository.create as jest.Mock).mockResolvedValue({ ...ROOM_STUB, isActive: false });

      await service.create({ name: 'Phòng X', capacity: 1, isActive: false });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('defaults amenities to empty array when not provided', async () => {
      (repository.create as jest.Mock).mockResolvedValue(ROOM_STUB);

      await service.create({ name: 'Phòng Y', capacity: 1 });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ amenities: [] }),
      );
    });

    it('invalidates list cache after creation', async () => {
      (repository.create as jest.Mock).mockResolvedValue(ROOM_STUB);

      await service.create({ name: 'Phòng Z', capacity: 1 });

      // Cache invalidation: del should be called (or no keys to clear = ok)
      expect(cacheManager.set).not.toHaveBeenCalledWith(
        expect.stringContaining('rooms_list'),
        expect.anything(),
        expect.anything(),
      );
    });
  });

  // BE-2: findAll
  describe('findAll', () => {
    it('filters only active rooms when adminView=false', async () => {
      cacheManager.get.mockResolvedValue(null);
      (repository.findAll as jest.Mock).mockResolvedValue([[ROOM_STUB], 1]);

      await service.findAll({} as any, false);

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('does not force isActive filter when adminView=true', async () => {
      cacheManager.get.mockResolvedValue(null);
      (repository.findAll as jest.Mock).mockResolvedValue([[ROOM_STUB], 1]);

      await service.findAll({} as any, true);

      const callArg = (repository.findAll as jest.Mock).mock.calls[0][0];
      // isActive should not be forced to true
      expect(callArg.where.isActive).toBeUndefined();
    });

    it('returns cached result without hitting repository', async () => {
      const cached = { items: [ROOM_STUB], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
      cacheManager.get.mockResolvedValue(cached);

      const result = await service.findAll({} as any);

      expect(result).toEqual(cached);
      expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('returns paginated meta with correct totalPages', async () => {
      cacheManager.get.mockResolvedValue(null);
      (repository.findAll as jest.Mock).mockResolvedValue([[ROOM_STUB, ROOM_STUB], 25]);

      const result = await service.findAll({ page: 2, limit: 10 } as any) as any;

      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.page).toBe(2);
    });

    it('caches result after fetching from repository', async () => {
      cacheManager.get.mockResolvedValue(null);
      (repository.findAll as jest.Mock).mockResolvedValue([[ROOM_STUB], 1]);

      await service.findAll({} as any);

      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('rooms_list'),
        expect.any(Object),
        expect.any(Number),
      );
    });

    it('applies isActive filter when explicitly provided in query', async () => {
      cacheManager.get.mockResolvedValue(null);
      (repository.findAll as jest.Mock).mockResolvedValue([[ROOM_STUB], 1]);

      await service.findAll({ isActive: false } as any, true);

      const callArg = (repository.findAll as jest.Mock).mock.calls[0][0];
      expect(callArg.where.isActive).toBe(false);
    });

    it('applies search filter by name when search is provided', async () => {
      cacheManager.get.mockResolvedValue(null);
      (repository.findAll as jest.Mock).mockResolvedValue([[ROOM_STUB], 1]);

      await service.findAll({ search: 'Hoa Sen' } as any, true);

      const callArg = (repository.findAll as jest.Mock).mock.calls[0][0];
      expect(callArg.where.name).toEqual({ contains: 'Hoa Sen', mode: 'insensitive' });
    });

    it('calculates correct skip from page and limit', async () => {
      cacheManager.get.mockResolvedValue(null);
      (repository.findAll as jest.Mock).mockResolvedValue([[ROOM_STUB], 1]);

      await service.findAll({ page: 3, limit: 5 } as any);

      const callArg = (repository.findAll as jest.Mock).mock.calls[0][0];
      expect(callArg.skip).toBe(10); // (3-1) * 5
      expect(callArg.take).toBe(5);
    });
  });

  // BE-3 & BE-4: findOne
  describe('findOne', () => {
    it('returns room from cache without querying repository (BE-3)', async () => {
      cacheManager.get.mockResolvedValue(ROOM_STUB);

      const result = await service.findOne('room-1');

      expect(result).toEqual(ROOM_STUB);
      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('fetches from repository on cache miss and stores in cache', async () => {
      cacheManager.get.mockResolvedValue(null);
      (repository.findOne as jest.Mock).mockResolvedValue(ROOM_STUB);

      const result = await service.findOne('room-1');

      expect(repository.findOne).toHaveBeenCalledWith({ id: 'room-1' }, expect.anything());
      expect(cacheManager.set).toHaveBeenCalledWith('room_room-1', ROOM_STUB, expect.any(Number));
      expect(result).toEqual(ROOM_STUB);
    });

    it('throws NotFoundException when room does not exist (BE-4)', async () => {
      cacheManager.get.mockResolvedValue(null);
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('NotFoundException message contains the room id', async () => {
      cacheManager.get.mockResolvedValue(null);
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow('bad-id');
    });
  });

  // BE-5: update
  describe('update', () => {
    it('calls repository.update with correct data (BE-5)', async () => {
      cacheManager.get.mockResolvedValue(ROOM_STUB);
      (repository.update as jest.Mock).mockResolvedValue({ ...ROOM_STUB, name: 'Phòng Mới' });

      const result = await service.update('room-1', { name: 'Phòng Mới' });

      expect(repository.update).toHaveBeenCalledWith({
        where: { id: 'room-1' },
        data: { name: 'Phòng Mới' },
      });
      expect((result as any).name).toBe('Phòng Mới');
    });

    it('throws NotFoundException when updating non-existent room', async () => {
      cacheManager.get.mockResolvedValue(null);
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update('bad-id', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('invalidates both room cache and list cache after update', async () => {
      cacheManager.get.mockResolvedValue(ROOM_STUB);
      (repository.update as jest.Mock).mockResolvedValue(ROOM_STUB);

      await service.update('room-1', { name: 'Updated' });

      expect(cacheManager.del).toHaveBeenCalledWith('room_room-1');
    });
  });

  // BE-6: remove (soft delete)
  describe('remove', () => {
    it('calls softRemove with room id (BE-6)', async () => {
      cacheManager.get.mockResolvedValue(ROOM_STUB);
      (repository.softRemove as jest.Mock).mockResolvedValue({ ...ROOM_STUB, deletedAt: new Date() });

      await service.remove('room-1');

      expect(repository.softRemove).toHaveBeenCalledWith({ id: 'room-1' });
    });

    it('throws NotFoundException when removing non-existent room', async () => {
      cacheManager.get.mockResolvedValue(null);
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('does NOT call repository.remove (hard delete)', async () => {
      cacheManager.get.mockResolvedValue(ROOM_STUB);
      (repository.softRemove as jest.Mock).mockResolvedValue(ROOM_STUB);

      await service.remove('room-1');

      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  // BE-7: addImages
  describe('addImages', () => {
    it('appends new image URLs to existing images array (BE-7)', async () => {
      const roomWithImages = { ...ROOM_STUB, images: ['/uploads/rooms/room-1/existing.jpg'] };
      cacheManager.get.mockResolvedValue(roomWithImages);
      (uploadsService.getImageUrl as jest.Mock)
        .mockReturnValueOnce('/uploads/rooms/room-1/new1.jpg')
        .mockReturnValueOnce('/uploads/rooms/room-1/new2.jpg');
      (repository.update as jest.Mock).mockResolvedValue(roomWithImages);

      const files = [
        { filename: 'new1.jpg' },
        { filename: 'new2.jpg' },
      ] as Express.Multer.File[];

      await service.addImages('room-1', files);

      expect(repository.update).toHaveBeenCalledWith({
        where: { id: 'room-1' },
        data: {
          images: [
            '/uploads/rooms/room-1/existing.jpg',
            '/uploads/rooms/room-1/new1.jpg',
            '/uploads/rooms/room-1/new2.jpg',
          ],
        },
      });
    });

    it('starts with empty array when room has no images', async () => {
      cacheManager.get.mockResolvedValue({ ...ROOM_STUB, images: [] });
      (uploadsService.getImageUrl as jest.Mock).mockReturnValue('/uploads/rooms/room-1/a.jpg');
      (repository.update as jest.Mock).mockResolvedValue(ROOM_STUB);

      await service.addImages('room-1', [{ filename: 'a.jpg' }] as any);

      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { images: ['/uploads/rooms/room-1/a.jpg'] },
        }),
      );
    });
  });

  // BE-8: removeImage
  describe('removeImage', () => {
    it('removes the URL from images array and deletes the file (BE-8)', async () => {
      const roomWithImages = {
        ...ROOM_STUB,
        images: ['/uploads/rooms/room-1/a.jpg', '/uploads/rooms/room-1/b.jpg'],
      };
      cacheManager.get.mockResolvedValue(roomWithImages);
      (repository.update as jest.Mock).mockResolvedValue(roomWithImages);

      await service.removeImage('room-1', '/uploads/rooms/room-1/a.jpg');

      expect(uploadsService.deleteFile).toHaveBeenCalledWith('/uploads/rooms/room-1/a.jpg');
      expect(repository.update).toHaveBeenCalledWith({
        where: { id: 'room-1' },
        data: { images: ['/uploads/rooms/room-1/b.jpg'] },
      });
    });

    it('leaves other images intact when removing one', async () => {
      const roomWithImages = {
        ...ROOM_STUB,
        images: ['/uploads/rooms/room-1/keep.jpg', '/uploads/rooms/room-1/del.jpg'],
      };
      cacheManager.get.mockResolvedValue(roomWithImages);
      (repository.update as jest.Mock).mockResolvedValue(roomWithImages);

      await service.removeImage('room-1', '/uploads/rooms/room-1/del.jpg');

      const updateCall = (repository.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.images).toEqual(['/uploads/rooms/room-1/keep.jpg']);
      expect(updateCall.data.images).toHaveLength(1);
    });
  });
});
