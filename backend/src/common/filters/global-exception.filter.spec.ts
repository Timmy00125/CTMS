import { Test, TestingModule } from '@nestjs/testing';
import {
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost } from '@nestjs/common';
import { Response, Request } from 'express';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let mockResponse: Response;
  let mockRequest: Request;
  let mockHost: ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlobalExceptionFilter],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);

    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn().mockReturnThis();

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;

    mockRequest = {
      url: '/test-path',
      method: 'GET',
    } as unknown as Request;

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('HttpException handling', () => {
    it('should handle NotFoundException', () => {
      const exception = new NotFoundException('Resource not found');

      filter.catch(exception, mockHost);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Resource not found',
          error: 'Not Found',
          path: '/test-path',
          method: 'GET',
        }),
      );
    });

    it('should handle BadRequestException', () => {
      const exception = new BadRequestException('Invalid input');

      filter.catch(exception, mockHost);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Invalid input',
          error: 'Bad Request',
        }),
      );
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        {
          message: ['field1 is required', 'field2 is invalid'],
          error: 'Validation Error',
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: ['field1 is required', 'field2 is invalid'],
          error: 'Validation Error',
        }),
      );
    });

    it('should include timestamp in ISO format', () => {
      const exception = new NotFoundException();

      filter.catch(exception, mockHost);

      const callArgs = jsonMock.mock.calls[0] as Array<Record<string, unknown>>;
      const response = callArgs[0];
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp as string).toISOString()).toBe(
        response.timestamp,
      );
    });
  });

  describe('Unknown exception handling', () => {
    it('should handle generic Error as 500', () => {
      const exception = new Error('Unexpected error');

      filter.catch(exception, mockHost);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Internal server error',
          error: 'Internal Server Error',
        }),
      );
    });

    it('should handle unknown exception types as 500', () => {
      const exception = 'string exception';

      filter.catch(exception, mockHost);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Internal server error',
          error: 'Internal Server Error',
        }),
      );
    });
  });

  describe('Response format consistency', () => {
    it('should always include all required fields', () => {
      const exception = new NotFoundException();

      filter.catch(exception, mockHost);

      const callArgs = jsonMock.mock.calls[0] as Array<Record<string, unknown>>;
      const response = callArgs[0];
      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('path');
      expect(response).toHaveProperty('method');
    });

    it('should preserve request path and method', () => {
      (mockRequest as { url: string }).url = '/api/grades/123';
      (mockRequest as { method: string }).method = 'PUT';
      const exception = new NotFoundException();

      filter.catch(exception, mockHost);

      const callArgs = jsonMock.mock.calls[0] as Array<Record<string, unknown>>;
      const response = callArgs[0];
      expect(response.path).toBe('/api/grades/123');
      expect(response.method).toBe('PUT');
    });
  });
});
