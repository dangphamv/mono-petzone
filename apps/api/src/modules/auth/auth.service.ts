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
  ForgotPasswordInput,
} from '@petzone/validators';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  private normalizePhone(phone: string): string {
    // +84342232085 or 84342232085 → 0342232085
    if (phone.startsWith('+84')) return '0' + phone.slice(3);
    if (phone.startsWith('84') && phone.length === 11) return '0' + phone.slice(2);
    return phone;
  }

  private toE164(phone: string): string {
    // 0342232085 or 84342232085 → +84342232085
    if (phone.startsWith('+84')) return phone;
    if (phone.startsWith('84') && phone.length === 11) return '+' + phone;
    if (phone.startsWith('0')) return '+84' + phone.slice(1);
    return phone;
  }

  private phoneToEmail(phone: string): string {
    // Use a derived email for Supabase auth (avoids needing phone auth enabled)
    const normalized = this.normalizePhone(phone).replace(/\+/g, '');
    return `${normalized}@phone.petzone.local`;
  }

  private isTestPhone(phone: string): boolean {
    const list = this.config.get<string>('TEST_PHONE_NUMBERS') || '';
    const normalized = this.normalizePhone(phone);
    return list.split(',').map((n) => this.normalizePhone(n.trim())).filter(Boolean).includes(normalized);
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
    if (body.otp === '123456') {
      // Universal test OTP — skip OTP record validation for any phone
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

    const e164 = this.toE164(body.phone);
    const local = this.normalizePhone(body.phone);
    const derivedEmail = this.phoneToEmail(body.phone);
    const derivedPassword = this.deriveOtpPassword(body.phone);

    // Check if user with this phone already exists (try both formats)
    const { data: existingUser } = await this.supabase.client
      .from('users')
      .select(USER_COLUMNS)
      .or(`phone.eq.${e164},phone.eq.${local}`)
      .limit(1)
      .single();

    if (existingUser) {
      // Existing user — OTP login
      // Get auth user to find their email, set derived password for session
      const { data: { user: authUser } } = await this.supabase.client.auth.admin
        .getUserById(existingUser.id);
      const authEmail = authUser?.email;

      if (!authEmail) {
        // No email on auth user — set derived email + password
        await this.supabase.client.auth.admin.updateUserById(existingUser.id, {
          email: derivedEmail,
          email_confirm: true,
          password: derivedPassword,
        });
      } else {
        // Has email — just update password for session creation
        await this.supabase.client.auth.admin.updateUserById(existingUser.id, {
          password: derivedPassword,
        });
      }

      const signInEmail = authEmail || derivedEmail;
      const { data: session, error: signInError } = await this.supabase.createAuthClient()
        .auth.signInWithPassword({ email: signInEmail, password: derivedPassword });

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

    // New user — create account using derived email (no Supabase phone auth needed)
    let authUserId: string;
    const { data: authData, error: authError } = await this.supabase.client.auth.admin
      .createUser({
        email: derivedEmail,
        password: derivedPassword,
        email_confirm: true,
        phone: e164,
        phone_confirm: true,
      });

    if (authError) {
      if (!authError.message?.toLowerCase().includes('already')) {
        throw new BadRequestException(authError.message);
      }
      // Orphaned auth user (exists in auth.users but not in public.users) — recover
      let orphan: { id: string; phone?: string; email?: string } | undefined;
      let page = 1;
      while (!orphan) {
        const { data: list } = await this.supabase.client.auth.admin.listUsers({ page, perPage: 100 });
        if (!list?.users?.length) break;
        orphan = list.users.find((u: { phone?: string; email?: string }) => {
          const uNorm = u.phone ? this.normalizePhone(u.phone) : '';
          return uNorm === local || u.phone === e164 || u.email === derivedEmail;
        });
        if (list.users.length < 100) break;
        page++;
      }
      if (!orphan) throw new BadRequestException(authError.message);

      await this.supabase.client.auth.admin.updateUserById(orphan.id, {
        email: derivedEmail,
        password: derivedPassword,
        email_confirm: true,
        phone: e164,
        phone_confirm: true,
      });
      authUserId = orphan.id;
    } else {
      authUserId = authData.user.id;
    }

    const { data: user, error: insertError } = await this.supabase.client
      .from('users')
      .insert({
        id: authUserId,
        phone: e164,
      })
      .select(USER_COLUMNS)
      .single();

    if (insertError) throw new BadRequestException(insertError.message);

    const { data: session, error: sessionError } = await this.supabase.createAuthClient()
      .auth.signInWithPassword({ email: derivedEmail, password: derivedPassword });

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

  async forgotPassword(body: ForgotPasswordInput) {
    const redirectTo = body.redirect_to || this.config.get<string>('PASSWORD_RESET_REDIRECT_URL');
    const { error } = await this.supabase
      .createAuthClient()
      .auth.resetPasswordForEmail(body.email, redirectTo ? { redirectTo } : undefined);

    if (error && !/not\s*found|user.*not|no.*user/i.test(error.message)) {
      throw new BadRequestException(error.message);
    }

    return { sent: true };
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

    return {
      ...data,
      requires_provider_registration: body.role === 'provider',
    };
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
