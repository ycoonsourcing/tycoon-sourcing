import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, User } from 'lucide-react';
import { loadSupabase } from '@/lib/supabase';

const inp = 'w-full px-3 py-2.5 bg-[#0a1929] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm';
const lbl = 'block text-xs font-bold text-blue-300 mb-1.5 uppercase tracking-wider';

export default function ClientEditModal({ open, client, onClose, onSaved }) {
  const [form, setForm] = useState({ full_name:'', company:'', phone:'', nic:'', address:'', district:'', status:'pending' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open || !client) return;
    setForm({
      full_name: client.full_name || '',
      company:   client.company || '',
      phone:     client.phone || '',
      nic:       client.nic || '',
      address:   client.address || '',
      district:  client.district || '',
      status:    client.status || 'pending',
    });
  }, [open, client]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const sb = await loadSupabase();
      const { error } = await sb.from('profiles').update(form).eq('id', client.id);
      if (error) throw error;
      onSaved?.();
      onClose();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  if (!client) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 bg-black/70 z-[105] flex items-start md:items-center justify-center overflow-y-auto p-3 md:p-6">
          <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
            className="bg-[#0a1929] border border-white/10 rounded-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <User size={18} className="text-blue-400" />
                <h2 className="text-lg font-black text-white">Edit Client</h2>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">Email (cannot be changed)</div>
                <div className="text-sm text-white">{client.email}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className={lbl}>Full name</label>
                  <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Company</label>
                  <input type="text" value={form.company} onChange={e => set('company', e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Phone</label>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} /></div>
                <div><label className={lbl}>NIC</label>
                  <input type="text" value={form.nic} onChange={e => set('nic', e.target.value)} className={inp} /></div>
                <div className="md:col-span-2"><label className={lbl}>Address</label>
                  <textarea rows="2" value={form.address} onChange={e => set('address', e.target.value)} className={inp + ' resize-none'} /></div>
                <div><label className={lbl}>District</label>
                  <input type="text" value={form.district} onChange={e => set('district', e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className={inp + ' cursor-pointer'}>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="suspended">Suspended</option>
                  </select></div>
              </div>

              {err && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">{err}</div>}

              <div className="flex gap-3 pt-3 border-t border-white/10">
                <button type="submit" disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-lg">
                  {busy ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save changes</>}
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
