import { z } from 'zod'

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^(\+84|0)\d{9,10}$/, 'Số điện thoại không hợp lệ'),
})

export const verifyOtpSchema = z.object({
  phone: z.string(),
  otp: z.string().length(6, 'OTP phải có 6 chữ số'),
})

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
})

export const registerSchema = loginSchema.extend({
  full_name: z.string().min(2).max(100),
  phone: z.string().regex(/^(\+84|0)\d{9,10}$/).optional(),
})

export const googleAuthSchema = z.object({
  id_token: z.string().min(1),
  nonce: z.string().optional(),
})

export const selectRoleSchema = z.object({
  role: z.enum(['owner', 'provider', 'admin']),
})

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
})

export type SendOtpInput = z.infer<typeof sendOtpSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>
export type SelectRoleInput = z.infer<typeof selectRoleSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
