let cachedExpressApp: any = null;

async function bootstrap() {
  if (cachedExpressApp) return cachedExpressApp;

  require('reflect-metadata');
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { ExpressAdapter } = require('@nestjs/platform-express');
  const express = require('express');
  const { AppModule } = require('../src/app.module');
  const { HttpExceptionFilter } = require('../src/common/filters/http-exception.filter');
  const { TransformInterceptor } = require('../src/common/interceptors/transform.interceptor');

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', ''],
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.init();
  cachedExpressApp = expressApp;
  return cachedExpressApp;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await bootstrap();
    app(req, res);
  } catch (error: any) {
    console.error('NestJS bootstrap error:', error);
    res.status(500).json({ error: 'Server initialization failed', message: error.message });
  }
}
