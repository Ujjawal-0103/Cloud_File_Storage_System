import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Security Headers - Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI and Cloudinary assets to render smoothly
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows cross-origin file downloads and preview
    }),
  );

  // 2. Response Compression
  app.use(
    compression({
      filter: (req, res) => {
        // Do not compress multipart uploads or streaming downloads
        if (req.headers['content-type']?.includes('multipart/form-data')) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024, // Only compress responses > 1 KB
    }),
  );

  // 3. CORS Configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // 2. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 3. Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 4. Global API Prefix
  app.setGlobalPrefix('api');

  // 5. Swagger Configuration
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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  logger.log(`🚀 Server running at http://localhost:${port}/api`);
  logger.log(`📄 Swagger Docs available at http://localhost:${port}/api/docs`);
}

bootstrap();