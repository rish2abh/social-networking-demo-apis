import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { LoggerService } from './logger.service';

const {
  combine,
  colorize,
  json,
  printf,
  timestamp,
} = winston.format;

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv =
          configService.get<string>('NODE_ENV') || 'development';
        const isProduction = nodeEnv === 'production';
        const level =
          configService.get<string>('LOG_LEVEL') ||
          (isProduction ? 'warn' : 'debug');

        const developmentFormat = combine(
          colorize(),
          timestamp({ format: 'HH:mm:ss' }),
          printf(({ level, message, timestamp, ...meta }) => {
            const endpoint = meta.url || meta.path || '-';
            const statusCode = meta.statusCode || '-';
            const logMessage =
              meta.responseMessage || meta.errorMessage || message;

            return `${timestamp} | ${endpoint} | ${statusCode} | ${level}: ${logMessage}`;
          }),
        );

        const productionFormat = combine(timestamp(), json());
        const transports: winston.transport[] = [
          new winston.transports.Console({
            format: isProduction ? productionFormat : developmentFormat,
          }),
        ];

        if (isProduction) {
          transports.push(
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
              format: productionFormat,
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
              format: productionFormat,
            }),
          );
        }

        return {
          level,
          transports,
        };
      },
    }),
  ],
  providers: [LoggerService],
  exports: [WinstonModule, LoggerService],
})
export class LoggerModule {}
