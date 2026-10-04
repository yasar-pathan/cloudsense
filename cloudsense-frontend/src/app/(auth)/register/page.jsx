'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Cloud, ShieldCheck, Zap, PhoneCall, Loader2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import ErrorBanner from '../../../components/ui/ErrorBanner';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in international format (e.g. +14155552671, +919876543210)'),
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
  const { register: registerUser, loading } = useAuth();
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setSubmitError(null);
    const result = await registerUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
    });
    if (!result.success) {
      setSubmitError(result.error);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0a0a0a]">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-br from-[#111111] via-[#0d0d0d] to-[#0a0a0a] border-r border-[#222222]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Cloud className="w-6 h-6 text-blue-500" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Cloud<span className="text-blue-500">Sense</span>
          </span>
        </div>

        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100 leading-tight">
            Take control of your AWS infrastructure spending.
          </h1>
          <p className="text-base text-zinc-400 leading-relaxed">
            Connect in under 3 minutes via AWS STS. Automated phone alerts, AI optimization, and zero risk.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Instant Waste Identification</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pinpoint idle resources, unattached IPs, and misconfigured services immediately.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Critical Breach Phone Calls</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Never miss an off-hours spike. CloudSense rings your phone when thresholds trigger.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Read-Only IAM Architecture</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Granular role permissions with external ID trust protection.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-400">
          CloudSense Module 1 — AI Cost Monitor & Anomaly Detector
        </div>
      </div>

      {/* Right panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 my-auto">
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Cloud className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Cloud<span className="text-blue-500">Sense</span>
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Create your account</h2>
            <p className="text-sm text-zinc-400 mt-1.5">
              Set up your profile to start monitoring your AWS accounts.
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
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Alex Morgan"
                {...register('name')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#222222] bg-[#111111] text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                placeholder="alex@company.com"
                {...register('email')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#222222] bg-[#111111] text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+14155552671"
                {...register('phone')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#222222] bg-[#111111] text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Used for AWS alert phone calls only. International format required (+...).
              </p>
              {errors.phone && (
                <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  {...register('password')}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-[#222222] bg-[#111111] text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                {...register('confirmPassword')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#222222] bg-[#111111] text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Creating account...' : 'Create your account'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-[#222222] text-center">
            <p className="text-xs text-zinc-400">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
