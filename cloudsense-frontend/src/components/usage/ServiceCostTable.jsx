'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Search,
  Server,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../../lib/utils';
import ServiceCostCard from './ServiceCostCard';

export default function ServiceCostTable({ services = [], loading = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('cost'); // 'cost' | 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [expandedRow, setExpandedRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredServices = useMemo(() => {
    return (services || [])
      .filter((s) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          (s.serviceName && s.serviceName.toLowerCase().includes(q)) ||
          (s.service && s.service.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'cost') {
          return sortOrder === 'desc' ? b.costUSD - a.costUSD : a.costUSD - b.costUSD;
        }
        if (sortBy === 'name') {
          const nameA = a.serviceName || a.service || '';
          const nameB = b.serviceName || b.service || '';
          return sortOrder === 'desc'
            ? nameB.localeCompare(nameA)
            : nameA.localeCompare(nameB);
        }
        return 0;
      });
  }, [services, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage) || 1;
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredServices.slice(start, start + itemsPerPage);
  }, [filteredServices, currentPage]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleExpand = (serviceCode) => {
    setExpandedRow(expandedRow === serviceCode ? null : serviceCode);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 space-y-4 animate-pulse">
        <div className="h-9 w-64 bg-zinc-800 rounded-lg" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-zinc-800/40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service name or code..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[#222222] bg-[#111111] text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="text-xs text-zinc-400">
          Showing <span className="font-semibold text-zinc-200">{filteredServices.length}</span>{' '}
          services
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-[#222222] bg-[#111111] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#222222] bg-zinc-950/60 text-zinc-400 font-medium select-none">
              <th
                onClick={() => toggleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Service Name</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3 px-4">Service Code</th>
              <th
                onClick={() => toggleSort('cost')}
                className="py-3 px-4 text-right cursor-pointer hover:text-zinc-200 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Cost (USD)</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">% of Total</th>
              <th className="py-3 px-4 text-center">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222222] text-zinc-300">
            {paginatedServices.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-500">
                  No matching services found
                </td>
              </tr>
            ) : (
              paginatedServices.map((item) => {
                const isExpanded = expandedRow === item.service;
                return (
                  <React.Fragment key={item.service}>
                    <tr
                      onClick={() => toggleExpand(item.service)}
                      className="hover:bg-zinc-900/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-medium text-zinc-200">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-blue-400 shrink-0">
                            <Server className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate max-w-xs">{item.serviceName || item.service}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                        {item.service}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-zinc-100">
                        {formatCurrency(item.costUSD)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-blue-400">
                        {formatPercent(item.percentage)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          className="p-1 rounded text-zinc-500 group-hover:text-zinc-300 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Usage Details */}
                    {isExpanded && (
                      <tr className="bg-[#0c0c0c]">
                        <td colSpan={5} className="p-4 border-t border-[#222222]">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                              <Layers className="w-3.5 h-3.5 text-blue-400" />
                              <span>Raw Cost Explorer Telemetry</span>
                            </div>
                            <pre className="p-3 rounded-lg border border-[#222222] bg-zinc-950 font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed">
                              {JSON.stringify(item.usageDetails || item, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#222222] flex items-center justify-between text-xs text-zinc-400">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-[#222222] bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-[#222222] bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3">
        {paginatedServices.map((item) => (
          <ServiceCostCard key={item.service} serviceItem={item} />
        ))}
      </div>
    </div>
  );
}
