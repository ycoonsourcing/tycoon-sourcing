import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, Loader2, Trash2, Edit2 } from 'lucide-react';
import { loadSupabase } from '@/lib/supabase';

const inp = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm';
const lbl = 'block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider';

// PHASE 3.4: Admin batch action modal
// Handle approve/reject/collect/release/delete operations
export default function BatchActionModal({ open, batch, deal, action, onClose, onSuccess }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [formData, setFormData] = useState({
    status: batch?.status || 'pending',
    units: batch?.units || '',
    pickup_date: batch?.pickup_date ? batch.pickup_date.split('T')[0] : '',
    notes: batch?.notes || '',
    payment_method: batch?.payment_method || '',
    payment_reference: batch?.payment_reference || '',
  });

  const handleAction = async () => {
    setBusy(true);
    setErr('');
    try {
      const sb = await loadSupabase();

      switch (action) {
        case 'approve':
          await sb.from('batches').update({ status: 'ready' }).eq('id', batch.id);
          break;
        case 'reject':
          await sb.from('batches').update({ status: 'cancelled' }).eq('id', batch.id);
          break;
        case 'collect':
          await sb.from('batches').update({ 
            status: 'collected',
            collected_at: new Date().toISOString()
          }).eq('id', batch.id);
          break;
        case 'release':
          await sb.from('batches').update({ 
            status: 'released',
            paid_at: new Date().toISOString()
          }).eq('id', batch.id);
          break;
        case 'edit':
          await sb.from('batches').update(formData).eq('id', batch.id);
          break;
        case 'delete':
          await sb.from('batches').delete().eq('id', batch.id);
          break;
      }

      onSuccess?.();
      onClose();
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Action failed');
    }
    setBusy(false);
  };

  const getTitle = () => {
    switch (action) {
      case 'approve': return 'Approve Batch';
      case 'reject': return 'Reject Batch';
      case 'collect': return 'Mark as Collected';
      case 'release': return 'Release Goods';
      case 'edit': return 'Edit Batch';
      case 'delete': return 'Delete Batch';
      default: return 'Batch Action';
    }
  };

  const getButtonColor = () => {
    switch (action) {
      case 'approve': return 'bg-green-600 hover:bg-green-500';
      case 'reject': return 'bg-red-600 hover:bg-red-500';
      case 'collect': return 'bg-blue-600 hover:bg-blue-500';
      case 'release': return 'bg-purple-600 hover:bg-purple-500';
      case 'edit': return 'bg-amber-600 hover:bg-amber-500';
      case 'delete': return 'bg-red-600 hover:bg-red-500';
      default: return 'bg-slate-600 hover:bg-slate-500';
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-[120] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-md border border-slate-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-black text-slate-900">{getTitle()}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Batch info */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Batch #</span>
                  <span className="font-bold text-slate-900">{batch?.batch_num}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Units</span>
                  <span className="font-bold text-slate-900">{batch?.units}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Amount</span>
                  <span className="font-bold text-slate-900">LKR {(batch?.amount_lkr || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Edit form */}
              {action === 'edit' && (
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Pickup Date</label>
                    <input type="date" value={formData.pickup_date} onChange={e => setFormData(f => ({ ...f, pickup_date: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Units</label>
                    <input type="number" value={formData.units} onChange={e => setFormData(f => ({ ...f, units: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Notes</label>
                    <textarea rows="3" value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} className={inp + ' resize-none'} />
                  </div>
                  {(action === 'release' || action === 'collect') && (
                    <>
                      <div>
                        <label className={lbl}>Payment Method</label>
                        <select value={formData.payment_method} onChange={e => setFormData(f => ({ ...f, payment_method: e.target.value }))} className={inp + ' cursor-pointer'}>
                          <option value="">Select...</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cash">Cash</option>
                          <option value="cheque">Cheque</option>
                          <option value="online">Online / Card</option>
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Payment Reference</label>
                        <input type="text" value={formData.payment_reference} onChange={e => setFormData(f => ({ ...f, payment_reference: e.target.value }))} placeholder="Transaction ID" className={inp} />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Confirmation messages */}
              {action === 'reject' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">This will reject the batch and notify the client.</p>
                </div>
              )}
              {action === 'delete' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700"><strong>Warning:</strong> This action cannot be undone!</p>
                </div>
              )}

              {err && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{err}</div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-slate-200">
              <button onClick={onClose} className="flex-1 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold">
                Cancel
              </button>
              <button onClick={handleAction} disabled={busy}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 ${getButtonColor()} disabled:opacity-60 text-white font-bold rounded-lg`}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                {action === 'delete' ? 'Delete' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
