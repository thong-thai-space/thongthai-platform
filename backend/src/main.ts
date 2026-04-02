import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './common/redis-io.adapter';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from './shared/interceptors/response-envelope.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.use(cookieParser());

  // Serve uploaded files
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Socket.IO Redis adapter
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redisIoAdapter = new RedisIoAdapter(app, redisUrl);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  logger.log('Socket.IO Redis adapter connected');

  // Pattern: Health check without global prefix (for orchestrators like Railway)
  app.get('/api/healthz', () => ({ status: 'ok', service: 'backend' }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Pattern: Global Exception Handling
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Pattern: Response Envelope
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  // Pattern: API Versioning
  app.setGlobalPrefix('api/v1');

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Keep Swagger for local and test environments only.
    const config = new DocumentBuilder()
      .setTitle('Thông Thái Space API')
      .setDescription('API for project management, client portal & AI assistant')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/docs', app, document);
  }

  const port = Number(process.env.PORT || 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Thông Thái Space API running on port ${port}`);
  if (!isProduction) {
    console.log(`📚 Swagger docs: http://localhost:${port}/api/v1/docs`);
  }
}
bootstrap();
