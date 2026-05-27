import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, DollarSign, Gift } from 'lucide-react';
import { SITE } from '@/content';
import { loadSupabase, getWarehouses } from '@/lib/supabase';

const MODELS = [
  'Model 1 — Trade & Warehouse Fulfilment',
  'Model 2 — Pure Procurement Service',
  'Model 3 — Import Procurement & Facilitation',
  'Model 4 — Pre-Stocked Distribution',
  'Model 5 — Consolidation & Group Shipping',
  'Model 6 — Global Product Sourcing',
];

const STATUSES = [
  { val:'pending',   label:'Pending — deposit not received' },
  { val:'ordered',   label:'Ordered — deposit received, goods being procured' },
  { val:'active',    label:'Active — goods in warehouse' },
  { val:'completed', label:'Completed — all collected' },
  { val:'cancelled', label:'Cancelled' },
];

const inp = 'w-full px-3 py-2.5 bg-[#0a1929] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm';
const lbl = 'block text-xs font-bold text-blue-300 mb-1.5 uppercase tracking-wider';

/**
 * Mode: "create" | "edit" | "convert"
 * If mode === "convert" pass sourceRequest to pre-fill from a request
 * If mode === "edit" pass deal to edit
 */
export default function DealFormModal({ open, mode='create', deal=null, sourceRequest=null, clients=[], onClose, onSaved }) {
  const [form, setForm] = useState({
    client_id: '', deal_code: '', product: '', supplier: '',
    warehouse_id: SITE.warehouses?.find(w => w.active)?.id || '',
    total_units: '', order_value_lkr: '', total_cbm: '',
    deposit_pct: SITE.m1_deposit_pct, deposit_paid: '',
    deposit_method: '', deposit_reference: '',
    handling_pct: SITE.m1_handling_pct, service_pct: SITE.m1_service_fee_pct,
    cbm_rate_lkr: '', service_model: MODELS[0],
    status: 'pending', notes: '', started_at: '',
    apply_credits: false, credit_applied: 0,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [clientCredits, setClientCredits] = useState({ total: 0 });
  const [warehouses, setWarehouses] = useState(SITE.warehouses);

  useEffect(() => {
    if (!open) return;
    getWarehouses().then(w => {
      if (w && w.length > 0) {
        setWarehouses(w);
        // Auto-select first active warehouse if form has no warehouse yet
        setForm(f => f.warehouse_id ? f : { ...f, warehouse_id: w.find(x => x.active)?.id || w[0]?.id || '' });
      }
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && deal) {
      // Load deal for editing
      setForm({
        client_id: deal.client_id || '',
        deal_code: deal.deal_code || '',
        product: deal.product || '',
        supplier: deal.supplier || '',
        warehouse_id: deal.warehouse_id || '',
        total_units: deal.total_units || '',
        order_value_lkr: deal.order_value_lkr || '',
        total_cbm: deal.total_cbm || '',
        deposit_pct: deal.deposit_pct || SITE.m1_deposit_pct,
        deposit_paid: deal.deposit_paid || 0,
        deposit_method: deal.deposit_method || '',
        deposit_reference: deal.deposit_reference || '',
        handling_pct: deal.handling_pct || SITE.m1_handling_pct,
        service_pct: deal.service_pct || SITE.m1_service_fee_pct,
        cbm_rate_lkr: deal.cbm_rate_lkr || '',
        service_model: deal.notes?.startsWith('Model') ? deal.notes.split('\n')[0] : MODELS[0],
        status: deal.status || 'pending',
        notes: deal.notes || '',
        started_at: deal.started_at ? deal.started_at.split('T')[0] : '',
        apply_credits: (deal.credit_applied||0) > 0,
        credit_applied: deal.credit_applied || 0,
      });
    } else if (mode === 'convert' && sourceRequest) {
      // Pre-fill from request and generate fresh deal code
      (async () => {
        const code = await generateDealCode();
        setForm(f => ({
          ...f,
          deal_code: code,
          client_id: sourceRequest.client_id || '',
          product: sourceRequest.product || '',
          supplier: sourceRequest.supplier || '',
          service_model: sourceRequest.model || MODELS[0],
          total_units: parseInt(sourceRequest.quantity?.replace(/\D/g,'')) || '',
          notes: `Converted from request ${sourceRequest.id}\nOriginal price: ${sourceRequest.price || 'not specified'}\n\n${sourceRequest.notes || ''}`,
        }));
      })();
    } else {
      // Fresh create
      (async () => {
        const code = await generateDealCode();
        setForm(f => ({ ...f, deal_code: code }));
      })();
    }
  }, [open, mode, deal, sourceRequest]);

  // Load client credits when client changes
  useEffect(() => {
    if (!form.client_id) { setClientCredits({ total: 0 }); return; }
    (async () => {
      const sb = await loadSupabase();
      const { data } = await sb.from('credits').select('balance').eq('client_id', form.client_id).eq('status', 'active');
      const total = (data || []).reduce((s, c) => s + (+c.balance || 0), 0);
      setClientCredits({ total });
    })();
  }, [form.client_id]);

  // Auto-update warehouse rate when warehouse changes
  useEffect(() => {
    const wh = warehouses.find(w => w.id === form.warehouse_id);
    if (wh) setForm(f => ({ ...f, cbm_rate_lkr: wh.cbm_rate }));
  }, [form.warehouse_id]);

  // Auto-calculate deposit_paid preview when order_value or deposit_pct changes
  useEffect(() => {
    if (mode === 'create' || mode === 'convert') {
      const depositDue = (+form.order_value_lkr || 0) * (+form.deposit_pct || 0) / 100;
      if (!form.deposit_paid || form.deposit_paid === 0) {
        // Don't override if user has entered something
      }
    }
  }, [form.order_value_lkr, form.deposit_pct, mode]);

  // Calculations
  const orderVal = +form.order_value_lkr || 0;
  const depPct = +form.deposit_pct || 0;
  const depositDue = orderVal * depPct / 100;
  const tycoonCapital = orderVal - depositDue;
  const handlingFee = orderVal * (+form.handling_pct || 0) / 100;
  const storageFor90 = (+form.total_cbm || 0) * (+form.cbm_rate_lkr || 0) * 90;
  const serviceFor90 = tycoonCapital * (+form.service_pct || 0) / 100 * 3;
  const maxCreditApplicable = Math.max(0, depositDue - orderVal * (SITE.m1_deposit_floor / 100));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function generateDealCode() {
    const sb = await loadSupabase();
    const year = new Date().getFullYear();
    const { data } = await sb.from('deals').select('deal_code').like('deal_code', `TS-${year}-%`).order('deal_code', { ascending: false }).limit(1);
    let nextNum = 1;
    if (data && data.length > 0) {
      const m = data[0].deal_code.match(/TS-\d{4}-(\d+)/);
      if (m) nextNum = parseInt(m[1]) + 1;
    }
    return `TS-${year}-${String(nextNum).padStart(3, '0')}`;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');

    try {
      const sb = await loadSupabase();
      const expires = form.started_at ? new Date(form.started_at) : new Date();
      expires.setDate(expires.getDate() + (SITE.m1_window_days || 90));

      const payload = {
        client_id:       form.client_id,
        deal_code:       form.deal_code,
        product:         form.product,
        supplier:        form.supplier || null,
        warehouse_id:    form.warehouse_id,
        total_units:     parseInt(form.total_units) || 0,
        order_value_lkr: parseFloat(form.order_value_lkr) || 0,
        total_cbm:       parseFloat(form.total_cbm) || 0,
        deposit_pct:       parseInt(form.deposit_pct) || 20,
        deposit_paid:      parseFloat(form.deposit_paid) || 0,
        deposit_method:    form.deposit_method || null,
        deposit_reference: form.deposit_reference || null,
        deposit_paid_at:   (parseFloat(form.deposit_paid) > 0 && !deal?.deposit_paid_at) ? new Date().toISOString() : deal?.deposit_paid_at || null,
        handling_pct:      parseFloat(form.handling_pct) || 3,
        service_pct:     parseFloat(form.service_pct) || 4,
        cbm_rate_lkr:    parseFloat(form.cbm_rate_lkr) || 140,
        credit_applied:  form.apply_credits ? parseFloat(form.credit_applied) || 0 : 0,
        status:          form.status,
        notes:           form.notes,
        started_at:      form.started_at || null,
        expires_at:      expires.toISOString(),
      };

      let savedDeal;
      if (mode === 'edit' && deal) {
        const { data, error } = await sb.from('deals').update(payload).eq('id', deal.id).select().single();
        if (error) throw error;
        savedDeal = data;

        // Send status-change email if status changed
        if (deal.status !== form.status) {
          const statusMsg = {
            pending:   `Your deal ${form.deal_code} is now pending. Please pay the deposit to activate it.`,
            ordered:   `Good news! Your deposit for ${form.deal_code} has been received. We are now procuring your goods.`,
            active:    `Your goods for ${form.deal_code} are now in our warehouse. You can start withdrawing stock anytime.`,
            completed: `Deal ${form.deal_code} is now complete. Thank you for your business!`,
            cancelled: `Deal ${form.deal_code} has been cancelled. Please contact us for details.`,
          };
          const { sendClientEmail } = await import('@/lib/supabase');
          await sendClientEmail({
            clientId: form.client_id,
            dealCode: form.deal_code, model: form.service_model, product: form.product,
            quantity: `${form.total_units} units`,
            price: `LKR ${(+form.order_value_lkr).toLocaleString()}`,
            notes: statusMsg[form.status] || `Status updated to: ${form.status}`,
          });
          await sb.from('notifications').insert({
            client_id: form.client_id, type: 'info',
            message: statusMsg[form.status] || `Deal ${form.deal_code} status changed to ${form.status}`,
          });
        }
      } else {
        const { data, error } = await sb.from('deals').insert(payload).select().single();
        if (error) throw error;
        savedDeal = data;

        // If converting from request, mark request as converted
        if (mode === 'convert' && sourceRequest) {
          await sb.from('requests').update({ status: 'converted' }).eq('id', sourceRequest.id);
        }

        // Apply credits — deduct from oldest first (FIFO)
        if (form.apply_credits && form.credit_applied > 0) {
          let remaining = parseFloat(form.credit_applied);
          const { data: credits } = await sb.from('credits').select('*').eq('client_id', form.client_id).eq('status', 'active').order('earned_at', { ascending: true });
          for (const c of credits || []) {
            if (remaining <= 0) break;
            const deduct = Math.min(+c.balance, remaining);
            const newBalance = +c.balance - deduct;
            await sb.from('credits').update({
              balance: newBalance,
              status: newBalance === 0 ? 'used' : 'active',
              used_on_deal_id: newBalance === 0 ? savedDeal.id : null,
            }).eq('id', c.id);
            remaining -= deduct;
          }
        }

        // Notify client in-portal
        await sb.from('notifications').insert({
          client_id: form.client_id,
          type: 'info',
          message: `New deal created: ${form.deal_code} — ${form.product}. Deposit due: LKR ${depositDue.toLocaleString()}.`
        });

        // Also send email notification via EmailJS
        try {
          const clientProfile = (await sb.from('profiles').select('email, full_name, company').eq('id', form.client_id).single()).data;
          if (clientProfile?.email) {
            const loadEmailJS = () => new Promise((resolve) => {
              if (window.emailjs) { window.emailjs.init(SITE.emailjs_public_key); resolve(); return; }
              const s = document.createElement('script');
              s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
              s.onload = () => { window.emailjs.init(SITE.emailjs_public_key); resolve(); };
              document.head.appendChild(s);
            });
            await loadEmailJS();
            const cashDue = depositDue - (form.apply_credits && form.credit_applied > 0 ? +form.credit_applied : 0);
            const emailParams = {
              to_email:  clientProfile.email,
              from_name: clientProfile.full_name || clientProfile.company || 'Client',
              reply_to:  SITE.email,
              deal_code: form.deal_code,
              model:     form.service_model,
              product:   form.product,
              quantity:  `${form.total_units} units`,
              price:     `LKR ${(+form.order_value_lkr).toLocaleString()}`,
              notes:     `Order value: LKR ${(+form.order_value_lkr).toLocaleString()}\nDeposit required: LKR ${depositDue.toLocaleString()} (${depPct}%)${form.apply_credits && form.credit_applied > 0 ? `\nCredits applied: LKR ${(+form.credit_applied).toLocaleString()}\nCash deposit due: LKR ${cashDue.toLocaleString()}` : ''}\n\nPlease pay the deposit to activate this deal.`,
            };
            console.log('Sending deal notification email to:', clientProfile.email, emailParams);
            const result = await window.emailjs.send(SITE.emailjs_service_id, SITE.emailjs_template_confirm, emailParams);
            console.log('EmailJS result:', result);
          } else {
            console.warn('No client email found for deal notification');
          }
        } catch (emailErr) {
          console.error('Email notification failed:', emailErr);
          /* non-critical — deal is still created */
        }
      }

      onSaved?.(savedDeal);
      onClose();
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Failed to save deal');
    }
    setBusy(false);
  };

  const title = mode === 'edit' ? `Edit Deal — ${deal?.deal_code}` : mode === 'convert' ? 'Convert Request to Deal' : 'Create New Deal';

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 bg-black/70 z-[100] flex items-start md:items-center justify-center overflow-y-auto p-3 md:p-6">
          <motion.div initial={{scale:0.95, y:20}} animate={{scale:1, y:0}} exit={{scale:0.95, y:20}}
            className="bg-[#0a1929] border border-white/10 rounded-2xl w-full max-w-4xl my-4">
            <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-[#0a1929] rounded-t-2xl z-10">
              <h2 className="text-lg md:text-xl font-black text-white">{title}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Client + Deal code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Client *</label>
                  <select required value={form.client_id} onChange={e => set('client_id', e.target.value)} className={inp + ' cursor-pointer'} disabled={mode === 'edit'}>
                    <option value="">Select a client...</option>
                    {clients.filter(c => !c.is_admin).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.company || c.full_name || c.email} {c.status !== 'verified' && '(not verified)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Deal code</label>
                  <input type="text" value={form.deal_code} onChange={e => set('deal_code', e.target.value)} className={inp} readOnly={mode === 'edit'} />
                </div>
              </div>

              {/* Service model + Warehouse */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Service model *</label>
                  <select value={form.service_model} onChange={e => set('service_model', e.target.value)} className={inp + ' cursor-pointer'}>
                    {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Warehouse *</label>
                  <select required value={form.warehouse_id} onChange={e => set('warehouse_id', e.target.value)} className={inp + ' cursor-pointer'}>
                    {warehouses.filter(w => w.active).map(w => (
                      <option key={w.id} value={w.id}>{w.name} — LKR {w.cbm_rate}/CBM/day</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product + Supplier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Product *</label>
                  <input type="text" required value={form.product} onChange={e => set('product', e.target.value)} placeholder="e.g. Cotton T-shirts, 100gsm" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Supplier</label>
                  <input type="text" value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Optional" className={inp} />
                </div>
              </div>

              {/* Order details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>Order value (LKR) *</label>
                  <input type="number" required min="1" value={form.order_value_lkr} onChange={e => set('order_value_lkr', e.target.value)} placeholder="500000" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Total units *</label>
                  <input type="number" required min="1" value={form.total_units} onChange={e => set('total_units', e.target.value)} placeholder="1000" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Total CBM *</label>
                  <input type="number" required min="0.1" step="0.1" value={form.total_cbm} onChange={e => set('total_cbm', e.target.value)} placeholder="1.0" className={inp} />
                </div>
              </div>

              {/* Fees */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-white/3 border border-white/10 rounded-xl">
                <div>
                  <label className={lbl}>Deposit %</label>
                  <input type="number" min={SITE.m1_deposit_floor} max="100" value={form.deposit_pct} onChange={e => set('deposit_pct', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Handling %</label>
                  <input type="number" step="0.1" value={form.handling_pct} onChange={e => set('handling_pct', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Service %/mo</label>
                  <input type="number" step="0.1" value={form.service_pct} onChange={e => set('service_pct', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Storage/CBM</label>
                  <input type="number" value={form.cbm_rate_lkr} onChange={e => set('cbm_rate_lkr', e.target.value)} className={inp} />
                </div>
              </div>

              {/* Client credits */}
              {clientCredits.total > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Gift size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-green-300">Client has LKR {clientCredits.total.toLocaleString()} in active credits</div>
                      <div className="text-xs text-green-200 mb-2">Max applicable on this deal: LKR {maxCreditApplicable.toLocaleString()} (floor: {SITE.m1_deposit_floor}% cash required)</div>
                      <label className="flex items-center gap-2 cursor-pointer mt-1">
                        <input type="checkbox" checked={form.apply_credits} onChange={e => set('apply_credits', e.target.checked)} className="w-4 h-4 accent-green-500" />
                        <span className="text-sm font-semibold text-green-200">Apply credits on deposit</span>
                      </label>
                      {form.apply_credits && (
                        <input type="number" min="0" max={Math.min(clientCredits.total, maxCreditApplicable)} step="1000"
                          value={form.credit_applied} onChange={e => set('credit_applied', Math.min(clientCredits.total, maxCreditApplicable, +e.target.value))}
                          placeholder={`0 — ${Math.min(clientCredits.total, maxCreditApplicable).toLocaleString()}`}
                          className={inp + ' mt-2'} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Deposit paid + status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Deposit paid (LKR)</label>
                  <input type="number" min="0" value={form.deposit_paid} onChange={e => set('deposit_paid', e.target.value)} placeholder={`Default: ${depositDue.toLocaleString()}`} className={inp} />
                  <p className="text-[10px] text-slate-500 mt-1">Required: LKR {depositDue.toLocaleString()} ({depPct}%)</p>
                </div>
                <div>
                  <label className={lbl}>Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className={inp + ' cursor-pointer'}>
                    {STATUSES.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
                  </select>
                </div>
                {(+form.deposit_paid) > 0 && (
                  <>
                    <div>
                      <label className={lbl}>Payment method</label>
                      <select value={form.deposit_method} onChange={e => set('deposit_method', e.target.value)} className={inp + ' cursor-pointer'}>
                        <option value="">— Select —</option>
                        <option value="bank_transfer">Bank transfer</option>
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                        <option value="online">Online / Card</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Payment reference</label>
                      <input type="text" value={form.deposit_reference} onChange={e => set('deposit_reference', e.target.value)} placeholder="Transaction ID / cheque no." className={inp} />
                    </div>
                  </>
                )}
              </div>

              {/* Start date */}
              <div>
                <label className={lbl}>Start date (90-day window begins)</label>
                <input type="date" value={form.started_at} onChange={e => set('started_at', e.target.value)} className={inp} />
                <p className="text-[10px] text-slate-500 mt-1">Leave blank to use today. Expiry auto-set to 90 days after start.</p>
              </div>

              {/* Notes */}
              <div>
                <label className={lbl}>Internal notes</label>
                <textarea rows="3" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any internal memo about this deal..." className={inp + ' resize-none'} />
              </div>

              {/* Preview */}
              {orderVal > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="text-xs font-black text-blue-300 uppercase tracking-widest mb-3">Calculation preview</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white/5 rounded-lg p-2"><div className="text-slate-400 text-[10px]">Deposit required</div><div className="text-white font-bold">LKR {depositDue.toLocaleString()}</div></div>
                    <div className="bg-white/5 rounded-lg p-2"><div className="text-slate-400 text-[10px]">Tycoon capital (80%)</div><div className="text-white font-bold">LKR {tycoonCapital.toLocaleString()}</div></div>
                    <div className="bg-white/5 rounded-lg p-2"><div className="text-slate-400 text-[10px]">Handling fee</div><div className="text-white font-bold">LKR {handlingFee.toLocaleString()}</div></div>
                    <div className="bg-white/5 rounded-lg p-2"><div className="text-slate-400 text-[10px]">Storage @ 90d</div><div className="text-white font-bold">LKR {storageFor90.toLocaleString()}</div></div>
                    <div className="bg-white/5 rounded-lg p-2"><div className="text-slate-400 text-[10px]">Service @ 90d</div><div className="text-white font-bold">LKR {serviceFor90.toLocaleString()}</div></div>
                    <div className="bg-white/5 rounded-lg p-2"><div className="text-slate-400 text-[10px]">Max total (90d)</div><div className="text-white font-bold">LKR {(orderVal + handlingFee + storageFor90 + serviceFor90).toLocaleString()}</div></div>
                    <div className="bg-white/5 rounded-lg p-2"><div className="text-slate-400 text-[10px]">Unit price (base)</div><div className="text-white font-bold">LKR {form.total_units > 0 ? (orderVal / form.total_units).toFixed(2) : 0}/u</div></div>
                    <div className="bg-white/5 rounded-lg p-2"><div className="text-slate-400 text-[10px]">Fees vs base</div><div className="text-white font-bold">{orderVal > 0 ? (((handlingFee + storageFor90 + serviceFor90) / orderVal) * 100).toFixed(2) : 0}%</div></div>
                  </div>
                </div>
              )}

              {err && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">{err}</div>}

              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-white/10">
                <button type="submit" disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-lg">
                  {busy ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> {mode === 'edit' ? 'Save changes' : 'Create Deal'}</>}
                </button>
                <button type="button" onClick={onClose} className="flex-1 py-3 border border-white/20 text-white hover:bg-white/5 rounded-lg font-semibold">Cancel</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
