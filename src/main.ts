import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import mongoose from 'mongoose';
import { AppModule } from './app.module';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerService } from './logger/logger.service';
import { printStartupBanner } from './common/utils/terminal-banner';

type ShutdownSignal = 'SIGINT' | 'SIGTERM';

const registerGracefulShutdown = (
  app: INestApplication,
  logger: LoggerService,
): void => {
  let isShuttingDown = false;

  const shutdown = async (signal: ShutdownSignal): Promise<void> => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    const forceExitTimer = setTimeout(() => {
      logger.error('Forced shutdown after timeout', { signal });
      process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    try {
      logger.warn('Shutdown signal received', { signal });
      logger.log('Closing HTTP server and active requests');

      await app.close();

      logger.log('HTTP server closed');

      if (mongoose.connection.readyState !== 0) {
        logger.log('Closing database connection');
        await mongoose.disconnect();
        logger.log('Database connection closed');
      }

      clearTimeout(forceExitTimer);
      logger.log('Graceful shutdown complete', { signal });
      process.exit(0);
    } catch (error: unknown) {
      clearTimeout(forceExitTimer);
      logger.error('Graceful shutdown failed', {
        signal,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const exceptionLogger = await app.resolve(LoggerService);
  const httpLogger = await app.resolve(LoggerService);
  const bootstrapLogger = await app.resolve(LoggerService);
  bootstrapLogger.setContext('Bootstrap');

  app.useGlobalFilters(new HttpExceptionFilter(exceptionLogger));
  app.useGlobalInterceptors(
    new LoggingInterceptor(httpLogger),
    new ApiResponseInterceptor(),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Social Network API')
    .setDescription(
      'A RESTful Social Network API built with NestJS, MongoDB, and JWT authentication. ' +
        'Supports user registration, login, and full friend request lifecycle ' +
        '(send, accept, reject) with pagination, filtering, and sorting.',
    )
    .setVersion('1.0')
    .setContact('Your Name', '', 'your@email.com')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'User registration and login')
    .addTag('Friends', 'Friend request management and listing')
    .addTag('Users', 'User profile and search')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      authAction: {
        'JWT-auth': {
          name: 'JWT-auth',
          schema: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          value: '',
        },
      },
      requestInterceptor: (request) => {
        const authorization = request.headers?.authorization;
        if (
          authorization &&
          typeof authorization === 'string' &&
          !authorization.startsWith('Bearer ')
        ) {
          request.headers.authorization = `Bearer ${authorization}`;
        }
        return request;
      },
    },
    customSiteTitle: 'Social Network API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  registerGracefulShutdown(app, bootstrapLogger);

  const appUrl = `http://localhost:${port}/api`;
  const docsUrl = `http://localhost:${port}/api/docs`;
  const nodeEnv = process.env.NODE_ENV || 'development';

  printStartupBanner({ appUrl, docsUrl, nodeEnv });
  bootstrapLogger.log('Application started successfully', {
    appUrl,
    docsUrl,
    nodeEnv,
  });
}
bootstrap();
