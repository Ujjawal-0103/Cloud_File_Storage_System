import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Route Normalization middleware identical to main.ts
    app.use((req: any, res: any, next: any) => {
      if (req.url && req.url !== '/' && !req.url.startsWith('/api')) {
        req.url = '/api' + req.url;
      }
      next();
    });

    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api/health (GET) should return 200 OK', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
      });
  });

  it('/health (GET) should normalize to /api/health and return 200 OK', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
      });
  });

  it('/api/auth/login (POST) with invalid credentials should return 401 Unauthorized', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrongpassword' })
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty('message');
      });
  });

  it('/auth/login (POST) should normalize route and reach auth controller with 401', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrongpassword' })
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty('message');
      });
  });

  it('/api/files (GET) unauthenticated should be rejected with 401', () => {
    return request(app.getHttpServer())
      .get('/api/files')
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
