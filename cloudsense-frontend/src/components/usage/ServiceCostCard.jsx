import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Server } from 'lucide-react';
import { formatCurrency, formatPercent } from '../../lib/utils';

export default function ServiceCostCard({ serviceItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-zinc-200 truncate">
              {serviceItem.serviceName || serviceItem.service}
            </h4>
            <p className="text-xs font-mono text-zinc-400 truncate">{serviceItem.service}</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-base font-bold text-zinc-100 font-mono">
            {formatCurrency(serviceItem.costUSD)}
          </p>
          <span className="text-xs font-semibold text-blue-400">
            {formatPercent(serviceItem.percentage)}
          </span>
        </div>
      </div>

      {serviceItem.usageDetails && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors pt-2 border-t border-[#222222] w-full justify-between"
          >
            <span>{expanded ? 'Hide usage details' : 'View usage details'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div className="mt-2 p-3 rounded-lg bg-[#0c0c0c] border border-[#222222] text-xs font-mono space-y-1 text-zinc-400 overflow-x-auto">
              <pre className="text-[11px] text-zinc-300">
                {JSON.stringify(serviceItem.usageDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
