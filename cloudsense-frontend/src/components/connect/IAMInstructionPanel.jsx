'use client';

import React, { useState } from 'react';
import { CheckSquare, Square, Shield, ExternalLink, Terminal } from 'lucide-react';
import CopyButton from '../ui/CopyButton';

export default function IAMInstructionPanel({ externalId, cloudsenseAccountId = '123456789012' }) {
  const [checkedSteps, setCheckedSteps] = useState({});

  const toggleStep = (step) => {
    setCheckedSteps((prev) => ({ ...prev, [step]: !prev[step] }));
  };

  const trustPolicyJson = JSON.stringify(
    {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${cloudsenseAccountId}:root`,
          },
          Action: 'sts:AssumeRole',
          Condition: {
            StringEquals: {
              'sts:ExternalId': externalId || 'YOUR_EXTERNAL_ID_HERE',
            },
          },
        },
      ],
    },
    null,
    2
  );

  const steps = [
    {
      id: 1,
      title: 'Open AWS IAM Console',
      description: 'Navigate to AWS Console → IAM → Roles → click "Create Role".',
      link: 'https://console.aws.amazon.com/iam/home#/roles',
    },
    {
      id: 2,
      title: 'Select Trusted Entity',
      description: 'Choose "Custom trust policy" or "Another AWS account" as the trusted entity type.',
    },
    {
      id: 3,
      title: 'Paste Trust Policy',
      description: 'Paste the Trust Policy JSON provided below into the policy editor.',
    },
    {
      id: 4,
      title: 'Attach Permissions Policies',
      description: 'Search for and attach the following AWS managed policies:',
      badges: ['ReadOnlyAccess', 'AWSCostExplorerFullAccess'],
    },
    {
      id: 5,
      title: 'Name and Create Role',
      description: 'Set role name to "CloudSenseRole" and click "Create role".',
    },
    {
      id: 6,
      title: 'Copy Role ARN',
      description: 'Open the created role and copy its Role ARN for Step 3 below.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Step by step checklist */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <span>Follow these instructions in AWS</span>
        </h4>

        <div className="space-y-2.5">
          {steps.map((s) => {
            const isChecked = Boolean(checkedSteps[s.id]);
            return (
              <div
                key={s.id}
                onClick={() => toggleStep(s.id)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                  isChecked
                    ? 'border-green-500/30 bg-green-950/10 text-zinc-300'
                    : 'border-[#222222] bg-[#111111] hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-green-400" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-500" />
                  )}
                </button>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${isChecked ? 'text-zinc-200 line-through' : 'text-zinc-200'}`}>
                      {s.id}. {s.title}
                    </p>
                    {s.link && (
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                      >
                        Console <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">{s.description}</p>
                  {s.badges && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {s.badges.map((b) => (
                        <span
                          key={b}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust Policy JSON */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Trust Policy JSON
            </span>
          </div>
          <CopyButton text={trustPolicyJson} />
        </div>

        <div className="relative rounded-lg border border-[#222222] bg-[#0c0c0c] p-4 overflow-x-auto">
          <pre className="font-mono text-xs text-zinc-300 leading-relaxed">
            {trustPolicyJson}
          </pre>
        </div>
      </div>
    </div>
  );
}
