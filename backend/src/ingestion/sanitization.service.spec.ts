import { Test, TestingModule } from '@nestjs/testing';
import { SanitizationService } from './sanitization.service';

describe('SanitizationService', () => {
  let service: SanitizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SanitizationService],
    }).compile();

    service = module.get<SanitizationService>(SanitizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = service.sanitizeString(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = service.sanitizeString(input);
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=alert("xss")';
      const result = service.sanitizeString(input);
      expect(result).not.toContain('onclick=');
    });

    it('should escape single quotes for SQL', () => {
      const input = "O'Reilly";
      const result = service.sanitizeString(input);
      expect(result).toBe("O''Reilly");
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = service.sanitizeString(input);
      expect(result).toBe('Hello World');
    });

    it('should handle non-string input', () => {
      const input = 123 as unknown as string;
      const result = service.sanitizeString(input);
      expect(result).toBe(123);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string values in object', () => {
      const input = {
        name: '<b>John</b>',
        description: 'Hello<script>alert("xss")</script>',
        level: 200,
      };

      const result = service.sanitizeObject(input);

      expect(result.name).not.toContain('<b>');
      expect(result.description).not.toContain('<script>');
      expect(result.level).toBe(200);
    });
  });

  describe('sanitizeArray', () => {
    it('should sanitize all objects in array', () => {
      const input = [
        { name: '<b>John</b>', level: 200 },
        { name: '<i>Jane</i>', level: 300 },
      ];

      const result = service.sanitizeArray(input);

      expect(result[0].name).not.toContain('<b>');
      expect(result[1].name).not.toContain('<i>');
    });
  });

  describe('hasSqlInjection', () => {
    it('should detect SELECT statement', () => {
      expect(service.hasSqlInjection('SELECT * FROM users')).toBe(true);
    });

    it('should detect UNION-based injection', () => {
      expect(service.hasSqlInjection("' UNION SELECT * FROM users--")).toBe(
        true,
      );
    });

    it('should detect DROP statement', () => {
      expect(service.hasSqlInjection("'; DROP TABLE users--")).toBe(true);
    });

    it('should detect comment-based injection', () => {
      expect(service.hasSqlInjection("admin'--")).toBe(true);
    });

    it('should return false for normal input', () => {
      expect(service.hasSqlInjection('John Doe')).toBe(false);
    });

    it('should return false for normal numbers', () => {
      expect(service.hasSqlInjection('200')).toBe(false);
    });
  });

  describe('hasXssAttempt', () => {
    it('should detect script tags', () => {
      expect(service.hasXssAttempt('<script>alert("xss")</script>')).toBe(true);
    });

    it('should detect javascript protocol', () => {
      expect(service.hasXssAttempt('javascript:alert("xss")')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(service.hasXssAttempt('onerror=alert("xss")')).toBe(true);
    });

    it('should return false for normal input', () => {
      expect(service.hasXssAttempt('John Doe')).toBe(false);
    });

    it('should return false for HTML-like content', () => {
      expect(service.hasXssAttempt('Price is < 100')).toBe(false);
    });
  });
});
