import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Warehouse, ShoppingBag, Globe, TrendingUp, Package, ShieldCheck, Award, CheckCircle, MapPin } from 'lucide-react';
import { SITE } from '@/content';
import { useCurrency } from '@/lib/CurrencyContext';

const fade = (d=0) => ({ hidden:{opacity:0,y:20}, visible:{opacity:1,y:0,transition:{duration:0.5,delay:d}} });

const MODELS = [
  { icon:Warehouse,   num:'01', color:'blue',   title:'Trade & Warehouse',     sub:'Buy, store, collect in batches', desc:`Pay ${SITE.m1_deposit_pct}% deposit. We fund the rest, store the goods, you collect within ${SITE.m1_window_days} days.`, path:'/services' },
  { icon:ShoppingBag, num:'02', color:'navy',   title:'Pure Procurement',      sub:`${SITE.m2_fee_pct}% fee — your capital, we source`, desc:'You have funds. We have the supplier network and AU payment infrastructure.', path:'/services' },
  { icon:Globe,       num:'03', color:'cyan',   title:'Import Facilitation',   sub:'End-to-end import to Sri Lanka', desc:'Sourcing, payment, freight, customs, delivery — we handle the entire import journey.', path:'/services' },
  { icon:TrendingUp,  num:'04', color:'teal',   title:'Pre-Stocked Goods',     sub:'Ready stock, immediate release', desc:'Browse available inventory. Buy at listed wholesale price. Collect immediately.', path:'/services' },
  { icon:Package,     num:'05', color:'indigo', title:'Consolidation Service', sub:'Group orders, shared freight', desc:'Too small for a full container? Consolidate with other buyers for better rates.', path:'/services' },
];

const COLMAP = {
  blue:   { border:'border-blue-200',   bg:'bg-blue-50',   icon:'bg-blue-600 text-white',   num:'text-blue-100',  title:'text-blue-900',  sub:'text-blue-600' },
  navy:   { border:'border-slate-200',  bg:'bg-slate-50',  icon:'bg-[#0a2342] text-white',  num:'text-slate-100', title:'text-slate-900', sub:'text-slate-600' },
  cyan:   { border:'border-cyan-200',   bg:'bg-cyan-50',   icon:'bg-cyan-600 text-white',   num:'text-cyan-100',  title:'text-cyan-900',  sub:'text-cyan-600' },
  teal:   { border:'border-teal-200',   bg:'bg-teal-50',   icon:'bg-teal-600 text-white',   num:'text-teal-100',  title:'text-teal-900',  sub:'text-teal-600' },
  indigo: { border:'border-indigo-200', bg:'bg-indigo-50', icon:'bg-indigo-600 text-white', num:'text-indigo-100',title:'text-indigo-900',sub:'text-indigo-600' },
};

