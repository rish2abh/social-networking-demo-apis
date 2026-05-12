import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { LoggerService } from '../../logger/logger.service';

export type RequestWithRequestId = Request & {
  requestId: string;
};

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithRequestId, res: Response, next: NextFunction): void {
    const existingRequestId = req.header('X-Request-ID');
    const requestId = existingRequestId || randomUUID().split('-')[0];

    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    LoggerService.runWithRequestId(requestId, next);
  }
}
