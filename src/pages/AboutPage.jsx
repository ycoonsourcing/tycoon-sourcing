import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Globe, ShieldCheck, Building2, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const navigate = useNavigate();
  const go = (p) => { navigate(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <>
      <Helmet>
        <title>About — Tycoon Sourcing</title>
        <meta name="description" content="About Tycoon Sourcing — dual-entity structure, compliance approach, and risk management framework." />
      </Helmet>

      <section className="pt-32 pb-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <span className="inline-block text-xs font-bold tracking-widest text-blue-400 uppercase border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 rounded-full mb-6">About</span>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4">Who we are</h1>
          <p className="text-xl text-gray-300 font-light">A dual-entity procurement and inventory platform operating across Australia and Sri Lanka.</p>
        </div>
      </section>

      <section className="py-10 md:py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 space-y-8">

          {/* Dual entity */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            <h2 className="text-2xl font-black text-white mb-6">Company structure</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  code: 'AU', name: 'Tycoon Sourcing', country: 'Australia (Queensland)',
                  role: 'Capital & client management entity',
                  items: ['Receives all client payments', 'Funds 80% of all deals', 'Retains profit and manages compliance', 'Registered Australian business (ABN)', 'Operates under Australian Consumer Law', 'AML/CTF compliance (AUSTRAC)'],
                },
                {
                  code: 'SL', name: 'Tycoon Holdings (Pvt) Ltd', country: 'Sri Lanka',
                  role: 'Operations & warehousing entity',
                  items: ['Manages procurement from local/regional suppliers', 'Operates warehouse facility', 'Handles inbound goods, CBM measurement, storage', 'Issues GRNs, delivery orders, inventory records', 'Receives cost-reimbursement from AU entity', 'Registered Sri Lankan private company'],
                },
              ].map(e => (
                <div key={e.name} className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                  <div className="inline-block bg-blue-100 text-blue-700 font-black text-xs px-2.5 py-1 rounded-full mb-3">{e.code}</div>
                  <h3 className="font-black text-white mb-1">{e.name}</h3>
                  <div className="text-xs text-gray-500 mb-1">{e.country}</div>
                  <div className="text-xs font-bold text-blue-400 mb-4">{e.role}</div>
                  {e.items.map(item => (
                    <div key={item} className="flex items-start gap-2 py-1.5 border-b border-slate-700/40 last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                      <span className="text-sm text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            <h2 className="text-2xl font-black text-white mb-6">Compliance approach</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: ShieldCheck, title: 'AML / KYC', desc: 'All clients undergo KYC verification. Supplier KYB checks are mandatory before any deal is funded. Unusual transactions are flagged and reviewed.' },
                { icon: Building2, title: 'Legal structure', desc: 'The buy-and-sell model is structured to avoid moneylending classification. All agreements use purchase and service fee language, not loan or interest.' },
                { icon: Globe, title: 'Tax compliance', desc: 'Tycoon Sourcing AU pays Australian corporate tax on net profit. Service fees charged to Sri Lankan clients are GST-free exports of services.' },
              ].map(c => (
                <div key={c.title} className="bg-slate-900 rounded-xl p-5">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                    <c.icon size={20} className="text-blue-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2 text-sm">{c.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk management */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            <h2 className="text-2xl font-black text-white mb-6">Risk management framework</h2>
            <div className="space-y-3">
              {[
                { title: 'Goods title retention', desc: 'All inventory remains the legal property of Tycoon Holdings until each batch is fully paid. This is the primary protection against client default.' },
                { title: 'Deposit protection', desc: '20% client deposit is held throughout the deal. In the event of default, this is retained to offset losses before goods are resold.' },
                { title: 'Mandatory goods insurance', desc: 'All inventory in the warehouse must be covered by goods-in-storage insurance. This protects against damage, theft, and natural events.' },
                { title: 'Supplier fraud prevention', desc: 'Suppliers are KYB-verified, independently price-checked, and must supply proforma invoices and bank confirmation letters directly — not via the client.' },
                { title: 'Fast-moving goods only', desc: 'Tycoon only accepts deals for products with clear, established resale demand. No speculative or illiquid product categories.' },
                { title: '90-day hard limit', desc: 'All deals have a 90-day maximum collection window. This limits exposure and ensures capital rotates efficiently.' },
              ].map(r => (
                <div key={r.title} className="flex gap-4 p-4 bg-slate-900 rounded-xl border border-slate-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  <div>
                    <div className="font-bold text-white text-sm mb-1">{r.title}</div>
                    <div className="text-sm text-gray-400 leading-relaxed">{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-4">
            <button onClick={() => go('/request')} className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-xl text-lg">
              Become a client <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
