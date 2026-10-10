'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Cloud, ShieldCheck, Zap, PhoneCall, Loader2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import ErrorBanner from '../../../components/ui/ErrorBanner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error: authError } = useAuth();
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data) => {
    setSubmitError(null);
    const result = await login(data.email, data.password);
    if (!result.success) {
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
            Stop your AWS bill before it surprises you.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Continuous cost anomaly detection, real-time budget forecasting, and proactive phone alerts
            delivered straight to your on-call phone.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">10 Heuristic AI Patterns</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Catches idle NAT gateways, unattached EIPs, overprovisioned Lambdas, and off-hours leaks.
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
                  High-severity alerts trigger phone calls with DTMF keypress acknowledgment directly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Zero-Credential IAM Delegation</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  AssumeRole with external ID. We never see or store your AWS Secret Keys.
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
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-1">
              Welcome back. Enter your credentials to access your AWS dashboard.
            </p>
          </div>

          {(submitError || authError) && (
            <ErrorBanner
              message={submitError || authError}
              onDismiss={() => setSubmitError(null)}
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                {...register('email')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Password
                </label>
              </div>
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-slate-900">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Signing in...' : 'Sign in to CloudSense'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
