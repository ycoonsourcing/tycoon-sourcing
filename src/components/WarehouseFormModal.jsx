import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Warehouse } from 'lucide-react';
import { loadSupabase } from '@/lib/supabase';

const inp = 'w-full px-3 py-2.5 bg-[#0a1929] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm';
const lbl = 'block text-xs font-bold text-blue-300 mb-1.5 uppercase tracking-wider';

export default function WarehouseFormModal({ open, mode='create', warehouse=null, onClose, onSaved }) {
  const [form, setForm] = useState({
    id:'', name:'', location:'', cbm_rate:140, wholesale_rate:80,
    capacity_cbm:100, type:'Owned', active:true, notes:'',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && warehouse) {
      setForm({
        id: warehouse.id, name: warehouse.name || '', location: warehouse.location || '',
        cbm_rate: warehouse.cbm_rate || 140, wholesale_rate: warehouse.wholesale_rate || 80,
        capacity_cbm: warehouse.capacity_cbm || 100, type: warehouse.type || 'Owned',
        active: warehouse.active !== false, notes: warehouse.notes || '',
      });
    } else {
      setForm({ id:'', name:'', location:'', cbm_rate:140, wholesale_rate:80, capacity_cbm:100, type:'Owned', active:true, notes:'' });
    }
  }, [open, mode, warehouse]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const sb = await loadSupabase();
      const payload = {
        id: form.id || `wh-${Date.now().toString(36)}`,
        name: form.name, location: form.location,
        cbm_rate: parseFloat(form.cbm_rate) || 140,
        wholesale_rate: parseFloat(form.wholesale_rate) || 80,
        capacity_cbm: parseInt(form.capacity_cbm) || 100,
        type: form.type, active: form.active, notes: form.notes,
        updated_at: new Date().toISOString(),
      };
      if (mode === 'edit') {
        const { error } = await sb.from('warehouses').update(payload).eq('id', warehouse.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from('warehouses').insert(payload);
        if (error) throw error;
      }
      onSaved?.();
      onClose();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 bg-black/70 z-[105] flex items-start md:items-center justify-center overflow-y-auto p-3 md:p-6">
          <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
            className="bg-[#0a1929] border border-white/10 rounded-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Warehouse size={18} className="text-blue-400" />
                <h2 className="text-lg font-black text-white">{mode === 'edit' ? 'Edit Warehouse' : 'Add Warehouse'}</h2>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className={lbl}>ID code</label>
                  <input type="text" value={form.id} onChange={e => set('id', e.target.value)} disabled={mode === 'edit'} placeholder="wh-abc (auto if blank)" className={inp} /></div>
                <div><label className={lbl}>Name *</label>
                  <input type="text" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Main Warehouse" className={inp} /></div>
                <div className="md:col-span-2"><label className={lbl}>Location *</label>
                  <input type="text" required value={form.location} onChange={e => set('location', e.target.value)} placeholder="Colombo, Sri Lanka" className={inp} /></div>
                <div><label className={lbl}>CBM rate (LKR/day) *</label>
                  <input type="number" required step="1" min="1" value={form.cbm_rate} onChange={e => set('cbm_rate', e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Wholesale rate (LKR/day)</label>
                  <input type="number" step="1" min="0" value={form.wholesale_rate} onChange={e => set('wholesale_rate', e.target.value)} className={inp} />
                  <p className="text-[10px] text-slate-500 mt-1">Cost to Tycoon from warehouse partner</p></div>
                <div><label className={lbl}>Capacity (CBM)</label>
                  <input type="number" min="1" value={form.capacity_cbm} onChange={e => set('capacity_cbm', e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Type</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)} className={inp + ' cursor-pointer'}>
                    <option value="Owned">Owned</option>
                    <option value="Partner">Partner</option>
                    <option value="Leased">Leased</option>
                  </select></div>
              </div>
              <div>
                <label className={lbl}>Notes</label>
                <textarea rows="2" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any internal notes about this warehouse..." className={inp + ' resize-none'} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 accent-green-500" />
                <span className="text-sm text-white">Active — available for new deals</span>
              </label>
              {err && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">{err}</div>}
              <div className="flex gap-3 pt-3 border-t border-white/10">
                <button type="submit" disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-lg">
                  {busy ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> {mode === 'edit' ? 'Save changes' : 'Add warehouse'}</>}
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
