import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user } = req;

    if (['POST', 'PATCH', 'DELETE'].includes(method) && url.includes('/admin')) {
      return next.handle().pipe(
        tap(() => {
          this.logger.log(`${method} ${url} — by ${user?.email ?? 'unknown'}`);
        }),
      );
    }
    return next.handle();
  }
}
