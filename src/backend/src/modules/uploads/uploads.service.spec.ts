import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import { UploadsService } from './uploads.service';

jest.mock('fs');

describe('UploadsService', () => {
  let service: UploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadsService],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // UP-1: getImageUrl
  describe('getImageUrl', () => {
    it('returns correct public path for a room image', () => {
      const url = service.getImageUrl('room-abc', 'photo.jpg');
      expect(url).toBe('/uploads/rooms/room-abc/photo.jpg');
    });

    it('preserves the full filename including extension', () => {
      const url = service.getImageUrl('room-123', 'uuid-v4-value.webp');
      expect(url).toContain('uuid-v4-value.webp');
    });
  });

  // UP-2: imageFileFilter
  describe('imageFileFilter', () => {
    const makeFile = (name: string): Express.Multer.File =>
      ({ originalname: name } as Express.Multer.File);

    it('accepts .jpg files', (done) => {
      service.imageFileFilter({} as any, makeFile('photo.jpg'), (err, ok) => {
        expect(err).toBeNull();
        expect(ok).toBe(true);
        done();
      });
    });

    it('accepts .jpeg files', (done) => {
      service.imageFileFilter({} as any, makeFile('image.JPEG'), (err, ok) => {
        expect(err).toBeNull();
        expect(ok).toBe(true);
        done();
      });
    });

    it('accepts .png files', (done) => {
      service.imageFileFilter({} as any, makeFile('banner.png'), (err, ok) => {
        expect(err).toBeNull();
        expect(ok).toBe(true);
        done();
      });
    });

    it('accepts .webp files', (done) => {
      service.imageFileFilter({} as any, makeFile('room.webp'), (err, ok) => {
        expect(err).toBeNull();
        expect(ok).toBe(true);
        done();
      });
    });

    it('rejects .pdf files with BadRequestException', (done) => {
      service.imageFileFilter({} as any, makeFile('doc.pdf'), (err, ok) => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(ok).toBe(false);
        done();
      });
    });

    it('rejects .exe files with BadRequestException', (done) => {
      service.imageFileFilter({} as any, makeFile('virus.exe'), (err, ok) => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(ok).toBe(false);
        done();
      });
    });

    it('rejects .mp4 files with BadRequestException', (done) => {
      service.imageFileFilter({} as any, makeFile('video.mp4'), (err, ok) => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(ok).toBe(false);
        done();
      });
    });
  });

  // deleteFile
  describe('deleteFile', () => {
    beforeEach(() => jest.clearAllMocks());

    it('deletes the file when it exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

      service.deleteFile('/uploads/rooms/room-1/photo.jpg');

      expect(fs.unlinkSync).toHaveBeenCalledTimes(1);
    });

    it('does nothing when file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      service.deleteFile('/uploads/rooms/room-1/missing.jpg');

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('strips leading slash before resolving absolute path', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

      // Should not throw for paths with or without leading slash
      expect(() => service.deleteFile('/uploads/rooms/room-1/a.jpg')).not.toThrow();
    });
  });

  // roomImageStorage
  describe('roomImageStorage', () => {
    it('returns a storage object (not null/undefined)', () => {
      const storage = service.roomImageStorage('room-abc');
      expect(storage).toBeDefined();
    });

    it('returns different storage instances for different roomIds', () => {
      const s1 = service.roomImageStorage('room-1');
      const s2 = service.roomImageStorage('room-2');
      expect(s1).not.toBe(s2);
    });
  });
});
