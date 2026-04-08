import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SupabaseService } from '../../modules/supabase/supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);
  private jwtSecret: Uint8Array | null = null;

  private jwtIssuer: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
    private readonly config?: ConfigService,
  ) {
    const secret = this.config?.get<string>('SUPABASE_JWT_SECRET');
    if (secret) {
      this.jwtSecret = new TextEncoder().encode(secret);
      this.logger.log('Local JWT verification enabled');
    }
    const supabaseUrl = this.config?.get<string>('SUPABASE_URL') ?? '';
    this.jwtIssuer = `${supabaseUrl}/auth/v1`;
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const req = ctx.switchToHttp().getRequest<Request & { user?: unknown }>();
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (isPublic) {
      if (token) {
        const user = await this.verifyToken(token);
        if (user) req.user = user;
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const user = await this.verifyToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    req.user = user;
    return true;
  }

  private async verifyToken(token: string) {
    if (this.jwtSecret) {
      try {
        const { payload } = await jwtVerify(token, this.jwtSecret, {
          issuer: this.jwtIssuer,
        });
        if (!payload.sub) return null;
        return {
          id: payload.sub,
          email: payload.email as string | undefined,
          role: payload.role as string | undefined,
          aud: payload.aud,
          app_metadata: payload.app_metadata ?? {},
          user_metadata: payload.user_metadata ?? {},
        };
      } catch {
        // Local verification failed (e.g. ES256 token with HS256 secret) — fall through to API
      }
    }

    const { data, error } = await this.supabase.client.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user;
  }
}
