import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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
  
  await app.listen(Number(process.env.PORT || 53013));
  console.log('Battery Type REST API запущен на порту 3000 (проверяй по IP из hostname -I)');
}
bootstrap();
