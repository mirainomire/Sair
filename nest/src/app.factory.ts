import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const document = SwaggerModule.createDocument(app, new DocumentBuilder()
    .setTitle('Susi Air Pilot API')
    .setDescription('Pilot sign-in, duty limits, documents, and the monthly schedule. Operational today is 2026-05-15.')
    .setVersion('1.0').addBearerAuth().build());
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const raw = process.env.CORS_ORIGIN ?? '*';
  if (process.env.NODE_ENV === 'production' && raw.trim() === '*') {
    throw new Error('CORS_ORIGIN must be explicitly configured in production.');
  }
  app.enableCors({
    origin: raw.trim() === '*' ? true : raw.split(',').map((item) => item.trim()).filter(Boolean),
  });

  app.use((_request: unknown, response: { setHeader: (name: string, value: string) => void }, next: () => void) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  return app;
}
