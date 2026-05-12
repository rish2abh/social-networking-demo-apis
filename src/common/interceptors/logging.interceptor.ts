import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, tap } from 'rxjs';
import { RequestWithRequestId } from '../middleware/request-id.middleware';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HTTP');
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithRequestId>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();

    const method = request.method;
    const url = request.originalUrl || request.url;
    const requestId = request.requestId;

    return next.handle().pipe(
      tap(() => {
        this.logger.log('Request completed', {
          method,
          url,
          requestId,
          statusCode: response.statusCode,
          duration: `${Date.now() - startedAt}ms`,
          responseMessage: 'Request completed',
        });
      }),
    );
  }
}