export default function HomePage() {
  const navigate = useNavigate();
  const { fmt } = useCurrency();
  const go = p => { navigate(p); window.scrollTo({top:0,behavior:'smooth'}); };

  return (
    <>
      <Helmet>
        <title>Tycoon Sourcing — Procurement, Trade & Warehousing</title>
        <meta name="description" content="We source, purchase, and warehouse goods for businesses across Sri Lanka and beyond. Five flexible service models." />
      </Helmet>

      {/* HERO — Option C split layout */}
      <section className="bg-white min-h-[500px] md:min-h-[600px] flex items-center border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left — headline */}
          <div>
            <motion.div variants={fade(0)} initial="hidden" animate="visible">
              <span className="inline-block text-xs font-bold tracking-[0.2em] text-blue-700 uppercase bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full mb-6">
                Procurement · Trade · Warehousing
              </span>
            </motion.div>
            <motion.h1 variants={fade(0.1)} initial="hidden" animate="visible"
              className="text-4xl sm:text-5xl md:text-6xl font-black text-[#0a2342] mb-4 sm:mb-5 leading-[1.05] tracking-tight">
              Sourcing &amp;<br />
              <span className="text-blue-700">Warehousing</span><br />
              Made Simple.
            </motion.h1>
            <motion.p variants={fade(0.2)} initial="hidden" animate="visible"
              className="text-base sm:text-lg md:text-xl text-slate-600 mb-6 sm:mb-8 max-w-lg leading-relaxed">
              {SITE.description}
            </motion.p>
            <motion.div variants={fade(0.3)} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => go('/request')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white text-base font-bold rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-xl">
                Start a Request <ArrowRight size={18} />
              </button>
              <button onClick={() => go('/how-it-works')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-300 text-slate-700 hover:border-blue-700 hover:text-blue-700 text-base font-semibold rounded-xl transition-all">
                How It Works
              </button>
            </motion.div>
            {/* Trust badges */}
            <motion.div variants={fade(0.4)} initial="hidden" animate="visible" className="flex flex-wrap gap-4 mt-8">
              {['AU Registered Business', 'SL Operations Hub', '90-Day Collection Window', 'CBM-Based Storage'].map(b => (
                <div key={b} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <CheckCircle size={13} className="text-blue-600" />{b}
                </div>
              ))}
            </motion.div>
          </div>
          {/* Right — visual */}
          <motion.div variants={fade(0.2)} initial="hidden" animate="visible" className="relative hidden lg:block">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-200">
              <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80" alt="Warehouse operations" className="w-full h-[440px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0a2342]/60 via-transparent to-transparent" />
              {/* Floating stat cards */}
              <div className="absolute bottom-5 left-5 bg-white rounded-xl shadow-lg p-4 min-w-[140px]">
                <div className="text-2xl font-black text-blue-700">{SITE.m1_deposit_pct}%</div>
                <div className="text-xs text-slate-500 font-medium">Your deposit only</div>
              </div>
              <div className="absolute top-5 right-5 bg-white rounded-xl shadow-lg p-4 min-w-[140px]">
                <div className="text-2xl font-black text-[#0a2342]">{SITE.m1_window_days} days</div>
                <div className="text-xs text-slate-500 font-medium">Collection window</div>
              </div>
              <div className="absolute bottom-5 right-5 bg-white rounded-xl shadow-lg p-4 min-w-[140px]">
                <div className="text-2xl font-black text-green-600">5</div>
                <div className="text-xs text-slate-500 font-medium">Service models</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BLUE STRIP */}
      <div className="bg-blue-700 py-4 px-6">
        <p className="text-center text-white font-semibold text-sm md:text-base">
          "We buy, store, and sell goods to businesses — on your schedule, in batches, with transparent daily pricing."
        </p>
      </div>

      {/* 5 SERVICE MODELS */}
      <section className="py-14 md:py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold tracking-widest text-blue-700 uppercase">Five service models</span>
            <h2 className="text-3xl md:text-4xl font-black text-[#0a2342] mt-3 mb-3">One platform. Multiple ways to work with us.</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Whether you need stock funded and stored, a single sourcing transaction, or full import support — there is a model for you.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {MODELS.map((m, i) => {
              const c = COLMAP[m.color];
              return (
                <motion.button key={m.num} onClick={() => go(m.path)}
                  initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.4,delay:i*0.08}}
                  className={`group text-left bg-white border-2 ${c.border} hover:border-blue-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100`}>
                  <div className={`text-4xl font-black ${c.num} mb-2`}>{m.num}</div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${c.icon}`}>
                    <m.icon size={20} />
                  </div>
                  <div className={`font-black text-sm mb-1 leading-tight ${c.title}`}>{m.title}</div>
                  <div className={`text-xs font-semibold mb-3 ${c.sub}`}>{m.sub}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs text-blue-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ArrowRight size={11} />
                  </div>
                </motion.button>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <button onClick={() => go('/services')} className="inline-flex items-center gap-2 px-6 py-3 border-2 border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white font-bold rounded-xl transition-all">
              View all service details <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14 md:py-20 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <span className="text-xs font-bold tracking-widest text-blue-700 uppercase">Model 1 — Flagship service</span>
              <h2 className="text-3xl md:text-4xl font-black text-[#0a2342] mt-3 mb-5">Trade & Warehouse Fulfilment</h2>
              <p className="text-slate-600 leading-relaxed mb-8">You need goods but cannot fund the full purchase upfront. Pay just {SITE.m1_deposit_pct}% as a reservation deposit. We purchase the stock, store it at our Sri Lanka warehouse, and you collect in batches within {SITE.m1_window_days} days.</p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  {label:'Your deposit', val:`${SITE.m1_deposit_pct}%`, color:'text-blue-700'},
                  {label:'We fund', val:`${100-SITE.m1_deposit_pct}%`, color:'text-[#0a2342]'},
                  {label:'Collection window', val:`${SITE.m1_window_days} days`, color:'text-blue-700'},
                  {label:'Storage basis', val:'CBM/day', color:'text-[#0a2342]'},
                ].map(m => (
                  <div key={m.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className={`text-2xl font-black ${m.color}`}>{m.val}</div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">{m.label}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => go('/how-it-works')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition-all shadow-md">
                See full process <ArrowRight size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                {n:'01', t:'Submit product request', d:'Tell us what you need, quantity, supplier, and preferred warehouse location.'},
                {n:'02', t:'Pay 20% reservation deposit', d:'Secure your order. We fund the remaining 80% and purchase from the supplier.'},
                {n:'03', t:'Goods stored in warehouse', d:'Stock arrives at your chosen warehouse. CBM-based daily storage fee begins.'},
                {n:'04', t:'Collect any qty, any day', d:'Pay per batch at transparent daily-rate pricing. Collect early to pay less.'},
              ].map((s,i) => (
                <motion.div key={s.n} initial={{opacity:0,x:20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.4,delay:i*0.1}}
                  className="flex gap-4 bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 transition-all shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-black text-sm flex items-center justify-center flex-shrink-0">{s.n}</div>
                  <div>
                    <div className="font-bold text-[#0a2342] text-sm mb-1">{s.t}</div>
                    <div className="text-xs text-slate-500 leading-relaxed">{s.d}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COMPANY STRUCTURE — One company, two locations */}
      <section className="py-14 md:py-20 bg-[#0a2342]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">Our structure</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-3">One company. Two locations.</h2>
            <p className="text-blue-200 max-w-xl mx-auto">Tycoon Sourcing operates as a single unified brand with a head office in Australia and an operations hub in Sri Lanka.</p>
          </div>

          {/* Two location cards side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* AU Head Office */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Head Office · Australia</div>
              <div className="font-black text-white text-xl mb-1">{SITE.entity_au}</div>
              <div className="text-sm text-blue-300">Queensland, Australia</div>
            </div>
            {/* SL Operations Hub */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">Operations Hub · Sri Lanka</div>
              <div className="font-black text-white text-xl mb-1">{SITE.entity_sl}</div>
              <div className="text-sm text-blue-300">Colombo, Sri Lanka</div>
            </div>
          </div>

          {/* Combined bullets list */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {[
                'Holds capital & funds all deals',
                'Receives all client payments',
                'Manages client relationships',
                'Profit centre for the group',
                'Manages warehouse & fulfilment',
                'Receives & measures goods (CBM)',
                'Issues delivery orders & GRNs',
                'Operations & logistics hub',
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-blue-100">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WAREHOUSE NETWORK TEASER */}
      <section className="py-14 md:py-20 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold tracking-widest text-green-700 uppercase bg-green-50 border border-green-200 px-3 py-1 rounded-full">Tycoon Cloud Storage Network</span>
              <h2 className="text-3xl md:text-4xl font-black text-[#0a2342] mt-4 mb-4">Warehouses across Sri Lanka</h2>
              <p className="text-slate-600 leading-relaxed mb-6">Our growing network of warehouse locations means your goods can be stored close to your customers. One main warehouse in Colombo — and partner locations expanding nationwide.</p>
              <div className="space-y-3 mb-8">
                {SITE.warehouses.map(w => (
                  <div key={w.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${w.active ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className={w.active ? 'text-blue-600' : 'text-slate-400'} />
                      <div>
                        <div className={`font-bold text-sm ${w.active ? 'text-[#0a2342]' : 'text-slate-400'}`}>{w.name}</div>
                        <div className="text-xs text-slate-400">{w.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {w.active
                        ? <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">Active</span>
                        : <span className="text-xs font-semibold bg-slate-100 text-slate-400 px-2.5 py-1 rounded-full">Coming soon</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => go('/warehouses')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-md">
                Become a Warehouse Partner <ArrowRight size={16} />
              </button>
            </div>
            <div className="bg-[#0a2342] rounded-2xl p-8 text-white">
              <h3 className="text-xl font-black mb-2">Own warehouse space?</h3>
              <p className="text-blue-200 text-sm leading-relaxed mb-6">Join the Tycoon Cloud Storage Network. Earn daily revenue from your unused space. We bring the clients — you provide the space.</p>
              {[
                {icon:'💰', title:'Earn daily',    desc:'Get paid per CBM per day for every deal stored at your location.'},
                {icon:'📋', title:'We manage it',  desc:'Tycoon handles all client relationships. You just store the goods.'},
                {icon:'🔒', title:'Low risk',       desc:'Goods are always owned by Tycoon. No credit risk to you.'},
                {icon:'📍', title:'Any location',  desc:'Colombo, Kandy, Galle, Negombo, Jaffna — anywhere in Sri Lanka.'},
              ].map(b => (
                <div key={b.title} className="flex gap-3 mb-4 last:mb-0">
                  <span className="text-xl flex-shrink-0">{b.icon}</span>
                  <div>
                    <div className="font-bold text-sm text-white">{b.title}</div>
                    <div className="text-xs text-blue-300 leading-relaxed">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-14 md:py-20 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-[#0a2342]">Why Tycoon Sourcing?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {icon:ShieldCheck, title:'Only 20% upfront', desc:'Access full inventory value without full capital. Pay the rest in batches as your business demands.'},
              {icon:Warehouse,   title:'CBM-based storage', desc:'Charged per cubic metre per day — the industry standard. You pay for physical space, nothing else.'},
              {icon:Package,     title:'Collect in batches', desc:'No forced bulk withdrawals. Take exactly what your business needs, when it needs it, on any day.'},
              {icon:Globe,       title:'AU + SL dual entity', desc:'Australian-registered company. Sri Lanka operations. Best of both for your supply chain.'},
              {icon:Award,       title:'Verified suppliers', desc:'Every supplier is KYC/KYB verified with independent price checks before any deal is committed.'},
              {icon:TrendingUp,  title:'Five service models', desc:'Procurement, trade fulfilment, import, distribution, consolidation — all from one provider.'},
            ].map((b,i) => (
              <motion.div key={b.title} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.4,delay:i*0.07}}
                className="bg-[#f8fafc] border border-slate-200 hover:border-blue-300 hover:shadow-md rounded-xl p-6 transition-all">
                <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center mb-4">
                  <b.icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-[#0a2342] mb-2">{b.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 md:py-20 bg-blue-700">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Ready to get started?</h2>
          <p className="text-blue-100 text-xl mb-10 font-light">Submit a product request and we'll respond within 48 hours.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => go('/request')} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 text-lg font-black rounded-xl hover:bg-blue-50 transition-all shadow-xl">
              Start a Request <ArrowRight size={20} />
            </button>
            <button onClick={() => go('/calculator')} className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/50 text-white hover:bg-white/10 text-lg font-semibold rounded-xl transition-all">
              Open Calculator
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
