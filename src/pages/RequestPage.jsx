import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Send, CheckCircle, Upload, X, FileText, UserCheck, LogIn, Warehouse as WarehouseIcon, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SITE } from '@/content';
import { saveRequestWithDocuments, getUser, getMyProfile, getMyCredits, signOut, loadSupabase } from '@/lib/supabase';

const MODELS = [
  { val:'Model 1 — Trade & Warehouse Fulfilment',        label:'Model 1 — Trade & Warehouse Fulfilment' },
  { val:'Model 2 — Pure Procurement Service',            label:'Model 2 — Pure Procurement Service (1% fee)' },
  { val:'Model 3 — Import Procurement & Facilitation',   label:'Model 3 — Import Procurement & Facilitation' },
  { val:'Model 4 — Pre-Stocked Distribution',            label:'Model 4 — Pre-Stocked Distribution' },
  { val:'Model 5 — Consolidation & Group Shipping',      label:'Model 5 — Consolidation & Group Shipping' },
  { val:'Model 6 — Global Product Sourcing',             label:'Model 6 — Global Product Sourcing' },
];

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx';
const MAX_FILES = 5;
const MAX_SIZE_MB = 10;

const inp = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all text-sm';
const inpReadOnly = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm cursor-not-allowed';
const lbl = 'block text-sm font-semibold text-slate-700 mb-1.5';

