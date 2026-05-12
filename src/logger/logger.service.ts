import { Inject, Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

type LogMeta = Record<string, unknown>;
type RequestContext = {
  requestId: string;
};

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private static readonly asyncLocalStorage =
    new AsyncLocalStorage<RequestContext>();

  private context?: string;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  static runWithRequestId(requestId: string, callback: () => void): void {
    this.asyncLocalStorage.run({ requestId }, callback);
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, meta: LogMeta = {}): void {
    this.logger.info(message, this.withContext(meta));
  }

  error(message: string, meta: LogMeta = {}): void {
    this.logger.error(message, this.withContext(meta));
  }

  warn(message: string, meta: LogMeta = {}): void {
    this.logger.warn(message, this.withContext(meta));
  }

  debug(message: string, meta: LogMeta = {}): void {
    this.logger.debug(message, this.withContext(meta));
  }

  verbose(message: string, meta: LogMeta = {}): void {
    this.logger.verbose(message, this.withContext(meta));
  }

  private withContext(meta: LogMeta): LogMeta {
    const requestId =
      meta.requestId || LoggerService.asyncLocalStorage.getStore()?.requestId;

    return {
      ...meta,
      ...(this.context ? { context: this.context } : {}),
      ...(requestId ? { requestId } : {}),
    };
  }
}
