'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  KeyRound,
  Zap,
  Loader2,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import ErrorBanner from '../../../components/ui/ErrorBanner';

// Schemas
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const passwordSchema = z
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

export default function ForgotPasswordPage() {
  const { forgotPassword, verifyOtp, resetPassword, loading } = useAuth();

  // Stepper state: 1 = Email, 2 = OTP verification, 3 = New password, 4 = Success
  const [step, setStep] = useState(1);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [verifiedResetToken, setVerifiedResetToken] = useState(null);
  const [devOtp, setDevOtp] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // OTP 6-box input state
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form for Step 1
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  // Form for Step 3
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const passwordVal = watchPassword('password', '');
  const confirmPasswordVal = watchPassword('confirmPassword', '');

  const hasMinLength = passwordVal.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordVal);
  const hasNumber = /[0-9]/.test(passwordVal);
  const passwordsMatch = passwordVal.length > 0 && passwordVal === confirmPasswordVal;

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle Step 1: Request OTP
  const onEmailSubmit = async (data) => {
    setSubmitError(null);
    const result = await forgotPassword(data.email);
    if (result.success) {
      setSubmittedEmail(data.email);
      setDevOtp(result.devOtp || null);
      setCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
      setStep(2);
      // Focus first OTP input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } else {
      setSubmitError(result.error);
    }
  };

  // Handle Resending OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || !submittedEmail) return;
    setSubmitError(null);
    const result = await forgotPassword(submittedEmail);
    if (result.success) {
      setDevOtp(result.devOtp || null);
      setCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      setSubmitError(result.error);
    }
  };

  // Handle OTP Box input navigation & paste
  const handleOtpChange = (index, value) => {
    // Only accept digits
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      const updated = [...otpValues];
      updated[index] = '';
      setOtpValues(updated);
      return;
    }

    // Handle single digit
    const char = cleanValue.slice(-1);
    const updated = [...otpValues];
    updated[index] = char;
    setOtpValues(updated);

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = [...otpValues];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setOtpValues(updated);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // Auto-fill dev OTP helper
  const handleAutoFillDevOtp = () => {
    if (!devOtp || devOtp.length !== 6) return;
    setOtpValues(devOtp.split(''));
  };

  // Handle Step 2: Verify OTP
  const onVerifyOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      setSubmitError('Please enter all 6 digits of the verification code.');
      return;
    }

    setSubmitError(null);
    const result = await verifyOtp(submittedEmail, fullOtp);
    if (result.success) {
      setVerifiedResetToken(result.resetToken);
      setStep(3);
    } else {
      setSubmitError(result.error);
    }
  };

  // Handle Step 3: Set New Password
  const onPasswordSubmit = async (data) => {
    setSubmitError(null);
    const result = await resetPassword({
      token: verifiedResetToken,
      email: submittedEmail,
      otp: otpValues.join(''),
      password: data.password,
    });

    if (result.success) {
      setStep(4);
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
            Multi-factor account recovery verification.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Verify your identity with a single-use 6-digit OTP code sent directly to your registered address before any password changes can be made.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">10-Minute Time-Limited OTP</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Single-use cryptographic 6-digit passcode automatically invalidates after 10 minutes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Guaranteed Unauthorized Block</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  No password changes can occur without positive OTP verification on the backend.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Instant Access Resumption</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seamlessly reset and return to your live AWS cost anomalies and budget dashboards.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          CloudSense Module 1 — AI Cost Monitor & Anomaly Detector
        </div>
      </div>

      {/* Right panel - Dynamic Step Content */}
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

          {/* Stepper Progress Bar (for steps 1-3) */}
          {step <= 3 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                <span className={step >= 1 ? 'text-blue-600 font-semibold' : ''}>1. Email</span>
                <span className={step >= 2 ? 'text-blue-600 font-semibold' : ''}>2. Verify OTP</span>
                <span className={step >= 3 ? 'text-blue-600 font-semibold' : ''}>3. New Password</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-600 transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Banner */}
          {submitError && (
            <ErrorBanner
              message={submitError}
              onDismiss={() => setSubmitError(null)}
            />
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <>
              <div>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 mb-3">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Forgot your password?
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Enter your registered email address. We will send a 6-digit verification OTP code to confirm your identity.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Account email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="you@company.com"
                      {...registerEmail('email')}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {emailErrors.email && (
                    <p className="text-xs text-red-600 mt-1">{emailErrors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Sending code...' : 'Send Verification OTP'}</span>
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

          {/* STEP 2: Enter & Verify 6-digit OTP */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Enter verification code
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  We sent a 6-digit OTP to{' '}
                  <strong className="text-slate-800">{submittedEmail}</strong>. Enter it below to proceed:
                </p>
              </div>

              {/* Dev mode helper badge */}
              {devOtp && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Local Dev OTP: <strong className="font-mono text-sm tracking-widest text-amber-950">{devOtp}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoFillDevOtp}
                      className="text-[10px] bg-amber-200/70 hover:bg-amber-300 text-amber-900 font-semibold px-2 py-0.5 rounded transition-colors"
                    >
                      Fill Code
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-700">
                    Displayed for instant local testing without SMTP server.
                  </p>
                </div>
              )}

              {/* 6-box OTP input */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  6-Digit OTP Code
                </label>
                <div className="flex items-center justify-between gap-2" onPaste={handleOtpPaste}>
                  {otpValues.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e.target.value, e)}
                      className="w-12 h-14 text-center text-xl font-bold font-mono rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={onVerifyOtpSubmit}
                disabled={loading || otpValues.join('').length !== 6}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{loading ? 'Verifying code...' : 'Verify Code & Proceed'}</span>
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || loading}
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setDevOtp(null);
                  }}
                  className="text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  Change email
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to sign in</span>
                </Link>
              </div>
            </div>
          )}

          {/* STEP 3: Set New Password (Unlocked after OTP verification) */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Set new password
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  OTP verified! Create a strong, new password for <strong className="text-slate-800">{submittedEmail}</strong>.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...registerPassword('password')}
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
                  {passwordErrors.password && (
                    <p className="text-xs text-red-600 mt-1">
                      {passwordErrors.password.message}
                    </p>
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
                      {...registerPassword('confirmPassword')}
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
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">
                      {passwordErrors.confirmPassword.message}
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
            </div>
          )}

          {/* STEP 4: Success confirmation */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Password updated!
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Your password has been securely reset. You can now log into your CloudSense account with your new credentials.
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
        </div>
      </div>
    </div>
  );
}
