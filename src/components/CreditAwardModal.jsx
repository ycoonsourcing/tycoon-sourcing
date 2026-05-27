import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Gift } from 'lucide-react';
import { SITE } from '@/content';
import { loadSupabase, getUser } from '@/lib/supabase';

const inp = 'w-full px-3 py-2.5 bg-[#0a1929] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm';
const lbl = 'block text-xs font-bold text-blue-300 mb-1.5 uppercase tracking-wider';

export default function CreditAwardModal({ open, client, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [months, setMonths] = useState(SITE.rewards_expiry_months || 12);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const sb = await loadSupabase();
      const admin = await getUser();
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + parseInt(months));

      await sb.from('credits').insert({
        client_id: client.id,
        amount_earned: parseFloat(amount),
        balance: parseFloat(amount),
        expires_at: expiresAt.toISOString(),
        status: 'active',
        source: 'manual_award',
        awarded_by: admin?.id,
        notes: reason || 'Manual credit award',
      });

      await sb.from('notifications').insert({
        client_id: client.id,
        type: 'success',
        message: `You received LKR ${parseFloat(amount).toLocaleString()} in deposit credits! Reason: ${reason || 'Promotional'}`,
      });

      onSaved?.();
      setAmount(''); setReason('');
      onClose();
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Failed to award credit');
    }
    setBusy(false);
  };

  if (!client) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 bg-black/70 z-[105] flex items-center justify-center p-3 md:p-6">
          <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
            className="bg-[#0a1929] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Gift size={20} className="text-green-400" />
                <h2 className="text-lg font-black text-white">Award Credit</h2>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">Recipient</div>
                <div className="text-sm font-bold text-white">{client.company || client.full_name}</div>
                <div className="text-[11px] text-slate-400">{client.email}</div>
              </div>

              <div>
                <label className={lbl}>Credit amount (LKR) *</label>
                <input type="number" required min="1" step="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="10000" className={inp} />
              </div>

              <div>
                <label className={lbl}>Reason / Notes *</label>
                <textarea required rows="3" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Referral bonus, goodwill gesture, promotion..." className={inp + ' resize-none'} />
              </div>

              <div>
                <label className={lbl}>Expires in (months)</label>
                <input type="number" min="1" max="36" value={months} onChange={e => setMonths(e.target.value)} className={inp} />
              </div>

              {err && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">{err}</div>}

              <div className="flex gap-3 pt-3 border-t border-white/10">
                <button type="submit" disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold rounded-lg">
                  {busy ? <><Loader2 size={16} className="animate-spin" /> Awarding...</> : <><Gift size={16} /> Award LKR {amount ? (+amount).toLocaleString() : '0'}</>}
                </button>
                <button type="button" onClick={onClose} className="px-5 py-3 border border-white/20 text-white hover:bg-white/5 rounded-lg font-semibold">Cancel</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
