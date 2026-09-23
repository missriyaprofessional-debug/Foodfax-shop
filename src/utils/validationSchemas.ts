import { z } from 'zod';

/**
 * Robust Indian Mobile Number Regex:
 * Must be 10 digits, optionally prefixed by +91 or 91 or 0, starting with 6, 7, 8, or 9
 */
const INDIAN_PHONE_REGEX = /^(?:(?:\+|0{0,2})91(\s*[-]\s*)?|[0]?)?[6789]\d{9}$/;

export const phoneSchema = z
  .string()
  .min(1, 'Mobile number is required')
  .transform((val) => val.trim().replace(/\s+/g, ''))
  .refine((val) => {
    const digits = val.replace(/\D/g, '');
    const cleanDigits = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
    return cleanDigits.length === 10 && /^[6-9]\d{9}$/.test(cleanDigits);
  }, {
    message: 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)',
  });

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .max(64, 'Password must not exceed 64 characters');

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters long')
  .max(70, 'Name must not exceed 70 characters')
  .regex(/^[a-zA-Z\s.'-]+$/, 'Name must only contain letters, spaces, and standard punctuation');

export const otpSchema = z
  .string()
  .trim()
  .length(6, 'Verification code must be exactly 6 digits')
  .regex(/^\d{6}$/, 'Verification code must contain only numbers');

// Login Form Schema: Password Mode
export const loginPasswordSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
});

// Login Form Schema: OTP Mode
export const loginOtpSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

// Register Form Schema
export const registerSchema = z
  .object({
    fullName: nameSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Forgot Password Request Schema
export const forgotPasswordRequestSchema = z.object({
  phone: phoneSchema,
});

// Forgot Password Reset Schema
export const forgotPasswordResetSchema = z
  .object({
    phone: phoneSchema,
    otp: otpSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginPasswordInput = z.infer<typeof loginPasswordSchema>;
export type LoginOtpInput = z.infer<typeof loginOtpSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordRequestInput = z.infer<typeof forgotPasswordRequestSchema>;
export type ForgotPasswordResetInput = z.infer<typeof forgotPasswordResetSchema>;
