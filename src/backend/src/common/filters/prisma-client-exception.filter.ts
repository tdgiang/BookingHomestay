import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = `Cột trùng lặp: ${this.getConstraintField(exception)}`;
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Không tìm thấy bản ghi yêu cầu';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Lỗi ràng buộc khóa ngoại';
        break;
    }

    const responseBody = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message: message,
      data: null,
      errors: exception.meta || exception.message,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }

  private getConstraintField(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    const target = exception.meta?.target as string[];
    return target ? target.join(', ') : 'unknown';
  }
}
