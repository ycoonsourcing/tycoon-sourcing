import React from 'react';
import { Package, Warehouse, Calendar, TrendingUp } from 'lucide-react';

// PHASE 3 ENHANCEMENT 2: Withdrawal deal preview panel
// Shows deal details when user selects a deal to withdraw from
export default function WithdrawalDealPreview({ deal, withdrawForm }) {
  if (!deal) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
        <Package size={32} className="text-blue-400 mx-auto mb-3 opacity-50" />
        <p className="text-sm text-slate-600">Select a deal above to see details</p>
      </div>
    );
  }

  const remainingUnits = Math.max(0, (deal.total_units || 0) - (deal.collected_units || 0));
  const unitPrice = deal.total_units > 0 ? (deal.order_value_lkr || 0) / deal.total_units : 0;
  const estimatedWithdrawalAmount = (withdrawForm.units || 0) * unitPrice;

  return (
    <div className="space-y-4">
      {/* Deal header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6">
        <h3 className="text-lg font-black mb-1">{deal.deal_code}</h3>
        <p className="text-blue-100 text-sm">{deal.product}</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">Available units</div>
          <div className="text-2xl font-black text-[#0a2342]">{remainingUnits.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            ({deal.collected_units || 0} of {deal.total_units || 0} collected)
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">Unit price</div>
          <div className="text-2xl font-black text-green-700">
            LKR {unitPrice.toLocaleString('en', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Warehouse info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Warehouse size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-[11px] font-bold text-amber-700 uppercase mb-1">Warehouse</div>
          <div className="text-sm font-semibold text-amber-900">
            {deal.warehouse_id || 'Not specified'}
          </div>
        </div>
      </div>

      {/* Deal dates */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
        <div className="flex items-start gap-3">
          <Calendar size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Started</div>
            <div className="text-sm text-slate-700">
              {deal.started_at 
                ? new Date(deal.started_at).toLocaleDateString('en-GB')
                : new Date(deal.created_at).toLocaleDateString('en-GB')
              }
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Calendar size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Expires</div>
            <div className="text-sm text-slate-700">
              {deal.expires_at
                ? new Date(deal.expires_at).toLocaleDateString('en-GB')
                : 'Not set'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Estimated amount */}
      {withdrawForm.units && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <TrendingUp size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-[11px] font-bold text-blue-700 uppercase mb-1">
                Estimated amount ({withdrawForm.units} units)
              </div>
              <div className="text-2xl font-black text-blue-700">
                LKR {estimatedWithdrawalAmount.toLocaleString('en', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-blue-600 mt-1">
                Base price only (fees calculated after approval)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning if not enough units */}
      {withdrawForm.units && parseInt(withdrawForm.units) > remainingUnits && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-sm font-bold text-red-700">
            ⚠️ Only {remainingUnits} units available
          </div>
          <div className="text-xs text-red-600 mt-1">
            You requested {withdrawForm.units} units but only {remainingUnits} remain.
          </div>
        </div>
      )}
    </div>
  );
}
