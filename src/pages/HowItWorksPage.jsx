import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, CreditCard, Warehouse, Package, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const fadeUp = (delay = 0) => ({ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, delay } } });

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const go = (p) => { navigate(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const steps = [
    {
      num: '01', icon: FileText, color: 'blue',
      title: 'Submit your product request',
      sub: 'Days 1–2',
      desc: 'Fill in our product request form with what you need — product description, quantity, target price, preferred supplier (optional), and any files or images. We review within 48 hours and send a deal proposal.',
      docs: ['Company name + business registration', 'Product spec / proforma invoice', 'Supplier quotation (if available)'],
      note: null,
    },
    {
      num: '02', icon: CreditCard, color: 'indigo',
      title: 'Sign agreement & pay 20% deposit',
      sub: 'Days 2–3',
      desc: 'Once you accept the deal proposal, you sign our Purchase Reservation Agreement and pay a 20% deposit. This is not a loan — it is a purchase deposit on goods Tycoon will buy and hold for you.',
      docs: ['Purchase Reservation Agreement', 'Invoice for 20% deposit', 'KYC documents (ID + business registration)'],
      note: 'Legal note: The word "financing" is never used. This is a buy-and-sell arrangement. Tycoon purchases goods and resells them to you over time.',
    },
    {
      num: '03', icon: Package, color: 'violet',
      title: 'Tycoon purchases from supplier',
      sub: 'Days 3–7',
      desc: 'Tycoon Sourcing (Australia) pays the supplier directly. Goods are delivered to our Tycoon Holdings warehouse in Sri Lanka. On arrival, our team measures the shipment in CBM, labels and logs everything into inventory.',
      docs: ['Purchase Order (Tycoon → Supplier)', 'Supplier bank account confirmation', 'Goods Received Note (GRN)', 'Inventory entry log with CBM measurement'],
      note: null,
    },
    {
      num: '04', icon: Warehouse, color: 'blue',
      title: 'Goods stored — daily fees begin',
      sub: 'Ongoing',
      desc: 'From the day goods arrive, three fee streams begin accruing: a one-time handling charge (3%), a daily CBM-based storage fee on remaining volume, and a daily service fee on Tycoon\'s capital outlay. Every unit\'s daily price is transparent and trackable.',
      docs: ['Daily inventory statement (available on request)', 'CBM measurement record', 'Fee schedule per batch'],
      note: 'Storage = CBM held × LKR/CBM/day. Service = Tycoon\'s 80% capital × 4%/month ÷ 30, applied per unit per day.',
    },
    {
      num: '05', icon: CheckCircle, color: 'green',
      title: 'Collect any quantity, any day',
      sub: 'Within 90 days',
      desc: 'You can visit the warehouse and collect any quantity at any time within 90 days. Each batch is priced at: base cost + proportional handling + storage accrued to that day + service fee accrued to that day. Pay before release. We issue a sales invoice and delivery order for each batch.',
      docs: ['Batch Sales Invoice', 'Delivery Order (DO)', 'Updated inventory statement', 'Running payment balance'],
      note: 'Collect early = pay less. The longer goods sit, the more fees accrue. Use the calculator to plan your schedule.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>How It Works — Tycoon Sourcing</title>
        <meta name="description" content="A simple 4-step process to source, fund, store and collect your inventory through Tycoon Sourcing." />
      </Helmet>

      {/* HERO */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div variants={fadeUp(0)} initial="hidden" animate="visible">
            <span className="inline-block text-xs font-bold tracking-widest text-blue-400 uppercase border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 rounded-full mb-6">The process</span>
          </motion.div>
          <motion.h1 variants={fadeUp(0.1)} initial="hidden" animate="visible" className="text-3xl md:text-5xl font-black text-white mb-6">
            How Tycoon Sourcing works
          </motion.h1>
          <motion.p variants={fadeUp(0.2)} initial="hidden" animate="visible" className="text-xl text-gray-300 font-light max-w-2xl mx-auto">
            From your first product request to your final batch collection — every step explained, every document listed.
          </motion.p>
        </div>
      </section>

      {/* QUICK SUMMARY STRIP */}
      <div className="bg-slate-800 border-y border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Your deposit', value: '20%' },
            { label: 'Tycoon funds', value: '80%' },
            { label: 'Collection window', value: '90 days' },
            { label: 'Storage basis', value: 'CBM/day' },
          ].map(m => (
            <div key={m.label}>
              <div className="text-2xl font-black text-blue-400">{m.value}</div>
              <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* STEPS */}
      <section className="py-12 md:py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          {steps.map((s, i) => (
            <motion.div key={s.num} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <s.icon size={24} className="text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl font-black text-white/10">{s.num}</span>
                      <span className="text-xs font-bold text-blue-400 border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 rounded-full">{s.sub}</span>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-4">{s.title}</h3>
                    <p className="text-gray-400 leading-relaxed mb-6">{s.desc}</p>

                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Documents at this stage</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {s.docs.map(d => (
                          <div key={d} className="flex items-center gap-2 text-sm text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>

                    {s.note && (
                      <div className="mt-5 flex gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                        <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-200/80 leading-relaxed">{s.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* DEFAULT SCENARIO */}
      <section className="py-12 md:py-20 bg-slate-800/50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white mb-8 text-center">Example deal — LKR 2,000,000 order</h2>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700">
              <div className="p-6">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Deal structure</div>
                {[
                  { label: 'Total order value', val: 'LKR 2,000,000' },
                  { label: 'ABC pays (20% deposit)', val: 'LKR 400,000' },
                  { label: 'Tycoon funds (80%)', val: 'LKR 1,600,000' },
                  { label: 'Total units', val: '1,000 units' },
                  { label: 'Base price per unit', val: 'LKR 10.00' },
                  { label: 'Shipment volume', val: '5.0 CBM' },
                  { label: 'CBM per unit', val: '0.005 CBM' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-2.5 border-b border-slate-700/50 last:border-0">
                    <span className="text-sm text-gray-400">{r.label}</span>
                    <span className="text-sm font-semibold text-white">{r.val}</span>
                  </div>
                ))}
              </div>
              <div className="p-6">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Fees over 90 days</div>
                {[
                  { label: 'Handling (3%, one-time)', val: 'LKR 300', color: '' },
                  { label: 'Storage (LKR 0.70/CBM/day × 90d)', val: 'LKR 315', color: 'text-blue-400' },
                  { label: 'Service fee (4%/mo × 3mo on LKR 8,000)', val: 'LKR 960', color: '' },
                  { label: 'Total fees (full 90 days)', val: 'LKR 1,575', color: 'text-amber-400' },
                  { label: 'Total ABC pays (base + fees)', val: 'LKR 11,575', color: 'text-amber-400' },
                  { label: 'Effective unit price', val: 'LKR 11.58', color: '' },
                  { label: 'Tycoon net profit*', val: '~LKR 1,300+', color: 'text-green-400' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-2.5 border-b border-slate-700/50 last:border-0">
                    <span className="text-sm text-gray-400">{r.label}</span>
                    <span className={`text-sm font-semibold ${r.color || 'text-white'}`}>{r.val}</span>
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-3">*After actual warehouse operating costs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 md:py-16 bg-slate-900 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-black text-white mb-4">Ready to start your first deal?</h3>
          <p className="text-gray-400 mb-8">Use our calculator to model your exact costs, then submit a product request to get started.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => go('/calculator')} className="px-6 py-3 border border-blue-500/40 text-blue-400 rounded-xl hover:bg-blue-500/10 transition-all font-medium">
              Open Calculator
            </button>
            <button onClick={() => go('/request')} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2">
              Start a Request <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
