import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T = any> {
  success: true;
  data: T;
  meta?: Record<string, any>;
  timestamp: string;
}

/**
 * Pattern: Response Envelope
 * Wraps all successful responses in a standardized envelope
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseEnvelopeInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If response is already an ApiResponse or null/undefined, return as-is
        if (
          !data ||
          (typeof data === 'object' && 'success' in data && 'data' in data)
        ) {
          return data;
        }

        // Wrap response in envelope
        const response: ApiResponse = {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };

        return response;
      }),
    );
  }
}
