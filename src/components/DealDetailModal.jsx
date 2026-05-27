import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BatchActionModal from '@/components/BatchActionModal'; // PHASE 3.4
import AdminPaymentVerificationModal from '@/components/AdminPaymentVerificationModal'; // PHASE 5
import PaymentProofModal from '@/components/PaymentProofModal'; // ✅ IMPORT FOR UPLOAD
import { X, Package, Plus, Edit2, Trash2, FileText, DollarSign, Calendar, Gift, CheckCircle, Printer, Download, Upload } from 'lucide-react';
import { SITE } from '@/content';
import { loadSupabase, getWarehouses } from '@/lib/supabase';
import BatchFormModal from '@/components/BatchFormModal';
import { sendBatchReadyEmail } from '@/lib/emailService'; // ✅ ADD EMAIL

const STATUS = {
  active:    { label:'Active',    color:'text-blue-400',  bg:'bg-blue-500/20 border-blue-500/40' },
  pending:   { label:'Pending',   color:'text-amber-400', bg:'bg-amber-500/20 border-amber-500/40' },
  ordered:   { label:'Ordered',   color:'text-amber-400', bg:'bg-amber-500/20 border-amber-500/40' },
  completed: { label:'Completed', color:'text-green-400', bg:'bg-green-500/20 border-green-500/40' },
  cancelled: { label:'Cancelled', color:'text-slate-400', bg:'bg-slate-500/20 border-slate-500/40' },
  paid:      { label:'Paid',      color:'text-green-400', bg:'bg-green-500/20 border-green-500/40' },
  released:  { label:'Released',  color:'text-blue-400',  bg:'bg-blue-500/20 border-blue-500/40' },
  unpaid:    { label:'Unpaid',    color:'text-amber-400', bg:'bg-amber-500/20 border-amber-500/40' },
};

