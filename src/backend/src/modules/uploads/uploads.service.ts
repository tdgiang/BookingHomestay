import { Injectable, BadRequestException } from '@nestjs/common';
import { diskStorage, Options } from 'multer';
import { extname, join } from 'path';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

export const ALLOWED_IMAGE_TYPES = /jpeg|jpg|png|webp/;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class UploadsService {
  roomImageStorage(roomId: string): Options['storage'] {
    return diskStorage({
      destination: (_req, _file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'rooms', roomId);
        mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        cb(null, `${randomUUID()}${ext}`);
      },
    });
  }

  imageFileFilter(
    _req: any,
    file: Express.Multer.File,
    cb: (error: Error | null, accept: boolean) => void,
  ) {
    const ext = extname(file.originalname).toLowerCase().replace('.', '');
    if (!ALLOWED_IMAGE_TYPES.test(ext)) {
      return cb(
        new BadRequestException('Chỉ chấp nhận file ảnh: jpeg, jpg, png, webp'),
        false,
      );
    }
    cb(null, true);
  }

  /** Returns public URL path for an uploaded file. */
  getImageUrl(roomId: string, filename: string): string {
    return `/uploads/rooms/${roomId}/${filename}`;
  }

  deleteFile(filePath: string) {
    const abs = join(process.cwd(), filePath.replace(/^\//, ''));
    if (existsSync(abs)) unlinkSync(abs);
  }
}
