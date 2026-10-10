import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Server } from 'lucide-react';
import { formatCurrency, formatPercent } from '../../lib/utils';

export default function ServiceCostCard({ serviceItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Server className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-800 truncate">
              {serviceItem.serviceName || serviceItem.service}
            </h4>
            <p className="text-xs font-mono text-slate-500 truncate">{serviceItem.service}</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-base font-bold text-slate-900 font-mono">
            {formatCurrency(serviceItem.costUSD)}
          </p>
          <span className="text-xs font-semibold text-blue-600">
            {formatPercent(serviceItem.percentage)}
          </span>
        </div>
      </div>

      {serviceItem.usageDetails && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors pt-2 border-t border-slate-100 w-full justify-between"
          >
            <span>{expanded ? 'Hide usage details' : 'View usage details'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono space-y-1 text-slate-700 overflow-x-auto">
              <pre className="text-[11px] text-slate-700">
                {JSON.stringify(serviceItem.usageDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