export default function DealDetailModal({ open, deal, isAdmin=false, withdrawForm=null, onClose, onUpdate }) {
  const [fullDeal, setFullDeal] = useState(null);
  const [batches, setBatches] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchActionModal, setBatchActionModal] = useState({ open: false, batch: null, action: null });
  const [paymentVerificationModal, setPaymentVerificationModal] = useState({ open: false, proof: null }); // PHASE 5
  const [paymentProofs, setPaymentProofs] = useState([]); // PHASE 5
  const [batchModal, setBatchModal] = useState({ open:false, batch:null, mode:'create' });
  const [warehouses, setWarehouses] = useState(SITE.warehouses || []);
  const [paymentProofModal, setPaymentProofModal] = useState({ open: false, batch: null, invoice: null }); // ✅ FOR UPLOAD

  useEffect(() => {
    if (!open || !deal) return;
    loadDealData();
    getWarehouses().then(w => { if (w && w.length > 0) setWarehouses(w); });
    
    // PHASE 3.3 FIX: Real-time subscription to batches (UPDATED SYNTAX)
    (async () => {
      try {
        const sb = await loadSupabase();
        const channel = sb.channel('batches-' + deal.id);
        
        channel
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'batches',
              filter: `deal_id=eq.${deal.id}`
            },
            (payload) => {
              console.log('New batch created:', payload.new);
              loadDealData();
            }
          )
          .subscribe(); // subscribe() must be called AFTER on()
        
        return () => channel.unsubscribe();
      } catch (e) {
        console.error('Subscription error:', e);
      }
    })();
  }, [open, deal?.id]);

  const loadDealData = async () => {
    if (!deal) return;
    setLoading(true);
    try {
      const sb = await loadSupabase();
      const [d, b, i] = await Promise.all([
        sb.from('deals').select('*, profiles(full_name, company, email, phone)').eq('id', deal.id).single(),
        sb.from('batches').select('*').eq('deal_id', deal.id).order('batch_num'),
        sb.from('invoices').select('*').eq('deal_id', deal.id).order('issued_at', { ascending: false }),
      ]);
      
      setFullDeal(d.data || deal);
      setBatches(b.data || []);
      setInvoices(i.data || []);
      
      // PHASE 5 FIX: Load payment proofs for all batches in this deal
      if (b.data && b.data.length > 0) {
        const batchIds = b.data.map(batch => batch.id);
        
        const { data: proofData, error: proofError } = await sb
          .from('payment_proofs')
          .select('*')
          .in('batch_id', batchIds);
        
        if (proofError) {
          console.error('❌ Proof load error:', proofError);
        }
        
        setPaymentProofs(proofData || []);
      } else {
        setPaymentProofs([]);
      }
    } catch (e) { 
      console.error('Load failed:', e); 
    }
    setLoading(false);
  };

  const deleteBatch = async (batchId) => {
    if (!confirm('Delete this batch? This cannot be undone.')) return;
    const sb = await loadSupabase();
    await sb.from('batches').delete().eq('id', batchId);
    // Recalculate collected_units
    const { data: allBatches } = await sb.from('batches').select('units').eq('deal_id', deal.id);
    const totalCollected = (allBatches || []).reduce((s, b) => s + (+b.units || 0), 0);
    await sb.from('deals').update({ collected_units: totalCollected }).eq('id', deal.id);
    loadDealData();
    onUpdate?.();
  };

  const d = fullDeal || deal || {};
  const s = STATUS[d.status] || STATUS.pending;
  const pct = Math.round(((d.collected_units||0)/(d.total_units||1))*100);

  // Financial summary
  const totalPaid = batches.filter(b => b.status === 'paid' || b.status === 'released').reduce((s, b) => s + (+b.amount_lkr || 0), 0);
  const totalBatchAmount = batches.reduce((s, b) => s + (+b.amount_lkr || 0), 0);
  const depositPaid = +d.deposit_paid || 0;
  const depositDue = (+d.order_value_lkr || 0) * (+d.deposit_pct || 20) / 100;
  const outstanding = Math.max(0, (+d.order_value_lkr || 0) - depositPaid - totalPaid);

  const fmt = v => `LKR ${(+v || 0).toLocaleString('en', { minimumFractionDigits:0, maximumFractionDigits:0 })}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 bg-black/70 z-[105] flex items-start md:items-center justify-center overflow-y-auto p-3 md:p-6">
          <motion.div initial={{scale:0.95, y:20}} animate={{scale:1, y:0}} exit={{scale:0.95, y:20}}
            className={`border border-white/10 rounded-2xl w-full ${isAdmin ? 'max-w-7xl' : 'max-w-5xl'} my-4 max-h-[90vh] overflow-y-auto ${isAdmin ? 'bg-[#0a1929]' : 'bg-white'}`}>
            {/* Header - Scrolls naturally with content */}
            <div className={`flex items-center justify-between p-5 border-b rounded-t-2xl ${isAdmin ? 'bg-[#0a1929] border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className={`text-lg md:text-xl font-black ${isAdmin ? 'text-white' : 'text-[#0a2342]'}`}>{d.deal_code}</h2>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>{s.label}</span>
                </div>
                <p className={`text-sm ${isAdmin ? 'text-slate-400' : 'text-slate-500'}`}>
                  {d.product} {isAdmin && d.profiles && `· ${d.profiles.company || d.profiles.full_name}`}
                </p>
              </div>
              <button onClick={onClose} className={`p-1 ${isAdmin ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}><X size={20} /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {[
                  { l:'Order value', v:fmt(d.order_value_lkr), color:'text-blue-500' },
                  { l:'Deposit paid', v:fmt(depositPaid), color:'text-amber-500' },
                  { l:'Total collected', v:fmt(totalPaid), color:'text-green-500' },
                  { l:'Outstanding', v:fmt(outstanding), color:'text-red-500' },
                ].map(c => (
                  <div key={c.l} className={`rounded-lg p-2 ${isAdmin ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'}`}>
                    <div className={`text-[10px] uppercase tracking-wide mb-1 font-semibold ${isAdmin ? 'text-slate-400' : 'text-slate-400'}`}>{c.l}</div>
                    <div className={`text-sm md:text-base font-black ${c.color}`}>{c.v}</div>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div>
                <div className={`flex justify-between mb-2 text-xs ${isAdmin ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>Collection Progress</span>
                  <span className="font-bold">{d.collected_units || 0} / {d.total_units || 0} units ({pct}%)</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isAdmin ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <div className="h-full bg-blue-600 transition-all" style={{width:`${pct}%`}} />
                </div>
              </div>

              {/* Fee breakdown */}
              <div className={`rounded-lg p-2.5 border ${isAdmin ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${isAdmin ? 'text-blue-400' : 'text-blue-700'}`}>Deal Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                  <div><span className={isAdmin ? 'text-slate-500' : 'text-slate-400'}>Units:</span> <span className={`font-semibold ${isAdmin ? 'text-white' : 'text-slate-800'}`}>{d.total_units?.toLocaleString()}</span></div>
                  <div><span className={isAdmin ? 'text-slate-500' : 'text-slate-400'}>CBM:</span> <span className={`font-semibold ${isAdmin ? 'text-white' : 'text-slate-800'}`}>{(+d.total_cbm || 0).toFixed(2)}</span></div>
                  <div><span className={isAdmin ? 'text-slate-500' : 'text-slate-400'}>Handling:</span> <span className={`font-semibold ${isAdmin ? 'text-white' : 'text-slate-800'}`}>{d.handling_pct || 3}%</span></div>
                  <div><span className={isAdmin ? 'text-slate-500' : 'text-slate-400'}>Service:</span> <span className={`font-semibold ${isAdmin ? 'text-white' : 'text-slate-800'}`}>{d.service_pct || 4}%/mo</span></div>
                  <div><span className={isAdmin ? 'text-slate-500' : 'text-slate-400'}>Warehouse:</span> <span className={`font-semibold ${isAdmin ? 'text-white' : 'text-slate-800'}`}>{warehouses.find(w => w.id === d.warehouse_id)?.name || d.warehouse_id}</span></div>
                  <div><span className={isAdmin ? 'text-slate-500' : 'text-slate-400'}>Storage:</span> <span className={`font-semibold ${isAdmin ? 'text-white' : 'text-slate-800'}`}>{fmt(d.cbm_rate_lkr)}/CBM/day</span></div>
                  <div><span className={isAdmin ? 'text-slate-500' : 'text-slate-400'}>Started:</span> <span className={`font-semibold ${isAdmin ? 'text-white' : 'text-slate-800'}`}>{d.started_at ? new Date(d.started_at).toLocaleDateString() : '—'}</span></div>
                  <div><span className={isAdmin ? 'text-slate-500' : 'text-slate-400'}>Expires:</span> <span className={`font-semibold ${isAdmin ? 'text-white' : 'text-slate-800'}`}>{d.expires_at ? new Date(d.expires_at).toLocaleDateString() : '—'}</span></div>
                </div>
                {(+d.credit_applied || 0) > 0 && (
                  <div className={`mt-3 pt-3 border-t flex items-center gap-2 text-xs font-semibold ${isAdmin ? 'border-white/10 text-green-400' : 'border-slate-200 text-green-700'}`}>
                    <Gift size={12} /> {fmt(d.credit_applied)} credit applied on this deal
                  </div>
                )}
              </div>

              {/* UNIT RATES — per-unit breakdown */}
              {d.total_units > 0 && (() => {
                const basePerUnit    = (+d.order_value_lkr || 0) / (+d.total_units || 1);
                const handlingPerUnit = basePerUnit * ((+d.handling_pct || 3) / 100);
                const cbmPerUnit     = (+d.total_cbm || 0) / (+d.total_units || 1);
                const storagePerUnitDay = cbmPerUnit * (+d.cbm_rate_lkr || 140);
                const tycoonCap      = (+d.order_value_lkr || 0) * (1 - (+d.deposit_pct || 20)/100);
                const servicePerDay  = tycoonCap * ((+d.service_pct || 4)/100) / 30;
                const servicePerUnitDay = servicePerDay / (+d.total_units || 1);

                // Performance metrics
                const totalFeesPaid  = batches.reduce((s, b) => s + ((+b.handling_fee||0) + (+b.storage_fee||0) + (+b.service_fee||0)), 0);
                const totalPaidCombined = batches.reduce((s, b) => s + (+b.amount_lkr || 0), 0);
                const collectedUnits = batches.reduce((s, b) => s + (+b.units || 0), 0);
                const effectiveUnitPrice = collectedUnits > 0 ? (totalPaidCombined / collectedUnits) : 0;

                // Day-90 hypothetical (if all held to day 90)
                const day90Storage = (+d.total_cbm || 0) * (+d.cbm_rate_lkr || 140) * 90;
                const day90Service = tycoonCap * ((+d.service_pct || 4) / 100) * 3; // 3 months
                const day90Handling = (+d.order_value_lkr || 0) * ((+d.handling_pct || 3) / 100);
                const day90Total = (+d.order_value_lkr || 0) + day90Handling + day90Storage + day90Service;

                const savings = Math.max(0, day90Total - totalPaidCombined);
                const costPremium = (+d.order_value_lkr || 0) > 0 ? ((totalFeesPaid / (+d.order_value_lkr || 0)) * 100) : 0;

                return (
                  <div className={`rounded-lg p-2.5 border ${isAdmin ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${isAdmin ? 'text-blue-400' : 'text-blue-700'}`}>Unit Rates (LKR)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                      <div className={`rounded-lg p-3 ${isAdmin ? 'bg-[#0a1929]' : 'bg-white border border-slate-200'}`}>
                        <div className={`text-[10px] uppercase tracking-wide font-semibold mb-1 ${isAdmin ? 'text-slate-400' : 'text-slate-400'}`}>Base / unit</div>
                        <div className={`text-sm font-bold ${isAdmin ? 'text-white' : 'text-blue-800'}`}>LKR {basePerUnit.toFixed(2)}</div>
                      </div>
                      <div className={`rounded-lg p-3 ${isAdmin ? 'bg-[#0a1929]' : 'bg-white border border-slate-200'}`}>
                        <div className={`text-[10px] uppercase tracking-wide font-semibold mb-1 ${isAdmin ? 'text-slate-400' : 'text-slate-400'}`}>Handling / unit</div>
                        <div className={`text-sm font-bold ${isAdmin ? 'text-white' : 'text-blue-800'}`}>LKR {handlingPerUnit.toFixed(2)}</div>
                      </div>
                      <div className={`rounded-lg p-3 ${isAdmin ? 'bg-[#0a1929]' : 'bg-white border border-slate-200'}`}>
                        <div className={`text-[10px] uppercase tracking-wide font-semibold mb-1 ${isAdmin ? 'text-slate-400' : 'text-slate-400'}`}>Storage / unit / day</div>
                        <div className={`text-sm font-bold ${isAdmin ? 'text-cyan-400' : 'text-cyan-700'}`}>LKR {storagePerUnitDay.toFixed(4)}</div>
                      </div>
                      <div className={`rounded-lg p-3 ${isAdmin ? 'bg-[#0a1929]' : 'bg-white border border-slate-200'}`}>
                        <div className={`text-[10px] uppercase tracking-wide font-semibold mb-1 ${isAdmin ? 'text-slate-400' : 'text-slate-400'}`}>Service / unit / day</div>
                        <div className={`text-sm font-bold ${isAdmin ? 'text-cyan-400' : 'text-cyan-700'}`}>LKR {servicePerUnitDay.toFixed(4)}</div>
                      </div>
                    </div>
                    <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${isAdmin ? 'text-blue-400' : 'text-blue-700'}`}>Performance</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      <div className={`rounded-lg p-3 ${isAdmin ? 'bg-[#0a1929]' : 'bg-white border border-slate-200'}`}>
                        <div className={`text-[10px] uppercase tracking-wide font-semibold mb-1 ${isAdmin ? 'text-slate-400' : 'text-slate-400'}`}>Effective unit price</div>
                        <div className={`text-sm font-bold ${isAdmin ? 'text-white' : 'text-[#0a2342]'}`}>{effectiveUnitPrice > 0 ? `LKR ${effectiveUnitPrice.toFixed(2)}` : '—'}</div>
                      </div>
                      <div className={`rounded-lg p-3 ${isAdmin ? 'bg-[#0a1929]' : 'bg-white border border-slate-200'}`}>
                        <div className={`text-[10px] uppercase tracking-wide font-semibold mb-1 ${isAdmin ? 'text-slate-400' : 'text-slate-400'}`}>Fees paid</div>
                        <div className={`text-sm font-bold ${isAdmin ? 'text-red-400' : 'text-red-600'}`}>{fmt(totalFeesPaid)}</div>
                      </div>
                      <div className={`rounded-lg p-3 ${isAdmin ? 'bg-[#0a1929]' : 'bg-white border border-slate-200'}`}>
                        <div className={`text-[10px] uppercase tracking-wide font-semibold mb-1 ${isAdmin ? 'text-slate-400' : 'text-slate-400'}`}>Cost premium</div>
                        <div className={`text-sm font-bold ${isAdmin ? 'text-red-400' : 'text-red-600'}`}>{costPremium.toFixed(2)}%</div>
                      </div>
                      <div className={`rounded-lg p-3 ${isAdmin ? 'bg-[#0a1929]' : 'bg-white border border-slate-200'}`}>
                        <div className={`text-[10px] uppercase tracking-wide font-semibold mb-1 ${isAdmin ? 'text-slate-400' : 'text-slate-400'}`}>Savings vs day-90</div>
                        <div className={`text-sm font-bold ${isAdmin ? 'text-green-400' : 'text-green-600'}`}>{fmt(savings)}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Batches section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-xs font-black uppercase tracking-widest ${isAdmin ? 'text-blue-400' : 'text-blue-700'}`}>Pickup Batches ({batches.length})</h3>
                  {isAdmin && d.status !== 'completed' && d.status !== 'cancelled' && (
                    <button onClick={() => setBatchModal({ open:true, batch:null, mode:'create' })}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg">
                      <Plus size={12} /> Add Batch
                    </button>
                  )}
                </div>
                {batches.length === 0 ? (
                  <div className={`text-center py-8 text-sm rounded-xl border border-dashed ${isAdmin ? 'text-slate-500 border-white/10' : 'text-slate-400 border-slate-200'}`}>
                    No batches recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[900px]">
                      <thead>
                        <tr className={isAdmin ? 'border-b border-white/10 text-slate-400' : 'border-b border-slate-200 text-slate-500'}>
                          <th className="text-left py-2 px-2 font-semibold">#</th>
                          <th className="text-left py-2 px-2 font-semibold">Date</th>
                          <th className="text-right py-2 px-2 font-semibold">Days</th>
                          <th className="text-right py-2 px-2 font-semibold">Units</th>
                          <th className="text-right py-2 px-2 font-semibold">CBM</th>
                          <th className="text-right py-2 px-2 font-semibold">Base</th>
                          <th className="text-right py-2 px-2 font-semibold">Handling</th>
                          <th className="text-right py-2 px-2 font-semibold">Storage</th>
                          <th className="text-right py-2 px-2 font-semibold">Service</th>
                          <th className="text-right py-2 px-2 font-semibold">Total</th>
                          <th className="text-center py-2 px-2 font-semibold">Status</th>
                          {isAdmin && <th className="text-right py-2 px-2 font-semibold">Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {batches.map(b => {
                          const bs = STATUS[b.status] || STATUS.pending;
                          // Calculate breakdown on the fly if DB doesn't have it
                          const unitRatio = (+b.units || 0) / (+d.total_units || 1);
                          const baseCost = (+b.base_cost) || (unitRatio * (+d.order_value_lkr || 0));
                          const handlingFee = (+b.handling_fee) || (baseCost * ((+d.handling_pct || 3) / 100));
                          const startDate = d.started_at ? new Date(d.started_at) : new Date(d.created_at);
                          const collectDate = b.collected_at ? new Date(b.collected_at) : new Date();
                          const daysHeld = Math.max(1, Math.ceil((collectDate - startDate) / (1000*60*60*24)));
                          const storageFee = (+b.storage_fee) || ((+b.cbm_collected || 0) * (+d.cbm_rate_lkr || 140) * daysHeld);
                          const tycoonCap = (+d.order_value_lkr || 0) * (1 - (+d.deposit_pct || 20) / 100);
                          const serviceFee = (+b.service_fee) || (tycoonCap * ((+d.service_pct || 4) / 100) / 30 * daysHeld * unitRatio);
                          return (
                            <tr key={b.id} className={isAdmin ? 'border-b border-white/5 hover:bg-white/2' : 'border-b border-slate-100 hover:bg-slate-50'}>
                              <td className={`py-2.5 px-2 font-bold ${isAdmin ? 'text-white' : 'text-[#0a2342]'}`}>{b.batch_num}</td>
                              <td className={`py-2.5 px-2 ${isAdmin ? 'text-slate-300' : 'text-slate-600'}`}>{b.pickup_date ? new Date(b.pickup_date).toLocaleDateString() : '—'}</td>
                              <td className={`py-2.5 px-2 text-right ${isAdmin ? 'text-slate-400' : 'text-slate-500'}`}>{daysHeld}</td>
                              <td className={`py-2.5 px-2 text-right font-semibold ${isAdmin ? 'text-white' : 'text-slate-700'}`}>{(+b.units || 0).toLocaleString()}</td>
                              <td className={`py-2.5 px-2 text-right ${isAdmin ? 'text-slate-300' : 'text-slate-600'}`}>{(+b.cbm_collected || 0).toFixed(3)}</td>
                              <td className={`py-2.5 px-2 text-right ${isAdmin ? 'text-slate-300' : 'text-slate-700'}`}>{fmt(baseCost)}</td>
                              <td className={`py-2.5 px-2 text-right ${isAdmin ? 'text-slate-300' : 'text-slate-700'}`}>{fmt(handlingFee)}</td>
                              <td className={`py-2.5 px-2 text-right ${isAdmin ? 'text-cyan-400' : 'text-cyan-700'}`}>{fmt(storageFee)}</td>
                              <td className={`py-2.5 px-2 text-right ${isAdmin ? 'text-cyan-400' : 'text-cyan-700'}`}>{fmt(serviceFee)}</td>
                              <td className={`py-2.5 px-2 text-right font-bold ${isAdmin ? 'text-white' : 'text-[#0a2342]'}`}>{fmt(b.amount_lkr)}</td>
                              <td className="py-2.5 px-2 text-center">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${bs.bg} ${bs.color}`}>{bs.label}</span>
                              </td>
                              {isAdmin && (
                <td className="py-2.5 px-2 text-right space-x-1 flex items-center justify-end gap-1">
                  {b.status === 'pending' && (
                    <>
                      {/* PHASE 5: Review Payment button */}
                      <button onClick={() => {
                        const proofBatchIds = paymentProofs?.map(p => p.batch_id) || [];
                        const proof = paymentProofs?.find(p => p.batch_id === b.id);
                        
                        if (proof && proof.id) {
                          setPaymentVerificationModal({ open: true, proof });
                        } else {
                          alert('Client has not uploaded payment proof yet');
                        }
                      }}
                        className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded">
                        Review Payment
                      </button>
                      <button onClick={() => setBatchActionModal({ open: true, batch: b, action: 'approve' })}
                        className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded">
                        Approve
                      </button>
                      <button onClick={() => setBatchActionModal({ open: true, batch: b, action: 'reject' })}
                        className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded">
                        Reject
                      </button>
                    </>
                  )}
                  {b.status === 'paid' && (
                    <button onClick={() => setBatchActionModal({ open: true, batch: b, action: 'collect' })}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded">
                      Collect & Release
                    </button>
                  )}
                  <button onClick={() => setBatchActionModal({ open: true, batch: b, action: 'edit' })}
                    className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded">
                    Edit
                  </button>
                  {b.status === 'pending' && (
                    <button onClick={() => setBatchActionModal({ open: true, batch: b, action: 'delete' })}
                      className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded">
                      Delete
                    </button>
                  )}
                </td>
              )}
                              {isAdmin && (
                                <td className="py-2.5 px-2 text-right">
                                  <div className="flex items-center gap-1 justify-end">
                                    <button onClick={() => setBatchModal({ open:true, batch:b, mode:'edit' })} className="text-blue-400 hover:text-blue-300"><Edit2 size={11} /></button>
                                    <button onClick={() => deleteBatch(b.id)} className="text-red-400 hover:text-red-300"><Trash2 size={11} /></button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Invoices section */}
              {invoices.length > 0 && (
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${isAdmin ? 'text-blue-400' : 'text-blue-700'}`}>Invoices ({invoices.length})</h3>
                  <div className="space-y-2">
                    {invoices.map(inv => {
                      const is = STATUS[inv.status] || STATUS.unpaid;
                      return (
                        <div key={inv.id} className={`flex items-center justify-between p-3 rounded-lg ${isAdmin ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText size={16} className={isAdmin ? 'text-blue-400' : 'text-blue-700'} />
                            <div className="min-w-0">
                              <div className={`text-sm font-bold truncate ${isAdmin ? 'text-white' : 'text-[#0a2342]'}`}>{inv.invoice_num}</div>
                              <div className={`text-[10px] ${isAdmin ? 'text-slate-400' : 'text-slate-500'}`}>{inv.type} · {new Date(inv.issued_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`text-sm font-black ${isAdmin ? 'text-white' : 'text-[#0a2342]'}`}>{fmt(inv.amount)}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${is.bg} ${is.color}`}>{is.label}</span>
                            <button onClick={() => printInvoice(inv, d, batches.find(b => b.id === inv.batch_id), warehouses)} className={`text-xs flex items-center gap-1 ${isAdmin ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-900'}`}>
                              <Printer size={11} /> Print
                            </button>
                            
                            {/* ✅ UPLOAD PROOF BUTTON FOR UNPAID INVOICES */}
                            {!isAdmin && inv.status === 'unpaid' && (
                              <button 
                                onClick={() => {
                                  const batch = batches.find(b => b.id === inv.batch_id);
                                  setPaymentProofModal({ open: true, batch, invoice: inv });
                                }}
                                className="text-xs flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-all"
                              >
                                <Upload size={12} /> Upload Proof
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {d.notes && (
                <div className={`p-3 rounded-lg ${isAdmin ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isAdmin ? 'text-blue-400' : 'text-blue-700'}`}>Notes</div>
                  <div className={`text-xs whitespace-pre-wrap ${isAdmin ? 'text-slate-300' : 'text-slate-700'}`}>{d.notes}</div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Batch form modal */}
          <BatchFormModal
            open={batchModal.open}
            deal={d}
            batch={batchModal.batch}
            mode={batchModal.mode}
            onClose={() => setBatchModal({ open:false, batch:null, mode:'create' })}
            onSaved={() => { loadDealData(); onUpdate?.(); }}
          />

          {/* PHASE 3.4: Batch action modal */}
          <BatchActionModal
            open={batchActionModal.open}
            batch={batchActionModal.batch}
            deal={fullDeal}
            action={batchActionModal.action}
            onClose={() => setBatchActionModal({ open: false, batch: null, action: null })}
            onSuccess={() => { loadDealData(); onUpdate?.(); }}
          />

          {/* PHASE 5: Admin payment verification modal */}
          <AdminPaymentVerificationModal
            open={paymentVerificationModal.open}
            paymentProof={paymentVerificationModal.proof}
            batch={paymentVerificationModal.proof ? batches.find(b => b.id === paymentVerificationModal.proof.batch_id) : null}
            invoice={paymentVerificationModal.proof ? (invoices.find(i => i.batch_id === paymentVerificationModal.proof.batch_id) || invoices.find(i => i.id === paymentVerificationModal.proof.batch_id)) : null}
            onClose={() => setPaymentVerificationModal({ open: false, proof: null })}
            onSuccess={() => { loadDealData(); onUpdate?.(); }}
          />

          {/* ✅ PAYMENT PROOF UPLOAD MODAL */}
          <PaymentProofModal
            open={paymentProofModal.open}
            batch={paymentProofModal.batch}
            invoice={paymentProofModal.invoice}
            onClose={() => setPaymentProofModal({ open: false, batch: null, invoice: null })}
            onSuccess={() => { loadDealData(); onUpdate?.(); }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Generate and print invoice using browser print-to-PDF
function printInvoice(invoice, deal, batch=null, warehouses=null) {
  const whList = warehouses && warehouses.length > 0 ? warehouses : (SITE.warehouses || []);
  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to print the invoice.'); return; }

  // Calculate line items for batch invoices from line_items JSONB or from batch data
  const li = invoice.line_items || {};
  const isBatch = invoice.type === 'batch';

  let lineItems = [];
  if (isBatch && batch) {
    const unitRatio = (+batch.units || 0) / (+deal.total_units || 1);
    const baseCost = (+batch.base_cost) || (unitRatio * (+deal.order_value_lkr || 0));
    const handlingFee = (+batch.handling_fee) || (baseCost * ((+deal.handling_pct || 3) / 100));
    const startDate = deal.started_at ? new Date(deal.started_at) : new Date(deal.created_at);
    const collectDate = batch.collected_at ? new Date(batch.collected_at) : new Date();
    const daysHeld = Math.max(1, Math.ceil((collectDate - startDate) / (1000*60*60*24)));
    const storageFee = (+batch.storage_fee) || ((+batch.cbm_collected || 0) * (+deal.cbm_rate_lkr || 140) * daysHeld);
    const tycoonCap = (+deal.order_value_lkr || 0) * (1 - (+deal.deposit_pct || 20) / 100);
    const serviceFee = (+batch.service_fee) || (tycoonCap * ((+deal.service_pct || 4) / 100) / 30 * daysHeld * unitRatio);

    lineItems = [
      { desc: `Base goods cost — ${(+batch.units || 0).toLocaleString()} units × LKR ${((+deal.order_value_lkr || 0) / (+deal.total_units || 1)).toFixed(2)}`, amt: baseCost },
      { desc: `Handling fee — ${deal.handling_pct || 3}% of base`, amt: handlingFee },
      { desc: `Storage fee — ${(+batch.cbm_collected || 0).toFixed(3)} CBM × LKR ${(+deal.cbm_rate_lkr || 140)}/day × ${daysHeld} days`, amt: storageFee },
      { desc: `Service fee — ${deal.service_pct || 4}%/mo on LKR ${tycoonCap.toLocaleString()} capital × ${daysHeld} days`, amt: serviceFee },
    ];
  } else {
    lineItems = [
      { desc: invoice.notes || invoice.type + ' invoice', amt: +invoice.amount },
    ];
  }

  const total = lineItems.reduce((s, li) => s + (+li.amt || 0), 0);

  const html = `<!DOCTYPE html><html><head>
    <title>${invoice.invoice_num} — Tycoon Sourcing</title>
    <style>
      @page { size:A4; margin:18mm; }
      body { font-family: -apple-system, system-ui, sans-serif; color:#0a2342; line-height:1.5; margin:0; }
      .header { display:flex; justify-content:space-between; border-bottom:2px solid #0a2342; padding-bottom:20px; margin-bottom:25px; }
      .logo { width:50px; height:50px; background:#0a2342; color:white; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:24px; border-radius:8px; }
      h1 { font-size:32px; margin:0; letter-spacing:-0.5px; }
      h2 { font-size:15px; margin:20px 0 8px; border-bottom:1px solid #e2e8f0; padding-bottom:4px; color:#0a2342; }
      table { width:100%; border-collapse:collapse; margin:10px 0; }
      th, td { text-align:left; padding:10px 12px; border-bottom:1px solid #e2e8f0; font-size:13px; }
      th { background:#f8fafc; font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#64748b; font-weight:700; }
      .total-row td { font-weight:900; font-size:15px; border-top:2px solid #0a2342; border-bottom:0; padding-top:12px; background:#f8fafc; }
      .right { text-align:right; }
      .muted { color:#64748b; font-size:11px; }
      .small { font-size:11px; }
      .stamp { margin-top:30px; padding-top:15px; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b; }
      .summary-box { background:#f8fafc; border-radius:8px; padding:14px; margin:10px 0; border:1px solid #e2e8f0; }
      .summary-row { display:flex; justify-content:space-between; padding:3px 0; font-size:12px; }
    </style>
  </head><body>
    <div class="header">
      <div>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
          <div class="logo">T</div>
          <div>
            <div style="font-weight:900; font-size:20px;">Tycoon Sourcing</div>
            <div class="muted">Procurement · Trade · Warehousing</div>
          </div>
        </div>
        <div class="muted">
          ${SITE.entity_sl}<br>
          ${SITE.address_sl}<br>
          ${SITE.email} · ${SITE.phone_sl}
        </div>
      </div>
      <div class="right">
        <h1>INVOICE</h1>
        <div style="margin-top:10px;"><strong>${invoice.invoice_num}</strong></div>
        <div class="muted">Issued: ${new Date(invoice.issued_at).toLocaleDateString()}</div>
        <div class="muted">Type: ${invoice.type}${isBatch && batch ? ` (Batch #${batch.batch_num})` : ''}</div>
        <div class="muted">Status: <strong style="color:${invoice.status === 'paid' ? '#16a34a' : '#ea580c'};">${invoice.status.toUpperCase()}</strong></div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:10px;">
      <div>
        <h2>Bill To</h2>
        <div>
          <strong>${deal.profiles?.company || deal.profiles?.full_name || 'Client'}</strong><br>
          <span class="muted">${deal.profiles?.full_name || ''}</span><br>
          <span class="muted">${deal.profiles?.email || ''}</span>
          ${deal.profiles?.phone ? `<br><span class="muted">${deal.profiles.phone}</span>` : ''}
        </div>
      </div>
      <div>
        <h2>Deal Reference</h2>
        <div>
          <strong>${deal.deal_code}</strong> — ${deal.product}<br>
          <span class="muted">Total order: LKR ${(+deal.order_value_lkr || 0).toLocaleString()}</span><br>
          <span class="muted">Warehouse: ${whList.find(w => w.id === deal.warehouse_id)?.name || deal.warehouse_id || '—'}</span>
        </div>
      </div>
    </div>

    <h2>Invoice Items</h2>
    <table>
      <thead><tr><th style="width:70%">Description</th><th class="right">Amount (LKR)</th></tr></thead>
      <tbody>
        ${lineItems.map(li => `<tr><td>${li.desc}</td><td class="right">${(+li.amt).toLocaleString('en', {minimumFractionDigits:0, maximumFractionDigits:2})}</td></tr>`).join('')}
        <tr class="total-row"><td>TOTAL</td><td class="right">LKR ${total.toLocaleString('en', {minimumFractionDigits:0, maximumFractionDigits:2})}</td></tr>
      </tbody>
    </table>

    ${isBatch && batch ? `
    <h2>Pickup Details</h2>
    <div class="summary-box">
      <div class="summary-row"><span>Batch #</span><strong>${batch.batch_num}</strong></div>
      <div class="summary-row"><span>Units collected</span><strong>${(+batch.units || 0).toLocaleString()}</strong></div>
      <div class="summary-row"><span>CBM removed</span><strong>${(+batch.cbm_collected || 0).toFixed(3)}</strong></div>
      <div class="summary-row"><span>Pickup date</span><strong>${batch.collected_at ? new Date(batch.collected_at).toLocaleDateString() : '—'}</strong></div>
    </div>
    ` : ''}

    <div class="stamp">
      <div><strong>Payment instructions:</strong> Please transfer via bank to the account details provided separately and send confirmation to ${SITE.email}.</div>
      <div style="margin-top:8px;">Thank you for your business with Tycoon Sourcing.</div>
      <div style="margin-top:8px;">For queries: ${SITE.email} · ${SITE.phone_sl} · ${SITE.phone_au}</div>
    </div>

    <script>window.onload = () => { setTimeout(() => window.print(), 500); };</script>
  </body></html>`;
  win.document.write(html);
  win.document.close();
}