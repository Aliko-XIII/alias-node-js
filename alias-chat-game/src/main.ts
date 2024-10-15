import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.use(helmet());

  // Enable validation with whitelisting and forbidding non-whitelisted properties
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: '*', //'http://localhost:5174',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
  });

  // app.use(
  //   rateLimit({
  //     windowMs: 15 * 60 * 1000, // 15 minutes
  //     max: 1000, // Maximum of 1000 requests from one IP during this time
  //     message: 'Too many requests from this IP, please try again later.',
  //     headers: true, // Send the limit information in the header
  //   }),
  // );

  const port = configService.get<number>('APP_PORT') || 4000;
  await app.listen(port);
}

bootstrap();
