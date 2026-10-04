'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Shield, Check, Loader2, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import { useAppStore } from '../../store/useAppStore';
import CopyButton from '../ui/CopyButton';
import IAMInstructionPanel from './IAMInstructionPanel';
import ErrorBanner from '../ui/ErrorBanner';

const AWS_REGIONS = [
  { code: 'us-east-1', name: 'US East (N. Virginia)' },
  { code: 'us-east-2', name: 'US East (Ohio)' },
  { code: 'us-west-1', name: 'US West (N. California)' },
  { code: 'us-west-2', name: 'US West (Oregon)' },
  { code: 'eu-west-1', name: 'Europe (Ireland)' },
  { code: 'eu-central-1', name: 'Europe (Frankfurt)' },
  { code: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
  { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
  { code: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' },
];

export default function ConnectionStepWizard({ onConnected }) {
  const router = useRouter();
  const { setActiveConnection } = useAppStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [externalId, setExternalId] = useState('');
  const [generatingId, setGeneratingId] = useState(false);

  const [roleArn, setRoleArn] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [connectedAccount, setConnectedAccount] = useState(null);

  const handleGenerateId = async () => {
    setGeneratingId(true);
    setError(null);
    try {
      const res = await api.get('/aws/generate-external-id');
      if (res.success && res.data?.externalId) {
        setExternalId(res.data.externalId);
        setCurrentStep(2);
      } else {
        throw new Error(res.message || 'Failed to generate External ID');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate External ID');
    } finally {
      setGeneratingId(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!roleArn.trim()) {
      setError('IAM Role ARN is required');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const res = await api.post('/aws/connect', {
        roleArn: roleArn.trim(),
        externalId,
        region,
      });

      if (res.success && res.data?.connection) {
        setActiveConnection(res.data.connection);
        setConnectedAccount(res.data.connection);
        setCurrentStep(4); // Success step
        if (onConnected) onConnected(res.data.connection);
      } else {
        throw new Error(res.message || 'Failed to connect');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not assume role. Double-check the Role ARN and trust policy.'
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 md:p-8 space-y-8">
      {/* Wizard Header & Progress Tabs */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            Connect your AWS Account
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            We use IAM Roles — we never store your AWS credentials.
          </p>
        </div>

        {/* Security Info Box */}
        <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-950/20 flex items-start gap-3 text-sm text-zinc-300">
          <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-200/90 leading-relaxed">
            CloudSense assumes a role in your account using AWS STS. We only require read access for cost
            and resource telemetry. Your primary credentials never leave AWS.
          </p>
        </div>

        {/* Stepper Bar */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {[
            { num: 1, label: 'External ID' },
            { num: 2, label: 'IAM Setup' },
            { num: 3, label: 'Verify & Connect' },
          ].map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  isCompleted
                    ? 'border-green-500/30 bg-green-950/20 text-green-300'
                    : isCurrent
                    ? 'border-blue-500/40 bg-blue-950/30 text-blue-200'
                    : 'border-[#222222] bg-zinc-900/40 text-zinc-500'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCompleted
                      ? 'bg-green-500 text-black'
                      : isCurrent
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.num}
                </div>
                <span className="truncate">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Step 1: Generate External ID */}
      {currentStep === 1 && (
        <div className="space-y-6 pt-2">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <span>Step 1: Generate External ID</span>
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              An External ID acts as a secret passphrase between your AWS account and CloudSense to
              prevent the Confused Deputy vulnerability.
            </p>
          </div>

          {externalId ? (
            <div className="p-4 rounded-lg border border-[#222222] bg-[#0c0c0c] flex items-center justify-between gap-3">
              <span className="font-mono text-sm text-zinc-200">{externalId}</span>
              <div className="flex items-center gap-2">
                <CopyButton text={externalId} />
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                >
                  Continue to Step 2 →
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={generatingId}
              onClick={handleGenerateId}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {generatingId && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Generate External ID</span>
            </button>
          )}
        </div>
      )}

      {/* Step 2: IAM Instruction Panel */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                Step 2: Create IAM Role in AWS
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Use this unique External ID in your Trust Policy:
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#222222] bg-[#0c0c0c]">
              <span className="font-mono text-xs text-zinc-300">{externalId}</span>
              <CopyButton text={externalId} />
            </div>
          </div>

          <IAMInstructionPanel externalId={externalId} />

          <div className="flex items-center justify-between pt-4 border-t border-[#222222]">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-lg border border-[#222222] bg-zinc-900 text-zinc-300 text-xs font-medium hover:bg-zinc-800 transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              <span>I have created the role. Continue →</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Enter Role ARN & Connect */}
      {currentStep === 3 && (
        <form onSubmit={handleConnect} className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-zinc-100">
              Step 3: Enter Role ARN and Connect
            </h3>
            <p className="text-xs text-zinc-400">
              Paste the ARN from the role you just created in the AWS IAM Console.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                IAM Role ARN
              </label>
              <input
                type="text"
                placeholder="arn:aws:iam::123456789012:role/CloudSenseRole"
                value={roleArn}
                onChange={(e) => setRoleArn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#222222] bg-[#0c0c0c] text-zinc-100 font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Primary AWS Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#222222] bg-[#0c0c0c] text-zinc-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                {AWS_REGIONS.map((r) => (
                  <option key={r.code} value={r.code} className="bg-zinc-900 text-zinc-200">
                    {r.code} — {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#222222]">
            <button
              type="button"
              disabled={connecting}
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-lg border border-[#222222] bg-zinc-900 text-zinc-300 text-xs font-medium hover:bg-zinc-800 transition-colors"
            >
              ← Back to instructions
            </button>
            <button
              type="submit"
              disabled={connecting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {connecting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{connecting ? 'Verifying connection with AWS...' : 'Verify & Connect'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Step 4: Success View */}
      {currentStep === 4 && connectedAccount && (
        <div className="p-8 rounded-xl border border-green-500/30 bg-green-950/20 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-zinc-100">AWS Connection Verified!</h3>
            <p className="text-sm text-zinc-300">
              Account <span className="font-mono font-semibold">{connectedAccount.accountId}</span> is
              now connected and ready for monitoring.
            </p>
          </div>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
