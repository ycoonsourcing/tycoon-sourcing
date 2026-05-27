import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { MapPin, CheckCircle, Send, Upload, X } from 'lucide-react';
import { SITE } from '@/content';

const inp = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all text-sm';
const lbl = 'block text-sm font-semibold text-slate-700 mb-1.5';

export default function WarehousePage() {
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ name:'', business:'', nic:'', phone:'', email:'', district:'', address:'', sqft:'', type:'dry', security:'', rate:'', notes:'' });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSending(true);
    await new Promise(r => setTimeout(r, 800));
    const subject = encodeURIComponent(`Warehouse Partner Application — ${form.name} — ${form.district}`);
    const body = encodeURIComponent(`Warehouse Partner Application\n\nOwner: ${form.name}\nBusiness: ${form.business}\nNIC: ${form.nic}\nPhone: ${form.phone}\nEmail: ${form.email}\nDistrict: ${form.district}\nAddress: ${form.address}\nArea: ${form.sqft} sqft\nType: ${form.type}\nSecurity: ${form.security}\nAsking rate: ${form.rate}\nNotes: ${form.notes}`);
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
    setSending(false); setDone(true);
  };

  return (
    <>
      <Helmet>
        <title>Warehouse Partner — Tycoon Sourcing Cloud Storage Network</title>
        <meta name="description" content="Join the Tycoon Cloud Storage Network. Earn daily revenue from your unused warehouse space across Sri Lanka." />
      </Helmet>

      {/* HERO */}
      <section className="bg-[#0a2342] py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-xs font-bold tracking-widest text-green-400 uppercase bg-green-400/10 border border-green-400/30 px-4 py-1.5 rounded-full mb-5">
            Tycoon Cloud Storage Network
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-5">Become a Warehouse Partner</h1>
          <p className="text-xl text-blue-200 font-light max-w-2xl mx-auto">Have unused storage space in Sri Lanka? Join our network and earn daily revenue — we bring the clients, you provide the space.</p>
        </div>
      </section>

      {/* HOW IT WORKS FOR PARTNERS */}
      <section className="py-10 md:py-16 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-[#0a2342] text-center mb-12">How it works for you</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {n:'01', title:'Apply online', desc:'Fill in the form below with your space details, photos, and asking rate.'},
              {n:'02', title:'We verify', desc:'Our team reviews your application, visits the location, and approves your listing.'},
              {n:'03', title:'Get activated', desc:'Your warehouse appears in our network. Clients can be assigned to your location.'},
              {n:'04', title:'Earn daily', desc:'Get paid per CBM per day for every deal stored at your facility.'},
            ].map((s,i) => (
              <motion.div key={s.n} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.4,delay:i*0.1}}
                className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-700 text-white font-black text-lg flex items-center justify-center mx-auto mb-4">{s.n}</div>
                <h3 className="font-bold text-[#0a2342] mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-10 md:py-16 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-3xl font-black text-[#0a2342] mb-6">Why join the network?</h2>
              {[
                {title:'Earn from unused space', desc:'Turn empty sqft into daily income. You set your asking rate.'},
                {title:'Zero client management', desc:'Tycoon handles all client relationships. You just store and release goods.'},
                {title:'No credit risk', desc:'Goods are always owned by Tycoon Holdings. You never extend credit.'},
                {title:'Simple operations', desc:'Receive goods, measure CBM, store securely, release on delivery order. Clear SOPs provided.'},
                {title:'Expand your income', desc:'The more deals we get in your area, the more you earn. Growth is automatic.'},
                {title:'Any size welcome', desc:'From 200 sqft spare room to 5,000 sqft commercial unit — all considered.'},
              ].map(b => (
                <div key={b.title} className="flex gap-3 mb-4">
                  <CheckCircle size={16} className="text-blue-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#0a2342] text-sm">{b.title}</div>
                    <div className="text-xs text-slate-500 leading-relaxed">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#0a2342] rounded-2xl p-7 text-white">
              <h3 className="text-xl font-black mb-4">Current network locations</h3>
              <div className="space-y-3">
                {SITE.warehouses.map(w => (
                  <div key={w.id} className={`flex items-center justify-between p-3.5 rounded-xl border ${w.active ? 'bg-white/10 border-white/20' : 'bg-white/3 border-white/8'}`}>
                    <div className="flex items-center gap-2.5">
                      <MapPin size={14} className={w.active ? 'text-green-400' : 'text-blue-400'} />
                      <div>
                        <div className={`font-bold text-sm ${w.active ? 'text-white' : 'text-blue-300'}`}>{w.name}</div>
                        <div className="text-xs text-blue-400">{w.location}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${w.active ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-blue-300'}`}>
                        {w.active ? `${w.type}` : 'Seeking partner'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-300 mt-4 leading-relaxed">Locations marked "Seeking partner" are priority areas — applications from these regions are fast-tracked.</p>
            </div>
          </div>
        </div>
      </section>

      {/* APPLICATION FORM */}
      <section className="py-10 md:py-16 bg-white border-t border-slate-100">
        <div className="max-w-2xl mx-auto px-6">
          {done ? (
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="text-center py-16">
              <div className="w-16 h-16 bg-green-100 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-[#0a2342] mb-3">Application submitted!</h2>
              <p className="text-slate-500 mb-6">We'll review your application and contact you within 3 business days.</p>
              <button onClick={() => setDone(false)} className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold transition-all">Submit another</button>
            </motion.div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-[#0a2342] mb-3">Partner Application Form</h2>
                <p className="text-slate-500">Tell us about your space. We'll review and get back to you within 3 business days.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-5">Your details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {label:'Full name', key:'name', ph:'Your full name', req:true},
                      {label:'Business name', key:'business', ph:'If registered (optional)', req:false},
                      {label:'NIC / Passport', key:'nic', ph:'ID number', req:true},
                      {label:'Phone / WhatsApp', key:'phone', ph:'+94 77 xxx xxxx', req:true},
                      {label:'Email address', key:'email', ph:'your@email.com', req:true},
                      {label:'District', key:'district', ph:'e.g. Colombo, Kandy', req:true},
                    ].map(f => (
                      <div key={f.key}>
                        <label className={lbl}>{f.label}{f.req && <span className="text-blue-600 ml-1">*</span>}</label>
                        <input type="text" required={f.req} placeholder={f.ph} value={form[f.key]} onChange={e => set(f.key, e.target.value)} className={inp} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-5">Storage space details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={lbl}>Full address <span className="text-blue-600">*</span></label>
                      <textarea required rows={2} placeholder="Street address, city, district..." value={form.address} onChange={e => set('address', e.target.value)} className={inp + ' resize-none'} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Available area (sqft) <span className="text-blue-600">*</span></label>
                        <input type="number" required placeholder="e.g. 500" value={form.sqft} onChange={e => set('sqft', e.target.value)} className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Storage type <span className="text-blue-600">*</span></label>
                        <select required value={form.type} onChange={e => set('type', e.target.value)} className={inp + ' cursor-pointer'}>
                          <option value="dry">Dry goods / general</option>
                          <option value="temp">Temperature controlled</option>
                          <option value="outdoor">Covered outdoor</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Security measures</label>
                      <input type="text" placeholder="e.g. Locked, CCTV, security guard, gated..." value={form.security} onChange={e => set('security', e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Asking rate (LKR per sqft per month)</label>
                      <input type="text" placeholder="e.g. LKR 75 per sqft/month" value={form.rate} onChange={e => set('rate', e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Additional notes</label>
                      <textarea rows={3} placeholder="Access hours, loading dock, nearby facilities, photos available..." value={form.notes} onChange={e => set('notes', e.target.value)} className={inp + ' resize-none'} />
                    </div>
                  </div>
                </div>

                <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-4">Photos of space</h3>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                    {file ? (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>{file.name}</span>
                        <button type="button" onClick={e => {e.preventDefault(); setFile(null);}} className="text-red-500"><X size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <Upload size={20} className="text-slate-400 mb-1.5" />
                        <span className="text-sm text-slate-400">Upload photos of your space</span>
                        <span className="text-xs text-slate-300 mt-0.5">JPG · PNG — max 10MB</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept=".jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} />
                  </label>
                </div>

                <button type="submit" disabled={sending}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-base font-black rounded-xl transition-all shadow-lg">
                  {sending ? 'Submitting...' : <><Send size={18} /> Submit Application</>}
                </button>
                <p className="text-center text-xs text-slate-400">Applications are reviewed within 3 business days. We may visit your location before approval.</p>
              </form>
            </>
          )}
        </div>
      </section>
    </>
  );
}
