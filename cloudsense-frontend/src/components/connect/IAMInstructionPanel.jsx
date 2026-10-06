'use client';

import React, { useState } from 'react';
import { CheckSquare, Square, ExternalLink, Terminal } from 'lucide-react';
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
        <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <span>Follow these instructions in AWS</span>
        </h4>

        <div className="space-y-2.5">
          {steps.map((s) => {
            const isChecked = Boolean(checkedSteps[s.id]);
            return (
              <div
                key={s.id}
                onClick={() => toggleStep(s.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 shadow-sm ${
                  isChecked
                    ? 'border-emerald-200 bg-emerald-50/50 text-slate-700'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-semibold ${isChecked ? 'text-slate-700 line-through' : 'text-slate-900'}`}>
                      {s.id}. {s.title}
                    </p>
                    {s.link && (
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Console <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{s.description}</p>
                  {s.badges && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {s.badges.map((b) => (
                        <span
                          key={b}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200 font-medium"
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
            <Terminal className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Trust Policy JSON
            </span>
          </div>
          <CopyButton text={trustPolicyJson} />
        </div>

        <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 overflow-x-auto shadow-sm">
          <pre className="font-mono text-xs text-slate-800 leading-relaxed">
            {trustPolicyJson}
          </pre>
        </div>
      </div>
    </div>
  );
}
