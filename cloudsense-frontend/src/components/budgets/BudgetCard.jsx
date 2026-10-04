'use client';

import React, { useState } from 'react';
import { Target, Edit2, Trash2, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';
import BudgetProgressBar from './BudgetProgressBar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function BudgetCard({ budget, status, onEdit, onDelete }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOverall = budget.type === 'overall';
  const label = isOverall ? 'Overall Account Budget' : budget.service || 'Per-Service Budget';

  const currentSpend = status?.currentSpend || 0;
  const limit = budget.monthlyLimit || 1;
  const isBreached = status?.isBreached || currentSpend >= limit;
  const isNearBreached =
    status?.isNearBreached || (currentSpend / limit) * 100 >= budget.alertAtPercent;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(budget._id);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-5 space-y-4 hover:border-zinc-700/60 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isOverall
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
            }`}
          >
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">{label}</h4>
            <p className="text-xs text-zinc-400">
              {isOverall ? 'Total cloud spend limit' : `Service: ${budget.service}`}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            isBreached
              ? 'border-red-500/30 bg-red-950/40 text-red-400'
              : isNearBreached
              ? 'border-amber-500/30 bg-amber-950/40 text-amber-400'
              : 'border-green-500/30 bg-green-950/40 text-green-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isBreached ? 'bg-red-400' : isNearBreached ? 'bg-amber-400' : 'bg-green-400'
            }`}
          />
          {isBreached ? 'Exceeded' : isNearBreached ? 'Near Limit' : 'Healthy'}
        </span>
      </div>

      {/* Spend vs Limit */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-xs text-zinc-400">Current Spend: </span>
          <span className="font-mono text-lg font-bold text-zinc-100">
            {formatCurrency(currentSpend)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-zinc-400">Cap: </span>
          <span className="font-mono text-sm font-semibold text-zinc-300">
            {formatCurrency(budget.monthlyLimit)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <BudgetProgressBar
        current={currentSpend}
        limit={budget.monthlyLimit}
        alertAtPercent={budget.alertAtPercent}
      />

      <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-[#222222]">
        <span>Alert threshold: {budget.alertAtPercent}%</span>
        <span>Created {formatDate(budget.createdAt)}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => onEdit(budget)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#222222] bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteModal}
        title="Delete Budget"
        message={`Are you sure you want to delete the budget for "${label}"? Automated threshold alerts will no longer trigger.`}
        confirmText="Delete Budget"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
