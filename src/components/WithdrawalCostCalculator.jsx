import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';

// PHASE 3.2: Real-time cost calculator component
// Shows breakdown of all fees as user changes inputs
export default function WithdrawalCostCalculator({ deal, withdrawForm }) {
  if (!deal) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
        <p className="text-sm text-slate-500">Select a deal to see cost breakdown</p>
      </div>
    );
  }

  const units = parseInt(withdrawForm.units) || 0;
  const pickupDate = withdrawForm.date ? new Date(withdrawForm.date) : new Date();
  const startDate = deal.started_at ? new Date(deal.started_at) : new Date(deal.created_at);
  const daysHeld = Math.max(1, Math.ceil((pickupDate - startDate) / (1000 * 60 * 60 * 24)));

  // Calculate fees
  const unitPrice = deal.total_units > 0 ? (deal.order_value_lkr || 0) / deal.total_units : 0;
  const baseCost = units * unitPrice;
  const handlingFee = baseCost * ((deal.handling_pct || 3) / 100);
  
  const cbmPerUnit = deal.total_units > 0 ? (deal.total_cbm || 0) / deal.total_units : 0;
  const cbmTotal = units * cbmPerUnit;
  const storageFee = cbmTotal * (deal.cbm_rate_lkr || 140) * daysHeld;
  
  const serviceFee = baseCost * ((deal.service_pct || 4) / 100) * (daysHeld / 30);
  const totalAmount = baseCost + handlingFee + storageFee + serviceFee;

  const fmt = v => `LKR ${(+v || 0).toLocaleString('en', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={20} />
          <h3 className="text-lg font-black">Cost Breakdown</h3>
        </div>
        <p className="text-blue-100 text-sm">Real-time calculation</p>
      </div>

      {/* Cost breakdown */}
      <div className="space-y-3">
        {/* Base cost */}
        <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase mb-0.5">Base goods cost</div>
            <div className="text-xs text-slate-600">{units.toLocaleString()} units × {fmt(unitPrice)}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-slate-700">{fmt(baseCost)}</div>
          </div>
        </div>

        {/* Handling fee */}
        <div className="flex justify-between items-center p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div>
            <div className="text-xs font-bold text-amber-700 uppercase mb-0.5">Handling fee</div>
            <div className="text-xs text-amber-600">{deal.handling_pct || 3}% of base cost</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-amber-700">{fmt(handlingFee)}</div>
          </div>
        </div>

        {/* Storage fee */}
        <div className="flex justify-between items-center p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <div>
            <div className="text-xs font-bold text-purple-700 uppercase mb-0.5">Storage fee</div>
            <div className="text-xs text-purple-600">{cbmTotal.toFixed(3)} CBM × {deal.cbm_rate_lkr || 140}/day × {daysHeld} days</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-purple-700">{fmt(storageFee)}</div>
          </div>
        </div>

        {/* Service fee */}
        <div className="flex justify-between items-center p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
          <div>
            <div className="text-xs font-bold text-cyan-700 uppercase mb-0.5">Service fee</div>
            <div className="text-xs text-cyan-600">{deal.service_pct || 4}%/mo × {daysHeld} days</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-cyan-700">{fmt(serviceFee)}</div>
          </div>
        </div>

        {/* TOTAL */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl border-2 border-blue-500">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-0.5">Total Estimated Cost</div>
            <div className="text-xs text-blue-100">All fees included</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black">{fmt(totalAmount)}</div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {units > (deal.total_units - (deal.collected_units || 0)) && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-red-700">Not enough units available</div>
            <div className="text-xs text-red-600 mt-1">Only {(deal.total_units - (deal.collected_units || 0)).toLocaleString()} units remaining</div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="text-xs text-blue-700">
          <strong>Note:</strong> This is an estimate. Actual fees will be calculated when admin approves the batch.
        </div>
      </div>
    </div>
  );
}
