import { Injectable } from '@nestjs/common';

@Injectable()
export class SanitizationService {
  sanitizeString(value: string): string {
    if (typeof value !== 'string') return value;

    let sanitized = value.replace(/<[^>]*>/g, '');

    sanitized = sanitized.replace(/javascript:/gi, '');

    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    sanitized = sanitized.replace(/'/g, "''");

    sanitized = sanitized.trim();

    return sanitized;
  }

  sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized = { ...obj };

    for (const key of Object.keys(sanitized)) {
      const value = sanitized[key];
      if (typeof value === 'string') {
        (sanitized as Record<string, unknown>)[key] =
          this.sanitizeString(value);
      }
    }

    return sanitized;
  }

  sanitizeArray<T extends Record<string, unknown>>(rows: T[]): T[] {
    return rows.map((row) => this.sanitizeObject(row));
  }

  hasSqlInjection(value: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/i,
      /(--|\/\*|\*\/)/,
      /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
      /('.*(\bOR\b|\bAND\b).*')/i,
      /(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP))/i,
    ];

    return sqlPatterns.some((pattern) => pattern.test(value));
  }

  hasXssAttempt(value: string): boolean {
    const xssPatterns = [
      /<script\b[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=\s*["']?[^"'\s]*["']?/gi,
      /<[^>]*\b(onerror|onload|onclick)\b[^>]*>/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(value));
  }
}
