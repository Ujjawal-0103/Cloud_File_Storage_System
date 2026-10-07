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
  const allowedOrigins: string[] = [
    'http://localhost:3000',
    'https://cloud-file-storage-system-five.vercel.app',
  ];
  if (process.env.FRONTEND_URL) {
    const configuredFrontend = process.env.FRONTEND_URL.replace(/\/$/, '');
    if (!allowedOrigins.includes(configuredFrontend)) {
      allowedOrigins.push(configuredFrontend);
    }
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Route Normalization: seamlessly route both /api/* and direct /* controller paths
  app.use((req: any, res: any, next: any) => {
    if (req.url && req.url !== '/' && !req.url.startsWith('/api')) {
      req.url = '/api' + req.url;
    }
    next();
  });

  // 4. Global API Prefix
  app.setGlobalPrefix('api');

  // 5. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 6. Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

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

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Server running on port ${port} (0.0.0.0)`);
  logger.log(`📄 Swagger Docs available at http://localhost:${port}/api/docs`);
}

bootstrap();