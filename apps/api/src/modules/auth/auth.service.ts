import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { createHash, createHmac } from 'crypto';
import { OTP_COLUMNS, USER_COLUMNS } from '../../common/constants/columns';
import type {
  SendOtpInput,
  VerifyOtpInput,
  LoginInput,
  GoogleAuthInput,
  RefreshTokenInput,
  SelectRoleInput,
} from '@petzone/validators';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  private isTestPhone(phone: string): boolean {
    const list = this.config.get<string>('TEST_PHONE_NUMBERS') || '';
    return list.split(',').map((n) => n.trim()).filter(Boolean).includes(phone);
  }

  async sendOtp(body: SendOtpInput) {
    const isTest = this.isTestPhone(body.phone);
    const otp = isTest ? '123456' : String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();

    const { error } = await this.supabase.client
      .from('otp_verifications')
      .insert({
        phone: body.phone,
        otp_hash: otpHash,
        expires_at: expiresAt,
      });

    if (error) throw new BadRequestException(error.message);

    return {
      message: 'OTP sent',
      ...(isTest && { otp }),
    };
  }

  async verifyOtp(body: VerifyOtpInput) {
    if (this.isTestPhone(body.phone) && body.otp === '123456') {
      // Test phone shortcut — skip OTP record validation
    } else {
      const { data: otpRecord, error: otpError } = await this.supabase.client
        .from('otp_verifications')
        .select(OTP_COLUMNS)
        .eq('phone', body.phone)
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpRecord) throw new BadRequestException('No valid OTP found');

      if (new Date(otpRecord.expires_at) < new Date()) {
        throw new BadRequestException('OTP expired');
      }

      if (otpRecord.locked_until && new Date(otpRecord.locked_until) > new Date()) {
        throw new BadRequestException('OTP verification locked, try again later');
      }

      if (otpRecord.attempts >= otpRecord.max_attempts) {
        await this.supabase.client
          .from('otp_verifications')
          .update({ locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString() })
          .eq('id', otpRecord.id);
        throw new BadRequestException('Too many attempts, locked for 15 minutes');
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
    }

    // Check if user with this phone already exists
    const { data: existingUser } = await this.supabase.client
      .from('users')
      .select(USER_COLUMNS)
      .eq('phone', body.phone)
      .single();

    if (existingUser) {
      // Existing user — sign in
      const derivedPassword = this.deriveOtpPassword(body.phone);
      const { data: session, error: signInError } = await this.supabase.createAuthClient()
        .auth.signInWithPassword({ phone: body.phone, password: derivedPassword });

      if (signInError) throw new BadRequestException(signInError.message);

      await this.supabase.client
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', existingUser.id);

      return {
        access_token: session.session!.access_token,
        refresh_token: session.session!.refresh_token,
        user: existingUser,
        is_new_user: false,
      };
    }

    // New user — create account
    const derivedPassword = this.deriveOtpPassword(body.phone);
    const { data: authData, error: authError } = await this.supabase.client.auth.admin
      .createUser({
        phone: body.phone,
        password: derivedPassword,
        phone_confirm: true,
      });

    if (authError) throw new BadRequestException(authError.message);

    const { data: user, error: insertError } = await this.supabase.client
      .from('users')
      .insert({
        id: authData.user.id,
        phone: body.phone,
      })
      .select(USER_COLUMNS)
      .single();

    if (insertError) throw new BadRequestException(insertError.message);

    const { data: session, error: sessionError } = await this.supabase.createAuthClient()
      .auth.signInWithPassword({ phone: body.phone, password: derivedPassword });

    if (sessionError) throw new BadRequestException(sessionError.message);

    return {
      access_token: session.session!.access_token,
      refresh_token: session.session!.refresh_token,
      user,
      is_new_user: true,
    };
  }

  async login(body: LoginInput) {
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
      .select(USER_COLUMNS)
      .eq('id', data.user.id)
      .single();

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user,
    };
  }

  async google(body: GoogleAuthInput) {
    const { data, error } = await this.supabase.createAuthClient().auth.signInWithIdToken({
      provider: 'google',
      token: body.id_token,
      nonce: body.nonce,
    });

    if (error) throw new BadRequestException(error.message);

    const authUser = data.user;
    const { data: existingUser } = await this.supabase.client
      .from('users')
      .select(USER_COLUMNS)
      .eq('id', authUser.id)
      .single();

    if (existingUser) {
      await this.supabase.client
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          social_provider: 'google',
        })
        .eq('id', authUser.id);

      return {
        access_token: data.session!.access_token,
        refresh_token: data.session!.refresh_token,
        user: existingUser,
        is_new_user: false,
      };
    }

    const { data: newUser, error: insertError } = await this.supabase.client
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name ?? null,
        avatar_url: authUser.user_metadata?.avatar_url ?? null,
        social_provider: 'google',
        social_id: authUser.user_metadata?.sub ?? null,
      })
      .select(USER_COLUMNS)
      .single();

    if (insertError) throw new BadRequestException(insertError.message);

    return {
      access_token: data.session!.access_token,
      refresh_token: data.session!.refresh_token,
      user: newUser,
      is_new_user: true,
    };
  }

  async refresh(body: RefreshTokenInput) {
    const { data, error } = await this.supabase.createAuthClient().auth.refreshSession({
      refresh_token: body.refresh_token,
    });

    if (error) throw new UnauthorizedException(error.message);

    return {
      access_token: data.session!.access_token,
      refresh_token: data.session!.refresh_token,
    };
  }

  async selectRole(userId: string, body: SelectRoleInput) {
    const { data: existing } = await this.supabase.client
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (existing?.role) {
      throw new ConflictException('Role already selected and cannot be changed');
    }

    const { data, error } = await this.supabase.client
      .from('users')
      .update({ role: body.role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select(USER_COLUMNS)
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