function loadEmailJS(publicKey) {
  return new Promise((resolve) => {
    if (window.emailjs) { window.emailjs.init(publicKey); resolve(); return; }
    const s = document.createElement('script');
    s.id = 'emailjs-sdk';
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    s.onload = () => { window.emailjs.init(publicKey); resolve(); };
    document.head.appendChild(s);
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
}

export default function RequestPage() {
  const navigate = useNavigate();
  const [done, setDone]         = useState(false);
  const [sending, setSending]   = useState(false);
  const [errMsg, setErrMsg]     = useState('');
  const [profile, setProfile]   = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [credits, setCredits]   = useState({ total: 0, active: [] });
  const [files, setFiles]       = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [form, setForm] = useState({
    model:'', company:'', contact:'', email:'', phone:'',
    product:'', qty:'', price:'', supplier:'', notes:'',
    warehouse: '',
    useCredit: false,
  });

  useEffect(() => {
    (async () => {
      try {
        // Load warehouses from database
        const sb = await loadSupabase();
        const { data: whData } = await sb
          .from('warehouses')
          .select('*')
          .eq('active', true)
          .order('name');
        
        if (whData && whData.length > 0) {
          setWarehouses(whData);
          // Set first warehouse as default
          setForm(f => ({ ...f, warehouse: whData[0].id }));
        }

        // Load user profile
        const u = await getUser();
        if (u) {
          const [p, c] = await Promise.all([getMyProfile(), getMyCredits()]);
          if (p) {
            setProfile(p);
            setCredits(c);
            // Pre-fill form from profile
            setForm(f => ({
              ...f,
              company:  p.company   || '',
              contact:  p.full_name || '',
              email:    p.email     || '',
              phone:    p.phone     || '',
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load warehouses:', err);
        // Fallback to SITE.warehouses if DB fails
        const activeWH = SITE.warehouses.filter(w => w.active);
        setWarehouses(activeWH);
        if (activeWH.length > 0) {
          setForm(f => ({ ...f, warehouse: activeWH[0].id }));
        }
      }
      setLoadingAuth(false);
      loadEmailJS(SITE.emailjs_public_key);
    })();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isLoggedIn = !!profile;

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    const valid = [];
    const errors = [];
    for (const f of newFiles) {
      if (files.length + valid.length >= MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} files allowed`);
        break;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        errors.push(`${f.name} exceeds ${MAX_SIZE_MB}MB`);
        continue;
      }
      valid.push(f);
    }
    setFiles(prev => [...prev, ...valid]);
    if (errors.length) setErrMsg(errors.join('. '));
    else setErrMsg('');
    e.target.value = '';
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true); setErrMsg('');

    const requestData = {
      name:     form.contact,
      email:    form.email,
      phone:    form.phone,
      company:  form.company,
      model:    form.model,
      product:  form.product,
      quantity: form.qty,
      price:    form.price || null,
      supplier: form.supplier || null,
      notes:    [
        form.notes,
        isLoggedIn ? `(Submitted by verified client)` : '',
        form.warehouse ? `Preferred warehouse: ${warehouses.find(w => w.id === form.warehouse)?.name || 'Unknown'}` : '',
        form.useCredit && credits.total > 0 ? `Apply credits: LKR ${credits.total.toLocaleString()}` : '',
      ].filter(Boolean).join('\n'),
      client_id: isLoggedIn ? profile.id : null,
      status: 'new',
    };

    try {
      // Save request + upload documents to Supabase
      await saveRequestWithDocuments(requestData, files);

      // Send email via EmailJS (non-blocking — if email fails, request is still saved)
      try {
        await loadEmailJS(SITE.emailjs_public_key);
        const params = {
          to_email: SITE.email, from_name: form.contact, from_email: form.email, reply_to: form.email,
          company: form.company, phone: form.phone || 'Not provided',
          model: form.model, product: form.product, quantity: form.qty,
          price: form.price || 'Not specified', supplier: form.supplier || 'Not specified',
          notes: requestData.notes + (files.length > 0 ? `\n\nAttached files: ${files.length}` : ''),
        };
        await window.emailjs.send(SITE.emailjs_service_id, SITE.emailjs_template_request, params);
        if (SITE.emailjs_template_confirm) {
          try { await window.emailjs.send(SITE.emailjs_service_id, SITE.emailjs_template_confirm, { ...params, to_email: form.email }); } catch {}
        }
      } catch (e) { console.warn('EmailJS send failed, request saved to DB:', e); }

      setDone(true);
    } catch (err) {
      console.error('Request submission error:', err);
      const msg = err?.message || '';
      if (msg.includes('storage') || msg.includes('upload')) {
        setErrMsg('File upload failed. Please try without attachments, or use smaller files (max 5MB each).');
      } else if (msg.includes('auth') || msg.includes('JWT')) {
        setErrMsg('Session expired. Please refresh the page and try again.');
      } else {
        setErrMsg('Failed to submit. Please try again. If the problem persists, contact us via live chat.');
      }
    }
    setSending(false);
  };

  const reset = () => {
    setDone(false);
    setFiles([]);
    setErrMsg('');
    setForm({
      model:'', company: profile?.company || '', contact: profile?.full_name || '',
      email: profile?.email || '', phone: profile?.phone || '',
      product:'', qty:'', price:'', supplier:'', notes:'',
      warehouse: warehouses[0]?.id || '', useCredit: false,
    });
  };

  if (loadingAuth) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-6 pt-20">
      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-3xl font-black text-[#0a2342] mb-4">Request submitted!</h2>
        <p className="text-slate-500 text-lg mb-2">We'll review your request and respond within 48 hours.</p>
        {files.length > 0 && <p className="text-green-700 text-sm mb-2">{files.length} document{files.length!==1?'s':''} uploaded successfully</p>}
        <p className="text-slate-400 text-sm mb-8">Confirmation sent to <strong className="text-slate-700">{form.email}</strong></p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold">Submit another</button>
          {isLoggedIn ? (
            <button onClick={() => navigate('/portal')} className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-bold">Back to Portal</button>
          ) : (
            <a href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Hi, I just submitted a request.')}`}
              target="_blank" rel="noreferrer"
              className="px-6 py-3 bg-[#25D366] hover:bg-[#20b358] text-white rounded-xl font-bold text-center">Follow up on WhatsApp</a>
          )}
        </div>
      </motion.div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{isLoggedIn ? 'New Request' : 'Request a Product'} — Tycoon Sourcing</title>
      </Helmet>

      <section className="bg-[#0a2342] py-10 md:py-14 px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block text-xs font-bold tracking-widest text-blue-400 uppercase bg-blue-400/10 border border-blue-400/30 px-4 py-1.5 rounded-full mb-5">
            {isLoggedIn ? 'New request' : 'Get started'}
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
            {isLoggedIn ? 'Submit a new request' : 'Request a product'}
          </h1>
          <p className="text-blue-200 text-base md:text-lg font-light">
            {isLoggedIn ? 'Quick form — your details are auto-filled' : "Tell us what you need — we'll source, purchase, and warehouse it for you."}
          </p>
        </div>
      </section>

      <section className="py-10 md:py-12 bg-[#f8fafc]">
        <div className="max-w-2xl mx-auto px-4 md:px-6">

          {/* Logged-in banner */}
          {isLoggedIn && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
              <UserCheck size={20} className="text-green-700 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#0a2342]">Submitting as {profile.company || profile.full_name}</div>
                <div className="text-xs text-slate-600 truncate">{profile.email}</div>
              </div>
              <button type="button" onClick={async () => { await signOut(); window.location.reload(); }}
                className="flex-shrink-0 text-xs font-semibold text-slate-600 hover:text-red-600 underline">Sign out</button>
            </div>
          )}

          {/* Not logged in CTA */}
          {!isLoggedIn && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
              <LogIn size={18} className="text-blue-700 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#0a2342]">Already have an account?</div>
                <div className="text-xs text-slate-600">Sign in to auto-fill your details and track this request in your portal.</div>
              </div>
              <button type="button" onClick={() => navigate('/portal')}
                className="flex-shrink-0 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg">Sign in</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Service model */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-5">Select service</h3>
              <div>
                <label className={lbl}>Which service are you interested in? <span className="text-blue-700">*</span></label>
                <select required value={form.model} onChange={e => set('model', e.target.value)} className={inp + ' cursor-pointer'}>
                  <option value="">Select a service model...</option>
                  {MODELS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>
              </div>
            </div>

            {/* Your details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest">Your details</h3>
                {isLoggedIn && <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Auto-filled</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label:'Company name',    key:'company', type:'text',  req:true,  ph:'ABC Trading Pvt Ltd' },
                  { label:'Contact person',  key:'contact', type:'text',  req:true,  ph:'Full name' },
                  { label:'Email address',   key:'email',   type:'email', req:true,  ph:'you@company.com' },
                  { label:'WhatsApp / phone',key:'phone',   type:'tel',   req:false, ph:'+94 77 xxx xxxx' },
                ].map(f => (
                  <div key={f.key}>
                    <label className={lbl}>{f.label}{f.req && <span className="text-blue-700 ml-1">*</span>}</label>
                    <input type={f.type} required={f.req} placeholder={f.ph} value={form[f.key]}
                      onChange={e => set(f.key, e.target.value)}
                      readOnly={isLoggedIn && f.key !== 'phone'}
                      className={isLoggedIn && f.key !== 'phone' ? inpReadOnly : inp} />
                  </div>
                ))}
              </div>
              {isLoggedIn && (
                <p className="text-xs text-slate-400 mt-3">To update your company name or email, edit your profile in <button type="button" onClick={() => navigate('/portal')} className="text-blue-700 font-semibold hover:underline">My Account</button>.</p>
              )}
            </div>

            {/* Product details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-5">Product details</h3>
              <div className="space-y-4">
                <div>
                  <label className={lbl}>Product description <span className="text-blue-700">*</span></label>
                  <textarea required rows={3} placeholder="Describe the product — type, specifications, brand, use case..." value={form.product} onChange={e => set('product', e.target.value)} className={inp + ' resize-none'} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Quantity <span className="text-blue-700">*</span></label>
                    <input type="text" required placeholder="e.g. 1,000 units" value={form.qty} onChange={e => set('qty', e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Target price per unit</label>
                    <input type="text" placeholder="e.g. LKR 2,000 per unit" value={form.price} onChange={e => set('price', e.target.value)} className={inp} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Preferred supplier <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input type="text" placeholder="Supplier name, website, or country" value={form.supplier} onChange={e => set('supplier', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Additional notes</label>
                  <textarea rows={3} placeholder="Timeline, certifications, delivery address..." value={form.notes} onChange={e => set('notes', e.target.value)} className={inp + ' resize-none'} />
                </div>
              </div>
            </div>

            {/* Advanced options — LOGGED IN ONLY */}
            {isLoggedIn && (
              <div className="bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200 rounded-2xl p-5 md:p-6 shadow-sm">
                <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <span className="bg-blue-700 text-white text-[9px] px-2 py-0.5 rounded-full">Verified Client</span>
                  Advanced options
                </h3>
                <div className="space-y-4">
                  {/* Warehouse selector */}
                  <div>
                    <label className={lbl}><WarehouseIcon size={14} className="inline mr-1" /> Preferred warehouse</label>
                    <select value={form.warehouse} onChange={e => set('warehouse', e.target.value)} className={inp + ' cursor-pointer'}>
                      <option value="">Select warehouse...</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} — {w.location} (LKR {w.cbm_rate}/CBM/day)</option>)}
                    </select>
                  </div>
                  {/* Credits */}
                  {credits.total > 0 && (
                    <div className="bg-green-50 border border-green-300 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Gift size={18} className="text-green-700" />
                        <div className="flex-1">
                          <div className="text-sm font-bold text-green-900">You have LKR {credits.total.toLocaleString()} in deposit credits</div>
                          <div className="text-xs text-green-700">Apply to reduce the deposit on this order (floor: {SITE.m1_deposit_floor}% cash deposit always required)</div>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer mt-2">
                        <input type="checkbox" checked={form.useCredit} onChange={e => set('useCredit', e.target.checked)} className="w-4 h-4 accent-green-600" />
                        <span className="text-sm font-semibold text-green-900">Apply available credits on deposit</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DOCUMENT UPLOAD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-4">
                Supporting documents <span className="text-slate-400 normal-case font-normal text-[10px] ml-1">(optional · max {MAX_FILES} files · max {MAX_SIZE_MB}MB each)</span>
              </h3>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                <Upload size={20} className="text-slate-400 mb-1.5" />
                <span className="text-sm text-slate-500 font-semibold">Click to upload or drag files here</span>
                <span className="text-[10px] text-slate-400 mt-0.5">PDF · JPG · PNG · DOC · XLS</span>
                <input type="file" multiple accept={ACCEPT} className="hidden" onChange={handleFiles} />
              </label>
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <FileText size={14} className="text-blue-700 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">{f.name}</div>
                        <div className="text-[10px] text-slate-400">{formatBytes(f.size)}</div>
                      </div>
                      <button type="button" onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-600 flex-shrink-0"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {errMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{errMsg}</div>
            )}

            <button type="submit" disabled={sending}
              className="w-full flex items-center justify-center gap-3 py-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-lg font-black rounded-xl transition-all shadow-lg">
              {sending ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : <><Send size={20} /> Submit request</>}
            </button>

            <p className="text-center text-xs text-slate-400">
              By submitting, you acknowledge this is a buy-and-sell arrangement. A {SITE.m1_deposit_pct}% reservation deposit is required to activate a deal.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
