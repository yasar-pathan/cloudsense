'use client';

import React, { useState } from 'react';
import { Target, Edit2, Trash2 } from 'lucide-react';
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isOverall
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-cyan-50 border-cyan-200 text-cyan-600'
            }`}
          >
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
            <p className="text-xs text-slate-500">
              {isOverall ? 'Total cloud spend limit' : `Service: ${budget.service}`}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            isBreached
              ? 'border-red-200 bg-red-50 text-red-600'
              : isNearBreached
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isBreached ? 'bg-red-500' : isNearBreached ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
          {isBreached ? 'Exceeded' : isNearBreached ? 'Near Limit' : 'Healthy'}
        </span>
      </div>

      {/* Spend vs Limit */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-xs text-slate-500">Current Spend: </span>
          <span className="font-mono text-lg font-bold text-slate-900">
            {formatCurrency(currentSpend)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">Cap: </span>
          <span className="font-mono text-sm font-semibold text-slate-700">
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

      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
        <span>Alert threshold: {budget.alertAtPercent}%</span>
        <span>Created {formatDate(budget.createdAt)}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => onEdit(budget)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-sm transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
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
