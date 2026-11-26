import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix for REST APIs (excluding health check)
  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  // Enable CORS for Next.js Frontend
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 5000;
  await app.listen(port);
  logger.log(`BrewLite API Server is running on: http://localhost:${port}/api`);
  logger.log(`Health check available on: http://localhost:${port}/health`);
}
bootstrap();
