import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

export interface BaseResponse<T> {
  status: 'success';
  data: T;
  message: string;
  meta?: unknown;
}

const isPaginated = (
  value: unknown,
): value is { data: unknown; meta: unknown } => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'meta' in value &&
    Object.keys(value).length === 2
  );
};

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<BaseResponse<unknown>> {
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'Request successful';

    return next.handle().pipe(
      map((payload) => {
        if (isPaginated(payload)) {
          return {
            status: 'success' as const,
            data: payload.data,
            meta: payload.meta,
            message,
          };
        }

        return {
          status: 'success' as const,
          data: payload ?? null,
          message,
        };
      }),
    );
  }
}
