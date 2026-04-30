import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

describe('GlobalExceptionFilter (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Error Response Format', () => {
    it('should return standardized error response for 404', async () => {
      const response = await request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);

      expect(response.body).toHaveProperty('message');

      expect(response.body).toHaveProperty('error');

      expect(response.body).toHaveProperty('timestamp');

      expect(response.body).toHaveProperty('path', '/non-existent-route');

      expect(response.body).toHaveProperty('method', 'GET');

      // Validate timestamp format
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      expect(new Date(response.body.timestamp).toISOString()).toBe(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        response.body.timestamp,
      );
    });

    it('should include all required fields in error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);

      const requiredFields = [
        'statusCode',
        'message',
        'error',
        'timestamp',
        'path',
        'method',
      ];
      for (const field of requiredFields) {
        expect(response.body).toHaveProperty(field);
      }
    });

    it('should return correct method in error response', async () => {
      const response = await request(app.getHttpServer())
        .post('/non-existent-route')
        .expect(404);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.method).toBe('POST');
    });
  });
});
