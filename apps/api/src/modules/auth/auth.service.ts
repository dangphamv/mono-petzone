import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { createHash, createHmac } from 'crypto';
import type { SendOtpDto, VerifyOtpDto, LoginDto, RegisterDto, GoogleAuthDto, RefreshTokenDto, SelectRoleDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  async sendOtp(userId: string, body: SendOtpDto) {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error } = await this.supabase.client
      .from('otp_verifications')
      .insert({
        phone: body.phone,
        otp_hash: otpHash,
        expires_at: expiresAt,
      });

    if (error) throw new BadRequestException(error.message);

    const isDev = this.config.get<string>('NODE_ENV') !== 'production';
    return {
      message: 'OTP sent',
      ...(isDev && { otp }),
    };
  }

  async verifyOtp(userId: string, body: VerifyOtpDto) {
    const { data: otpRecord, error: otpError } = await this.supabase.client
      .from('otp_verifications')
      .select('*')
      .eq('phone', body.phone)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) throw new BadRequestException('No valid OTP found');

    if (new Date(otpRecord.expires_at) < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    if (otpRecord.attempts >= otpRecord.max_attempts) {
      throw new BadRequestException('Too many attempts');
    }

    if (otpRecord.locked_until && new Date(otpRecord.locked_until) > new Date()) {
      throw new BadRequestException('OTP verification locked, try again later');
    }

    const incomingHash = createHash('sha256').update(body.otp).digest('hex');
    if (incomingHash !== otpRecord.otp_hash) {
      await this.supabase.client
        .from('otp_verifications')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);
      throw new BadRequestException('Invalid OTP');
    }

    await this.supabase.client
      .from('otp_verifications')
      .update({ is_used: true })
      .eq('id', otpRecord.id);

    const { data: user, error: updateError } = await this.supabase.client
      .from('users')
      .update({ phone: body.phone, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw new BadRequestException(updateError.message);

    return { message: 'Phone verified', user };
  }

  async login(body: LoginDto) {
    const { data, error } = await this.supabase.createAuthClient().auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) throw new UnauthorizedException(error.message);

    await this.supabase.client
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id);

    const { data: user } = await this.supabase.client
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user,
    };
  }

  async register(body: RegisterDto) {
    let authUserId: string;

    const { data: authData, error: authError } = await this.supabase.client.auth.admin
      .createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        app_metadata: { role: 'owner' },
      });

    if (authError) {
      if (!authError.message?.toLowerCase().includes('already')) {
        throw new BadRequestException(authError.message);
      }

      // Auth user exists — check if public.users row exists too
      const { data: existingUser } = await this.supabase.client
        .from('users')
        .select('id')
        .eq('email', body.email)
        .single();

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      // Orphaned auth user (no public.users row) — recover by updating password
      const listResult = await this.supabase.client.auth.admin.listUsers();
      const orphan = listResult.data.users.find((u: any) => u.email === body.email);
      if (!orphan) throw new ConflictException('Email already registered');

      await this.supabase.client.auth.admin.updateUserById(orphan.id, { password: body.password });
      authUserId = orphan.id;
    } else {
      authUserId = authData.user.id;
    }

    const { data: user, error: insertError } = await this.supabase.client
      .from('users')
      .insert({
        id: authUserId,
        email: body.email,
        full_name: body.full_name,
        phone: body.phone ?? null,
        role: 'owner',
      })
      .select()
      .single();

    if (insertError) throw new BadRequestException(insertError.message);

    const { data: session, error: sessionError } = await this.supabase.createAuthClient().auth
      .signInWithPassword({ email: body.email, password: body.password });

    if (sessionError) throw new BadRequestException(sessionError.message);

    return {
      access_token: session!.session!.access_token,
      refresh_token: session!.session!.refresh_token,
      user,
    };
  }

  async google(body: GoogleAuthDto) {
    const { data, error } = await this.supabase.createAuthClient().auth.signInWithIdToken({
      provider: 'google',
      token: body.id_token,
      nonce: body.nonce,
    });

    if (error) throw new BadRequestException(error.message);

    const authUser = data.user;
    const { data: existingUser } = await this.supabase.client
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    let user = existingUser;
    if (!existingUser) {
      const { data: newUser, error: insertError } = await this.supabase.client
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name ?? authUser.email,
          avatar_url: authUser.user_metadata?.avatar_url ?? null,
          social_provider: 'google',
          social_id: authUser.user_metadata?.sub ?? null,
          role: 'owner',
        })
        .select()
        .single();
      if (insertError) throw new BadRequestException(insertError.message);
      user = newUser;
    } else {
      const { data: updated } = await this.supabase.client
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          social_provider: 'google',
        })
        .eq('id', authUser.id)
        .select()
        .single();
      user = updated;
    }

    return {
      access_token: data.session!.access_token,
      refresh_token: data.session!.refresh_token,
      user,
    };
  }

  async refresh(body: RefreshTokenDto) {
    const { data, error } = await this.supabase.createAuthClient().auth.refreshSession({
      refresh_token: body.refresh_token,
    });

    if (error) throw new UnauthorizedException(error.message);

    return {
      access_token: data.session!.access_token,
      refresh_token: data.session!.refresh_token,
    };
  }

  async selectRole(userId: string, body: SelectRoleDto) {
    const { data, error } = await this.supabase.client
      .from('users')
      .update({ role: body.role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.supabase.client.auth.admin.updateUserById(userId, {
      app_metadata: { role: body.role },
    });

    return data;
  }

  async logout(userId: string) {
    await this.supabase.client
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('revoked_at', null);

    return { message: 'Logged out' };
  }

  private deriveOtpPassword(phone: string): string {
    const secret = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    return createHmac('sha256', secret).update(`otp:${phone}`).digest('hex');
  }
}
