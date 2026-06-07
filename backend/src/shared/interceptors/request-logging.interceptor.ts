import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

// Frequently-polled probes — logged would just be noise.
function isProbe(url: string): boolean {
  return url.startsWith('/api/healthz') || url.includes('/health/');
}

/**
 * Pattern: Interceptor — emits one structured line per completed HTTP request
 * (method, path, status, duration). Pairs with JsonLogger to produce parseable
 * access logs. Deliberately logs no headers/bodies/query — those can carry PII
 * and tokens (CLAUDE.md logging rule).
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const http = context.switchToHttp();
    const req = http.getRequest<{
      method: string;
      originalUrl?: string;
      url: string;
    }>();
    const url = req.originalUrl ?? req.url ?? '';
    if (isProbe(url)) return next.handle();

    const start = Date.now();
    const finish = () => {
      const status =
        http.getResponse<{ statusCode?: number }>().statusCode ?? 0;
      this.logger.log(`${req.method} ${url} ${status} ${Date.now() - start}ms`);
    };

    return next.handle().pipe(tap({ next: finish, error: finish }));
  }
}
