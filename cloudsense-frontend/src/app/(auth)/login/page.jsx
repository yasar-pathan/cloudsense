'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Cloud, ShieldCheck, Zap, PhoneCall, Loader2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import GoogleSignInButton from '../../../components/ui/GoogleSignInButton';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin, loading, error: authError } = useAuth();
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
    <div className="min-h-screen w-full flex bg-[#0a0a0a]">
      {/* Left panel - Product Showpiece (desktop only) */}
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
            Stop your AWS bill before it surprises you.
          </h1>
          <p className="text-base text-zinc-400 leading-relaxed">
            Continuous cost anomaly detection, real-time budget forecasting, and proactive phone alerts
            delivered straight to your on-call phone.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">10 Heuristic AI Patterns</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Catches idle NAT gateways, unattached EIPs, overprovisioned Lambdas, and off-hours leaks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Interactive Twilio Voice Calls</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  High-severity alerts trigger phone calls with DTMF keypress acknowledgment directly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Zero-Credential IAM Delegation</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  AssumeRole with external ID. We never see or store your AWS Secret Keys.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-400">
          CloudSense Module 1 — AI Cost Monitor & Anomaly Detector
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
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
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Sign in to your account</h2>
            <p className="text-sm text-zinc-400 mt-1.5">
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
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                {...register('email')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#222222] bg-[#111111] text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 hover:text-zinc-300">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded border-[#222222] bg-[#111111] text-blue-600 focus:ring-0 focus:ring-offset-0"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Signing in...' : 'Sign in to CloudSense'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-4 py-1">
            <div className="flex-1 h-px bg-[#222222]"></div>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">or</span>
            <div className="flex-1 h-px bg-[#222222]"></div>
          </div>

          {/* Google Sign-In */}
          <div className="relative">
            {googleLoading && (
              <div className="absolute inset-0 bg-[#0a0a0a]/60 rounded-lg flex items-center justify-center z-10">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <div className="w-4 h-4 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin"></div>
                  Signing in...
                </div>
              </div>
            )}
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={(msg) => setSubmitError(msg)}
            />
          </div>

          <div className="pt-4 border-t border-[#222222] text-center">
            <p className="text-xs text-zinc-400">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
