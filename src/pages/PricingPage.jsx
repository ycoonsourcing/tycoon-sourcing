import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, Warehouse, Settings, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { SITE } from '@/content';

export default function PricingPage() {
  const navigate = useNavigate();
  const go = p => { navigate(p); window.scrollTo({top:0,behavior:'smooth'}); };

  // Three scenarios for LKR 500,000 order, 1 CBM, 50,000 units, 90-day window
  // Base: 500,000 · Handling (3%): 15,000
  // Smart pickup — 5 batches, avg 37 days in warehouse
  const smart = {
    label:'Smart pickup', subtitle:'5 batches every 15 days',
    avgDays: 37,
    storage: Math.round(1 * 140 * 37),     // 5,180
    service: Math.round(400000 * 0.04 * (37/30)), // 19,733
  };
  // Balanced — 3 batches, avg 60 days
  const balanced = {
    label:'Balanced pickup', subtitle:'3 batches every 30 days',
    avgDays: 60,
    storage: Math.round(1 * 140 * 60),     // 8,400
    service: Math.round(400000 * 0.04 * (60/30)), // 32,000
  };
  // Single pickup — day 90
  const single = {
    label:'Single pickup', subtitle:'1 pickup on day 90',
    avgDays: 90,
    storage: 1 * 140 * 90,                 // 12,600
    service: 400000 * 0.04 * 3,            // 48,000
  };

  [smart, balanced, single].forEach(s => {
    s.base = 500000; s.handling = 15000;
    s.total = s.base + s.handling + s.storage + s.service;
    s.fees = s.handling + s.storage + s.service;
    s.feesPct = ((s.fees / s.base) * 100).toFixed(2);
    s.unitPrice = (s.total / 50000).toFixed(2);
  });
  smart.savings = single.total - smart.total;
  balanced.savings = single.total - balanced.total;

  const maxBar = Math.max(smart.total, balanced.total, single.total);

  const fmt = v => `LKR ${(+v).toLocaleString('en', {minimumFractionDigits:0, maximumFractionDigits:0})}`;

  return (
    <>
      <Helmet>
        <title>Pricing & Fees — Tycoon Sourcing</title>
        <meta name="description" content="Transparent fee structure. Handling, storage, and service fees explained with worked examples." />
      </Helmet>

      <section className="bg-[#0a2342] py-10 md:py-14 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-bold tracking-widest text-blue-400 uppercase bg-blue-400/10 border border-blue-400/30 px-4 py-1.5 rounded-full mb-4">Pricing</span>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3">Transparent pricing</h1>
          <p className="text-blue-200 text-base md:text-lg font-light">Three fee components. Zero hidden charges. All amounts in LKR.</p>
        </div>
      </section>

      {/* Three fee components */}
      <section className="py-12 md:py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { num:'01', icon:Package,   title:'Handling fee',  rate:`${SITE.m1_handling_pct}%`, desc:'of total order value — one time', expl:'Charged once when goods arrive at the warehouse. Covers inbound logistics, load/unload, counting, labelling, inspection.', formula:'Handling = 3% × order value', example:'LKR 500,000 order → LKR 15,000 handling' },
              { num:'02', icon:Warehouse, title:'Storage fee',   rate:'LKR 140/CBM', desc:'per cubic metre per day', expl:'Charged daily on cubic metres still in warehouse. When you collect stock, CBM reduces and so does your daily bill.', formula:'Storage = CBM remaining × LKR rate × days held', example:'1 CBM × LKR 140/day × 90 days = LKR 12,600' },
              { num:'03', icon:Settings,  title:'Service fee',   rate:`${SITE.m1_service_fee_pct}%`, desc:"per month on Tycoon's capital", expl:"Inventory management fee on Tycoon's 80% capital contribution. Converted to daily rate so partial-month collections are always priced fairly.", formula:"Service = 80% capital × 4%/mo ÷ 30 × days × units/total", example:'LKR 400,000 capital × 4% = LKR 16,000/month = LKR 533/day' },
            ].map(b => (
              <div key={b.num} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="text-4xl font-black text-slate-100 mb-3">{b.num}</div>
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-4"><b.icon size={20} className="text-white" /></div>
                <h3 className="text-lg font-black text-[#0a2342] mb-1">{b.title}</h3>
                <div className="text-2xl font-black text-blue-700 mb-1">{b.rate}</div>
                <div className="text-xs text-slate-400 mb-4">{b.desc}</div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{b.expl}</p>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 mb-2">
                  <code className="text-[10px] font-mono text-blue-800">{b.formula}</code>
                </div>
                <div className="text-[10px] text-slate-500 italic">{b.example}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXAMPLE A — Full 90-day hold */}
      <section className="py-12 md:py-16 bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-bold tracking-widest text-blue-700 uppercase">Worst-case example</span>
            <h2 className="text-2xl md:text-3xl font-black text-[#0a2342] mt-2">Full 90-day hold</h2>
            <p className="text-slate-500 mt-2 text-sm">LKR 500,000 order · 50,000 units · 1 CBM · single pickup on day 90</p>
          </div>
          <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0a2342] text-white">
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest">Fee</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest">Rate</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest">Calculation</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="px-4 py-3 font-semibold text-slate-700">Base goods cost</td><td className="px-4 py-3 text-right text-slate-400 text-xs">—</td><td className="px-4 py-3 text-right text-slate-500 text-xs font-mono">50,000 units × LKR 10</td><td className="px-4 py-3 text-right font-bold text-slate-800">{fmt(500000)}</td></tr>
                  <tr><td className="px-4 py-3 font-semibold text-slate-700">Handling fee</td><td className="px-4 py-3 text-right text-slate-600 text-xs">3%</td><td className="px-4 py-3 text-right text-slate-500 text-xs font-mono">3% × 500,000</td><td className="px-4 py-3 text-right font-bold text-slate-800">{fmt(15000)}</td></tr>
                  <tr><td className="px-4 py-3 font-semibold text-slate-700">Storage fee (90 days)</td><td className="px-4 py-3 text-right text-slate-600 text-xs">LKR 140/CBM/day</td><td className="px-4 py-3 text-right text-slate-500 text-xs font-mono">1 × 140 × 90</td><td className="px-4 py-3 text-right font-bold text-slate-800">{fmt(12600)}</td></tr>
                  <tr><td className="px-4 py-3 font-semibold text-slate-700">Service fee (90 days)</td><td className="px-4 py-3 text-right text-slate-600 text-xs">4%/mo on LKR 400,000</td><td className="px-4 py-3 text-right text-slate-500 text-xs font-mono">400,000 × 4% × 3 mo</td><td className="px-4 py-3 text-right font-bold text-slate-800">{fmt(48000)}</td></tr>
                  <tr className="bg-slate-50 border-t-2 border-slate-200"><td className="px-4 py-3 font-black text-[#0a2342]">TOTAL PAID</td><td className="px-4 py-3 text-right text-slate-400 text-xs">—</td><td className="px-4 py-3 text-right text-slate-400 text-xs">—</td><td className="px-4 py-3 text-right font-black text-amber-600 text-base">{fmt(575600)}</td></tr>
                  <tr><td className="px-4 py-3 font-semibold text-slate-700">Total fees over base</td><td className="px-4 py-3 text-right text-slate-400 text-xs">—</td><td className="px-4 py-3 text-right text-slate-400 text-xs">—</td><td className="px-4 py-3 text-right font-bold text-red-600">{fmt(75600)} (15.12%)</td></tr>
                  <tr><td className="px-4 py-3 font-semibold text-slate-700">Effective unit price</td><td className="px-4 py-3 text-right text-slate-400 text-xs">—</td><td className="px-4 py-3 text-right text-slate-500 text-xs font-mono">575,600 ÷ 50,000</td><td className="px-4 py-3 text-right font-bold text-slate-800">LKR 11.51/unit</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 italic mt-4">
            * This is the maximum cost scenario. Collect in batches to pay less — see comparison below.
          </p>
        </div>
      </section>

      {/* EXAMPLE B — Three scenario comparison */}
      <section className="py-12 md:py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold tracking-widest text-green-700 uppercase">Three ways to collect</span>
            <h2 className="text-2xl md:text-3xl font-black text-[#0a2342] mt-2">Collect smart, save more</h2>
            <p className="text-slate-500 mt-2 text-sm max-w-2xl mx-auto">Same order — LKR 500,000 worth, 50,000 units, 1 CBM — but three different collection patterns. The earlier you collect, the less you pay.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-10">
            {[smart, balanced, single].map((s, i) => {
              const isBest = i === 0;
              return (
                <motion.div key={s.label}
                  initial={{opacity:0, y:24}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.4, delay:i*0.1}}
                  className={`rounded-2xl p-5 md:p-6 border-2 ${isBest ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-400 shadow-xl' : 'bg-white border-slate-200 shadow-sm'}`}>
                  {isBest && <div className="text-[10px] font-black text-white bg-green-600 px-2.5 py-1 rounded-full inline-block mb-2">BEST VALUE</div>}
                  <div className={`text-lg md:text-xl font-black mb-1 ${isBest ? 'text-green-800' : 'text-[#0a2342]'}`}>{s.label}</div>
                  <div className="text-xs text-slate-500 mb-5">{s.subtitle}</div>

                  <div className="space-y-2 mb-5 pb-5 border-b border-slate-200">
                    {[
                      {l:'Base goods', v:s.base},
                      {l:'Handling (3%)', v:s.handling},
                      {l:'Storage', v:s.storage},
                      {l:'Service', v:s.service},
                    ].map(r => (
                      <div key={r.l} className="flex justify-between text-xs">
                        <span className="text-slate-500">{r.l}</span>
                        <span className="font-semibold text-slate-700">{fmt(r.v)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total paid</span>
                    </div>
                    <div className={`text-2xl font-black mb-1 ${isBest ? 'text-green-800' : 'text-[#0a2342]'}`}>{fmt(s.total)}</div>
                    <div className="text-xs text-slate-500">LKR {s.unitPrice}/unit · fees {s.feesPct}%</div>
                  </div>

                  {s.savings > 0 && (
                    <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${isBest ? 'bg-green-600 text-white' : 'bg-slate-50 text-slate-600'}`}>
                      <TrendingDown size={14} />
                      <span className="text-xs font-bold">Save {fmt(s.savings)}</span>
                    </div>
                  )}
                  {s.savings === 0 && (
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-red-50 text-red-600">
                      <TrendingUp size={14} />
                      <span className="text-xs font-bold">Maximum cost</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Bar chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-8 shadow-sm">
            <h3 className="text-sm font-black text-blue-700 uppercase tracking-widest mb-6">Total cost comparison</h3>
            <div className="space-y-5">
              {[smart, balanced, single].map((s, i) => {
                const barPct = (s.total / maxBar) * 100;
                const isBest = i === 0;
                return (
                  <div key={s.label}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className={`text-sm font-black ${isBest ? 'text-green-700' : 'text-[#0a2342]'}`}>{s.label}</span>
                        <span className="text-xs text-slate-400 ml-2">({s.subtitle})</span>
                      </div>
                      <span className={`text-sm font-black ${isBest ? 'text-green-700' : 'text-[#0a2342]'}`}>{fmt(s.total)}</span>
                    </div>
                    <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{width:0}} whileInView={{width:`${barPct}%`}} viewport={{once:true}} transition={{duration:0.8, delay:i*0.15}}
                        className={`h-full rounded-lg flex items-center justify-end pr-3 ${isBest ? 'bg-gradient-to-r from-green-500 to-green-600' : i === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-red-400 to-red-500'}`}>
                        <span className="text-white text-[10px] font-bold">{s.feesPct}% fees</span>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                Collect smart and <strong className="text-green-700">save LKR {smart.savings.toLocaleString()}</strong> on this deal — that's <strong className="text-green-700">{Math.round((smart.savings/single.total)*100)}%</strong> less.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 bg-[#0a2342]">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Want to calculate your exact cost?</h2>
          <p className="text-blue-200 mb-8 text-sm md:text-base">Model your specific order and pickup schedule on our interactive calculator.</p>
          <button onClick={() => go('/calculator')} className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-blue-600 hover:bg-blue-500 text-white text-base md:text-lg font-black rounded-xl transition-all shadow-lg">
            Open the calculator <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </>
  );
}
