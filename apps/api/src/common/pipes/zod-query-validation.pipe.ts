import { type PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodSchema } from 'zod';

@Injectable()
export class ZodQueryValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema<unknown>) {}

  transform(value: unknown) {
    const coerced = this.coerceQueryParams(value);
    const result = this.schema.safeParse(coerced);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }
    return result.data;
  }

  private coerceQueryParams(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) return obj;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof value === 'string') {
        if (value === 'true') { result[key] = true; continue; }
        if (value === 'false') { result[key] = false; continue; }
        const num = Number(value);
        result[key] = !isNaN(num) && value !== '' ? num : value;
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}
