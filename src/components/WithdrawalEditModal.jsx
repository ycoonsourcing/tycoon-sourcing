import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { loadSupabase } from '@/lib/supabase';
import WithdrawalCostCalculator from '@/components/WithdrawalCostCalculator';

const inp = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 text-sm';
const lbl = 'block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider';

// PHASE 4: Edit withdrawal request modal
// Allows clients to edit pending withdrawal requests
export default function WithdrawalEditModal({ open, withdrawal, deal, onClose, onSuccess }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [formData, setFormData] = useState({
    units: withdrawal?.units_requested || '',
    date: withdrawal?.pickup_date ? withdrawal.pickup_date.split('T')[0] : '',
    notes: withdrawal?.notes || '',
  });

  const handleSave = async () => {
    if (!formData.units || !formData.date) {
      setErr('Units and date are required');
      return;
    }

    setBusy(true);
    setErr('');
    try {
      const sb = await loadSupabase();
      
      const { error } = await sb
        .from('withdrawals')
        .update({
          units_requested: parseInt(formData.units),
          pickup_date: formData.date,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawal.id);

      if (error) throw error;

      onSuccess?.();
      onClose();
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Failed to update withdrawal');
    }
    setBusy(false);
  };

  // For cost preview
  const previewFormData = {
    dealId: deal?.id,
    units: formData.units || '0',
    date: formData.date || new Date().toISOString().split('T')[0],
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-[120] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.95 }} 
            animate={{ scale: 1 }} 
            exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-3xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg font-black text-slate-900">Edit Withdrawal Request</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 grid md:grid-cols-2 gap-6">
              {/* Left: Form */}
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Current Deal</div>
                  <div className="text-lg font-black text-slate-900">{deal?.deal_code}</div>
                  <div className="text-xs text-slate-600 mt-1">Cannot be changed</div>
                </div>

                <div>
                  <label className={lbl}>Units to Withdraw</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={formData.units} 
                      onChange={e => setFormData(f => ({ ...f, units: e.target.value }))} 
                      className={inp}
                      placeholder="Number of units"
                    />
                    <div className="text-xs text-slate-500 pt-2.5 whitespace-nowrap">
                      Was: {withdrawal?.units_requested}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={lbl}>Pickup Date</label>
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      value={formData.date} 
                      onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} 
                      className={inp}
                    />
                    <div className="text-xs text-slate-500 pt-2.5 whitespace-nowrap">
                      Was: {withdrawal?.pickup_date ? new Date(withdrawal.pickup_date).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={lbl}>Notes</label>
                  <textarea 
                    rows="3" 
                    value={formData.notes} 
                    onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} 
                    className={inp + ' resize-none'}
                    placeholder="Any special requests or changes..."
                  />
                </div>

                {err && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700">{err}</div>
                  </div>
                )}
              </div>

              {/* Right: Cost Preview */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Updated Cost Breakdown</div>
                {deal && (
                  <WithdrawalCostCalculator 
                    deal={deal}
                    withdrawForm={previewFormData}
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-slate-200 bg-slate-50">
              <button 
                onClick={onClose} 
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-lg"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
