import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../../logger/logger.service';

const getResponseMessage = (message: string | object): string => {
  if (typeof message === 'string') {
    return message;
  }

  if ('message' in message) {
    const responseMessage = message.message;
    return Array.isArray(responseMessage)
      ? responseMessage.join(', ')
      : String(responseMessage);
  }

  return JSON.stringify(message);
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('ExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let message: string | object = 'Internal server error';
    const path = request.url;
    const method = request.method;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message =
        typeof exResponse === 'object' ? exResponse : { message: exResponse };
    }

    const responseMessage = getResponseMessage(message);

    if (status === 401 || status === 403) {
      this.logger.warn('Auth failure', {
        statusCode: status,
        path,
        ip: request.ip,
        responseMessage,
      });
    } else if (status >= 500) {
      this.logger.error('Unhandled server error', {
        statusCode: status,
        path,
        method,
        responseMessage,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    } else {
      this.logger.warn('Client error', {
        statusCode: status,
        path,
        method,
        responseMessage,
      });
    }

    response.status(status).json({
      status: false,
      message: responseMessage,
      data: null,
    });
  }
}
