import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Warehouse, ShoppingBag, Globe, TrendingUp, Package, ArrowRight, CheckCircle } from 'lucide-react';
import { SITE } from '@/content';

const MODELS = [
  {
    icon:Warehouse, badge:'Model 1', color:'blue',
    title:'Trade & Warehouse Fulfilment',
    tagline:'We buy it. We store it. You collect in batches.',
    desc:`You need goods but cannot fund the full purchase upfront. Pay ${SITE.m1_deposit_pct}% as a reservation deposit — we purchase the stock, store it at Tycoon Holdings warehouse in Sri Lanka, and you collect any quantity on any day within ${SITE.m1_window_days} days.`,
    forWho:'SME buyers, distributors, retailers, ration shops, contractors in Sri Lanka',
    fees:[`${SITE.m1_handling_pct}% handling fee (one-time, on goods value)`,`LKR 140/CBM/day warehouse storage`,`${SITE.m1_service_fee_pct}%/month inventory service fee on Tycoon's capital`],
    path:'/how-it-works', cta:'See how it works',
  },
  {
    icon:ShoppingBag, badge:'Model 2', color:'cyan',
    title:'Pure Procurement Service',
    tagline:'You have capital. We have the supplier network.',
    desc:`You have funds but need international supplier access or our AU payment infrastructure. Tycoon sources, negotiates, and purchases on your behalf. You own the goods from day one. We charge a flat procurement fee — nothing else.`,
    forWho:'Any business with funds that needs sourcing expertise or international payment capability',
    fees:[`${SITE.m2_fee_pct}% procurement fee (minimum LKR 20,000 per transaction)`,'GST-free export of services for overseas clients','No goods ownership transfer — you own from day one'],
    path:'/request', cta:'Request now',
  },
  {
    icon:Globe, badge:'Model 3', color:'indigo',
    title:'Import Procurement & Facilitation',
    tagline:'Full-service import from China, India, UAE, Australia.',
    desc:'End-to-end import facilitation — sourcing, international payment, freight coordination, customs documentation, and delivery to your Sri Lanka address or warehouse. We handle the entire import journey.',
    forWho:'Sri Lankan businesses importing goods from international markets',
    fees:['1–2% procurement fee on goods value','LKR 30,000–60,000 logistics coordination per shipment','Optional: customs documentation assistance fee'],
    path:'/request', cta:'Request now',
  },
  {
    icon:TrendingUp, badge:'Model 4', color:'teal',
    title:'Pre-Stocked Distribution',
    tagline:'Ready stock, ready to ship — no deal structure needed.',
    desc:'Tycoon pre-purchases high-demand, fast-moving products for the open market. Browse available inventory, buy at listed wholesale price, and collect immediately. No reservation deposit, no 90-day structure.',
    forWho:'Buyers needing immediate stock of known, fast-moving products',
    fees:['Listed wholesale price per unit (all costs included)','Immediate release on full payment','No reservation deposit required'],
    path:'/request', cta:'Check availability',
  },
  {
    icon:Package, badge:'Model 5', color:'violet',
    title:'Consolidation & Group Shipping',
    tagline:'Too small for a full container? Ship together.',
    desc:'Multiple buyers with small-quantity orders from the same supplier market consolidate into one bulk shipment. Tycoon manages grouping, bulk purchasing, freight, and distribution on arrival. Better prices, lower freight cost.',
    forWho:'Small buyers who cannot meet supplier MOQs or afford full-container-load freight alone',
    fees:['1–2% procurement fee per client','LKR 15,000–30,000 consolidation coordination per client','Optional warehouse storage if goods held pre-distribution'],
    path:'/request', cta:'Join a consolidation',
  },
];

const C = {
  blue:  {bg:'bg-blue-500/10',   br:'border-blue-500/25',  tx:'text-blue-400',   badge:'bg-blue-500/10 text-blue-300 border border-blue-500/30'},
  cyan:  {bg:'bg-cyan-500/10',   br:'border-cyan-500/25',  tx:'text-cyan-400',   badge:'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'},
  indigo:{bg:'bg-indigo-500/10', br:'border-indigo-500/25',tx:'text-indigo-400', badge:'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'},
  teal:  {bg:'bg-teal-500/10',   br:'border-teal-500/25',  tx:'text-teal-400',   badge:'bg-teal-500/10 text-teal-300 border border-teal-500/30'},
  violet:{bg:'bg-violet-500/10', br:'border-violet-500/25',tx:'text-violet-400', badge:'bg-violet-500/10 text-violet-300 border border-violet-500/30'},
};

export default function ServicesPage() {
  const navigate = useNavigate();
  const go = (p) => { navigate(p); window.scrollTo({top:0,behavior:'smooth'}); };

  return (
    <>
      <Helmet>
        <title>Our Services — Tycoon Sourcing</title>
        <meta name="description" content="Five service models: Trade & Warehouse, Procurement, Import Facilitation, Pre-Stocked Distribution, Consolidation." />
      </Helmet>

      <section className="pt-32 pb-14 bg-gradient-to-br from-[#0d1b2e] via-[#0a1525] to-[#0d1b2e]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block text-xs font-bold tracking-widest text-cyan-400 uppercase border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 rounded-full mb-5">Our services</span>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4">Five ways to work with us</h1>
          <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto">Pick the model that fits your situation. All five share the same foundation: verified suppliers, transparent pricing, and reliable execution.</p>
        </div>
      </section>

      <section className="py-14 bg-[#0a1525]">
        <div className="max-w-5xl mx-auto px-6 space-y-7">
          {MODELS.map((m, i) => {
            const c = C[m.color];
            return (
              <motion.div key={m.badge} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.5}}
                className="bg-[#111f33] border border-white/8 hover:border-blue-500/30 rounded-2xl overflow-hidden transition-all duration-300">
                <div className="p-7 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${c.bg} ${c.br}`}>
                        <m.icon size={24} className={c.tx} />
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.badge}`}>{m.badge}</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-black text-white mb-1">{m.title}</h2>
                      <p className={`text-sm font-semibold mb-4 ${c.tx}`}>{m.tagline}</p>
                      <p className="text-gray-300 text-sm leading-relaxed mb-6">{m.desc}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Who it's for</div>
                          <p className="text-xs text-gray-300 leading-relaxed">{m.forWho}</p>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Fee structure</div>
                          {m.fees.map(f => (
                            <div key={f} className="flex items-start gap-1.5 mb-1.5">
                              <CheckCircle size={11} className={`${c.tx} flex-shrink-0 mt-0.5`} />
                              <span className="text-xs text-gray-300 leading-relaxed">{f}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-end">
                          <button onClick={() => go(m.path)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all">
                            {m.cta} <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </>
  );
}
