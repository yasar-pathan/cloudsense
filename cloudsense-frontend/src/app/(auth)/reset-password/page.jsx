'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import ErrorBanner from '../../../components/ui/ErrorBanner';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { verifyResetToken, resetPassword, loading } = useAuth();

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [associatedEmail, setAssociatedEmail] = useState('');
  const [tokenError, setTokenError] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const passwordValue = watch('password', '');
  const confirmPasswordValue = watch('confirmPassword', '');

  // Validation indicators
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const passwordsMatch = passwordValue.length > 0 && passwordValue === confirmPasswordValue;

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setVerifying(false);
        setTokenValid(false);
        setTokenError('No reset token was provided in the URL.');
        return;
      }

      const result = await verifyResetToken(token);
      setVerifying(false);
      if (result.success) {
        setTokenValid(true);
        setAssociatedEmail(result.email || '');
      } else {
        setTokenValid(false);
        setTokenError(result.error || 'This password reset link is invalid or has expired.');
      }
    }

    checkToken();
  }, [token]);

  const onSubmit = async (data) => {
    setSubmitError(null);
    const result = await resetPassword(token, data.password);
    if (result.success) {
      setIsSuccess(true);
    } else {
      setSubmitError(result.error);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* Left panel - Product Showpiece (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-white border-r border-slate-200">
        <div className="flex items-center gap-3">
          <img
            src="/cloudsense_favicon_hd.png"
            alt="CloudSense Logo"
            className="w-10 h-10 rounded-xl shadow-sm object-contain"
          />
          <span className="text-xl font-bold tracking-tight text-slate-900">
            CloudSense
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
            prod
          </span>
        </div>

        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Security first AWS cost governance.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Configure a strong password to guard your multi-account AWS cost insights, real-time anomaly alerts, and automated budget notifications.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Bcrypt Salt Factor 12 Hashing</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Passwords are encrypted at rest with industry-standard key derivation functions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Single-Use Token Revocation</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  The reset token is instantly purged upon use to eliminate replay attacks.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          CloudSense Module 1 — AI Cost Monitor & Anomaly Detector
        </div>
      </div>

      {/* Right panel - Form & States */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <img
              src="/cloudsense_favicon_hd.png"
              alt="CloudSense Logo"
              className="w-8 h-8 rounded-lg shadow-sm object-contain"
            />
            <span className="text-lg font-bold tracking-tight text-slate-900">
              CloudSense
            </span>
          </div>

          {/* Verifying Token State */}
          {verifying && (
            <div className="py-12 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Verifying reset token</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Please hold on while we validate your link...
                </p>
              </div>
            </div>
          )}

          {/* Invalid or Expired Token State */}
          {!verifying && !tokenValid && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Invalid or Expired Link
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {tokenError || 'This password reset link is invalid or has expired.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left">
                <p className="text-[11px] text-slate-500 leading-normal">
                  Password reset links are only valid for <strong>60 minutes</strong> and can only be used once. Please request a new link to proceed.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  href="/forgot-password"
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Request a new reset link</span>
                </Link>

                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to sign in</span>
                </Link>
              </div>
            </div>
          )}

          {/* Success State */}
          {!verifying && tokenValid && isSuccess && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Password reset successfully
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Your password has been securely updated. You can now sign in using your new credentials.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>Sign in to CloudSense</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Active Reset Password Form */}
          {!verifying && tokenValid && !isSuccess && (
            <>
              <div>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Create new password
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {associatedEmail ? (
                    <>
                      Setting new password for <strong className="text-slate-800">{associatedEmail}</strong>.
                    </>
                  ) : (
                    'Choose a strong password to protect your CloudSense account.'
                  )}
                </p>
              </div>

              {submitError && (
                <ErrorBanner
                  message={submitError}
                  onDismiss={() => setSubmitError(null)}
                />
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('confirmPassword')}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Password Criteria Checklist */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <p className="text-[11px] font-semibold text-slate-700">Password requirements:</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {hasMinLength ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                      )}
                      <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                        8+ characters
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasUppercase ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                      )}
                      <span className={hasUppercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                        1 uppercase letter
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasNumber ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                      )}
                      <span className={hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                        1 number
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {passwordsMatch ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                      )}
                      <span className={passwordsMatch ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                        Passwords match
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Updating password...' : 'Update Password'}</span>
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to sign in</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
