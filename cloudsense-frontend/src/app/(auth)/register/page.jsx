'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Cloud, ShieldCheck, Zap, PhoneCall, Loader2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import CountryCodeSelect, { COUNTRIES } from '../../../components/ui/CountryCodeSelect';
import GoogleSignInButton from '../../../components/ui/GoogleSignInButton';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    countryCode: z.string().min(1, 'Please select a country'),
    localPhone: z
      .string()
      .min(4, 'Phone number is too short')
      .max(15, 'Phone number is too long')
      .regex(/^\d+$/, 'Phone number must contain only digits'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, googleLogin, loading } = useAuth();
  const [submitError, setSubmitError] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSuccess = async (credential) => {
    setSubmitError(null);
    setGoogleLoading(true);
    const result = await googleLogin(credential);
    if (!result.success) {
      setSubmitError(result.error);
    }
    setGoogleLoading(false);
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      countryCode: 'US',
      localPhone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setSubmitError(null);
    const country = COUNTRIES.find((c) => c.code === data.countryCode);
    const fullPhone = `${country.dial}${data.localPhone}`;
    const result = await registerUser({
      name: data.name,
      email: data.email,
      phone: fullPhone,
      password: data.password,
    });
    if (!result.success) {
      setSubmitError(result.error);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* Left panel - Branding */}
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
            Take control of your AWS infrastructure spending.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Connect in under 3 minutes via AWS STS. Automated phone alerts, AI optimization, and zero risk.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Instant Waste Identification</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pinpoint idle resources, unattached IPs, and misconfigured services immediately.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Interactive Twilio Voice Calls</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated phone calls with DTMF keypad acknowledgment when critical budgets breach.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Zero-Risk Delegation</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  AssumeRole read-only policies. No secret keys or credentials ever stored.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          CloudSense Module 1 — AI Cost Monitor & Anomaly Detector
        </div>
      </div>

      {/* Right panel - Form */}
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

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create an account</h2>
            <p className="text-xs text-slate-500 mt-1">
              Start monitoring your AWS cloud spending in under 3 minutes.
            </p>
          </div>

          {submitError && <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Yasar Pathan"
                {...register('name')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Work Email
              </label>
              <input
                type="email"
                placeholder="yasar@cloudsense.io"
                {...register('email')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number (for incident phone calls)
              </label>
              <div className="flex">
                <Controller
                  name="countryCode"
                  control={control}
                  render={({ field }) => (
                    <CountryCodeSelect
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <input
                  type="tel"
                  placeholder="4155552671"
                  {...register('localPhone')}
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-r-lg border border-slate-200 bg-white text-slate-900 text-xs shadow-sm placeholder:text-slate-400 font-mono focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Used for AWS alert phone calls only. Select your country code above.
              </p>
              {errors.countryCode && (
                <p className="text-xs text-red-600 mt-1">{errors.countryCode.message}</p>
              )}
              {errors.localPhone && (
                <p className="text-xs text-red-600 mt-1">{errors.localPhone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
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
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('confirmPassword')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-4 py-1">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Google Sign-In */}
          <div className="relative">
            {googleLoading && (
              <div className="absolute inset-0 bg-white/60 rounded-lg flex items-center justify-center z-10">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
                  Creating account...
                </div>
              </div>
            )}
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={(msg) => setSubmitError(msg)}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
