import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

type ResponseBody = {
  message?: string;
  data?: unknown;
};

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((body: unknown) => {
        const responseBody = this.getResponseBody(body);

        return {
          status: true,
          message: responseBody.message || 'Request successful',
          data: responseBody.data,
        };
      }),
    );
  }

  private getResponseBody(body: unknown): ResponseBody {
    if (this.hasMessage(body)) {
      const responseBody = body as ResponseBody;

      return {
        message: responseBody.message,
        data: Object.prototype.hasOwnProperty.call(responseBody, 'data')
          ? responseBody.data
          : body,
      };
    }

    return { data: body ?? null };
  }

  private hasMessage(body: unknown): boolean {
    return (
      typeof body === 'object' &&
      body !== null &&
      'message' in body
    );
  }
}
