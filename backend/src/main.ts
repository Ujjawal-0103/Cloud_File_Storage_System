import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Cloud File Storage API')
    .setDescription('Backend APIs for Cloud File Storage System')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(
    app,
    config,
  );

  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3001);

  console.log(
    `🚀 Server running at http://localhost:${process.env.PORT ?? 3001}`,
  );

  console.log(
    `📄 Swagger Docs: http://localhost:${process.env.PORT ?? 3001}/api`,
  );
}

bootstrap();