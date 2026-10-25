import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import session = require('express-session');
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const redisClient = createClient({ url: 'redis://localhost:6379' });
  await redisClient.connect();

  app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      secret: 'amphour-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 60 * 24 },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Battery Runtime API')
    .setVersion('1.0')
    .addCookieAuth('connect.sid')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log('Battery Runtime REST API запущен на порту 3000 (проверяй по IP из hostname -I)');
}
bootstrap();
