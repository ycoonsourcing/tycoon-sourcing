import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Trash2, RefreshCw, Lock } from 'lucide-react';
import { SITE } from '@/content';
import { useCurrency } from '@/lib/CurrencyContext';
import { getWarehouses } from '@/lib/supabase';

function getP(orderVal,totalUnits,totalCBM,depPct,handPct,cbmRate,svcPct) {
  const tc=orderVal*(1-depPct/100), cpu=totalCBM/totalUnits;
  return { orderVal,totalUnits,totalCBM,depPct,handPct,cbmRate,svcPct,tc,cpu,
    bpu:orderVal/totalUnits, hpu:(orderVal*handPct/100)/totalUnits,
    stpu:cpu*cbmRate, svpu:(tc*svcPct/100)/30/totalUnits };
}
function B(u,d,p) {
  const bc=u*p.bpu,h=u*p.hpu,st=u*p.stpu*d,sv=u*p.svpu*d;
  return {bc,h,st,sv,tot:bc+h+st+sv,cbm:u*p.cpu};
}

// Editable: slider + number input in sync
function EditableField({ label, value, min, max, step, onChange, display, prefix='' }) {
  const pct = ((value-min)/(max-min))*100;
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className="text-xs font-black text-blue-700">{display}</span>
      </div>
      <div className="flex gap-2 items-center">
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)}
          className="flex-1" style={{background:`linear-gradient(to right,#1565c0 ${pct}%,#e2e8f0 0%)`}} />
        <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
          {prefix && <span className="text-[10px] text-slate-400 px-2 font-semibold">{prefix}</span>}
          <input type="number" min={min} max={max} step={step} value={value}
            onChange={e => onChange(Math.min(max, Math.max(min, +e.target.value || min)))}
            className="w-20 px-2 py-1.5 text-xs text-slate-800 focus:outline-none text-right border-0" />
        </div>
      </div>
    </div>
  );
}

// Locked: display only, no editing
function LockedField({ label, value, sublabel }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-1.5 items-center">
        <div className="flex items-center gap-1.5">
          <Lock size={10} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">{label}</span>
        </div>
        <span className="text-xs font-black text-slate-700">{value}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full"><div className="h-full bg-slate-400 rounded-full" style={{width:'100%'}} /></div>
      <div className="text-[10px] text-slate-400 mt-1 italic">{sublabel}</div>
    </div>
  );
}

function MetCard({label,value,color='text-slate-800'}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
      <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">{label}</div>
      <div className={`text-sm font-black ${color}`}>{value}</div>
    </div>
  );
}

export default function CalculatorPage() {
  const {fmt} = useCurrency();
  const [warehouses, setWarehouses] = useState(SITE.warehouses || []);
  const activeWH = warehouses.filter(w => w.active);
  const [selWH, setSelWH] = useState(activeWH[0]?.id || SITE.warehouses[0]?.id || '');
  const [orderVal, setOrderVal]   = useState(500000);   // LKR directly
  const [totalUnits,setTotalUnits]= useState(50000);
  const [totalCBM, setTotalCBM]   = useState(1);
  const [depPct,   setDepPct]     = useState(SITE.m1_deposit_pct);
  const [pickups,  setPickups]    = useState([]);
  const [newDay,   setNewDay]     = useState(15);
  const [newUnits, setNewUnits]   = useState(10000);
  const [errMsg,   setErrMsg]     = useState('');
  const [nextId,   setNextId]     = useState(1);
  const chartRef=useRef(null); const ciRef=useRef(null);

  // Load warehouses from DB
  useEffect(() => {
    getWarehouses().then(w => {
      if (w && w.length > 0) {
        setWarehouses(w);
        const actives = w.filter(x => x.active);
        if (!selWH && actives[0]) setSelWH(actives[0].id);
      }
    });
  }, []);

  // Locked values — can't be changed by client
  const handPct  = SITE.m1_handling_pct;   // 3%
  const svcPct   = SITE.m1_service_fee_pct; // 4%
  const cbmRate  = warehouses.find(w => w.id === selWH)?.cbm_rate || 140;

  // Calculator uses LKR directly (since site is LKR only)
  // But p helpers expect raw numbers — we work in LKR
  const p = getP(orderVal, totalUnits, totalCBM, depPct, handPct, cbmRate, svcPct);
  const sorted = [...pickups].sort((a,b) => a.day-b.day || a.id-b.id);

  let tp=0, tf=0, tc2=0, tst=0, tsv=0;
  sorted.forEach(r => { const b=B(r.units,r.day,p); tp+=b.tot; tf+=b.h+b.st+b.sv; tc2+=r.units; tst+=b.st; tsv+=b.sv; });
  const d9st = p.totalCBM*p.cbmRate*90;
  const d9sv = (p.tc*p.svcPct/100/30)*90;
  const d9tot = p.orderVal + (p.orderVal*p.handPct/100) + d9st + d9sv;
  const sav = Math.max(0, d9tot - tp);

  // Format in LKR directly (no currency conversion)
  const fmtLKR = (v, dp=0) => `LKR ${v.toLocaleString('en', {minimumFractionDigits:dp, maximumFractionDigits:dp})}`;

  useEffect(() => {
    if (!chartRef.current || !window.Chart) return;
    const labels=['Day 0'],cd=[0],std=[0]; let c2=0,s2=0;
    sorted.forEach(r => { const b=B(r.units,r.day,p); c2+=b.tot; s2+=b.st; labels.push('Day '+r.day); cd.push(+c2.toFixed(2)); std.push(+s2.toFixed(2)); });
    const bd=labels.map(()=>+p.orderVal.toFixed(2)), d9d=labels.map(()=>+d9tot.toFixed(2));
    if (ciRef.current) { ciRef.current.destroy(); ciRef.current=null; }
    ciRef.current = new window.Chart(chartRef.current, { type:'line',
      data:{ labels, datasets:[
        {data:cd, borderColor:'#1565c0', backgroundColor:'rgba(21,101,192,0.06)', fill:true, tension:0.3, pointRadius:3, pointBackgroundColor:'#1565c0', borderWidth:2.5, label:'Cumulative cost'},
        {data:std, borderColor:'#0288d1', fill:false, tension:0.3, pointRadius:0, borderWidth:1.5, borderDash:[4,3], label:'Storage'},
        {data:bd, borderColor:'#94a3b8', fill:false, tension:0, pointRadius:0, borderWidth:1.5, borderDash:[5,4], label:'Base'},
        {data:d9d, borderColor:'#ef4444', fill:false, tension:0, pointRadius:0, borderWidth:1.5, borderDash:[2,3], label:'Day-90 lump'},
      ]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}, tooltip:{backgroundColor:'#0a2342', titleColor:'#93c5fd', bodyColor:'#e2e8f0', borderWidth:1, callbacks:{label:ctx=>'  '+fmtLKR(ctx.parsed.y)}}},
        scales:{ x:{ticks:{color:'#64748b', font:{size:10}, maxTicksLimit:10}, grid:{color:'rgba(0,0,0,0.04)'}},
                 y:{ticks:{color:'#64748b', font:{size:10}, callback:v=>fmtLKR(v)}, grid:{color:'rgba(0,0,0,0.04)'}} }}
    });
    return () => { if (ciRef.current) { ciRef.current.destroy(); ciRef.current=null; } };
  });

  useEffect(() => {
    if (!document.getElementById('chartjs-cdn')) {
      const s = document.createElement('script'); s.id='chartjs-cdn';
      s.src='https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
      document.head.appendChild(s);
    }
  }, []);

  function addRow() {
    const day = parseInt(newDay), units = parseInt(newUnits);
    if (!day || day < 1) { setErrMsg('Please enter a valid day.'); return; }
    if (!units || units < 1) { setErrMsg('Please enter valid units.'); return; }
    const used = pickups.reduce((s,r) => s+r.units, 0);
    if (used + units > p.totalUnits) { setErrMsg(`Only ${(p.totalUnits-used).toLocaleString()} units remaining.`); return; }
    setErrMsg('');
    setPickups(prev => [...prev, { id:nextId, day, units }]);
    setNextId(n => n+1); setNewDay(d => d+15);
  }
  function delRow(id) { setPickups(p => p.filter(r => r.id !== id)); setErrMsg(''); }
  function clearAll() { setPickups([]); setNextId(1); setErrMsg(''); }
  function loadDefault() { clearAll(); const per=Math.round(p.totalUnits/5); const rows=[]; for(let i=0;i<5;i++) rows.push({id:i+1, day:15+i*15, units:per}); setPickups(rows); setNextId(6); }

  const NI = 'w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-blue-500';
  const BTN = 'px-3 py-2 text-xs font-bold rounded-lg border transition-all';

  return (
    <>
      <Helmet><title>Inventory Calculator — Tycoon Sourcing</title></Helmet>

      <section className="bg-[#0a2342] py-10 md:py-14 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-bold tracking-widest text-blue-400 uppercase bg-blue-400/10 border border-blue-400/30 px-4 py-1.5 rounded-full mb-4">Calculator</span>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3">Inventory cost calculator</h1>
          <p className="text-blue-200 text-sm md:text-base">Plan your pickup schedule. All amounts in LKR.</p>
        </div>
      </section>

      <section className="py-8 bg-[#f8fafc] pb-16">
        <div className="max-w-7xl mx-auto px-3 md:px-4">

          {/* Warehouse selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 mb-5 shadow-sm">
            <div className="text-xs font-black text-blue-700 uppercase tracking-widest mb-4">Select warehouse location</div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {warehouses.map(w => (
                <button key={w.id} onClick={() => w.active && setSelWH(w.id)} disabled={!w.active}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl border-2 text-xs md:text-sm font-semibold transition-all ${
                    !w.active ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                    : selWH === w.id ? 'border-blue-700 bg-blue-700 text-white shadow-md'
                    : 'border-slate-200 text-slate-700 hover:border-blue-400 bg-white'
                  }`}>
                  <span>📍</span><span>{w.name}</span>
                  {w.active
                    ? <span className={`text-[10px] md:text-xs font-mono px-1.5 py-0.5 rounded-full ${selWH===w.id?'bg-white/20 text-white':'bg-slate-100 text-slate-500'}`}>LKR {w.cbm_rate}/CBM/day</span>
                    : <span className="text-[10px] text-slate-300">Soon</span>
                  }
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5 items-start">
            {/* LEFT: Deal terms */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-black text-blue-700 uppercase tracking-widest mb-4 pb-3 border-b border-slate-100">Deal terms</div>

                {/* EDITABLE */}
                <EditableField label="Order value" value={orderVal} min={50000} max={2000000} step={10000}
                  onChange={setOrderVal} display={`LKR ${orderVal.toLocaleString()}`} prefix="LKR" />
                <EditableField label="Total units" value={totalUnits} min={100} max={100000} step={100}
                  onChange={setTotalUnits} display={totalUnits.toLocaleString()} />
                <EditableField label="Total CBM" value={totalCBM} min={0.1} max={50} step={0.1}
                  onChange={setTotalCBM} display={`${totalCBM.toFixed(1)} CBM`} />
                <EditableField label="Deposit %" value={depPct} min={10} max={40} step={5}
                  onChange={setDepPct} display={`${depPct}%`} />

                <hr className="border-slate-100 my-4" />

                {/* LOCKED */}
                <LockedField label="Handling fee %" value={`${handPct}%`} sublabel="Set by Tycoon Sourcing" />
                <LockedField label="Storage rate" value={`LKR ${cbmRate}/CBM/day`} sublabel="Set by selected warehouse" />
                <LockedField label="Service fee %/mo" value={`${svcPct}%`} sublabel="Set by Tycoon Sourcing" />
              </div>

              {/* Unit rates */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-black text-blue-700 uppercase tracking-widest mb-4">Unit rates (LKR)</div>
                <div className="grid grid-cols-2 gap-2">
                  <MetCard label="Base / unit"      value={fmtLKR(p.bpu,4)}   color="text-blue-800" />
                  <MetCard label="Handling / unit"  value={fmtLKR(p.hpu,4)}   color="text-blue-800" />
                  <MetCard label="Storage/unit/day" value={fmtLKR(p.stpu,6)}  color="text-cyan-700" />
                  <MetCard label="Service/unit/day" value={fmtLKR(p.svpu,6)}  color="text-cyan-700" />
                </div>
              </div>
            </div>

            {/* RIGHT: Schedule + Summary + Chart */}
            <div className="space-y-4">
              {/* SCHEDULE TABLE */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
                <div className="text-xs font-black text-blue-700 uppercase tracking-widest mb-4 pb-3 border-b border-slate-100">Pickup schedule</div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs min-w-[700px]">
                    <thead>
                      <tr className="bg-[#0a2342] text-white">
                        {['#','Day','Units','CBM','Base','Handling','Storage','Service','Batch','Cumulative','Left',''].map((h,i) => (
                          <th key={i} className={`px-2.5 py-3 font-bold whitespace-nowrap ${i===0?'text-left':'text-right'}`} style={{fontSize:'10px'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.length===0 ? (
                        <tr><td colSpan={12} className="text-center py-10 text-slate-400">No pickups yet — add batches below</td></tr>
                      ) : (() => { let cum=0,used=0; return sorted.map((row,i) => {
                        const b=B(row.units,row.day,p); cum+=b.tot; used+=row.units;
                        const left=p.totalUnits-used;
                        return (
                          <tr key={row.id} className={`border-b border-slate-100 ${i%2===0?'bg-white':'bg-slate-50/50'} hover:bg-blue-50`}>
                            <td className="px-2.5 py-2.5 text-slate-500 font-semibold">{i+1}</td>
                            <td className="px-2.5 py-2.5 text-right font-semibold text-slate-700">{row.day}</td>
                            <td className="px-2.5 py-2.5 text-right font-semibold text-slate-700">{row.units.toLocaleString()}</td>
                            <td className="px-2.5 py-2.5 text-right text-slate-600">{b.cbm.toFixed(3)}</td>
                            <td className="px-2.5 py-2.5 text-right font-semibold text-slate-700">{fmtLKR(b.bc)}</td>
                            <td className="px-2.5 py-2.5 text-right text-slate-600">{fmtLKR(b.h)}</td>
                            <td className="px-2.5 py-2.5 text-right font-semibold text-blue-700">{fmtLKR(b.st)}</td>
                            <td className="px-2.5 py-2.5 text-right font-semibold text-blue-700">{fmtLKR(b.sv)}</td>
                            <td className="px-2.5 py-2.5 text-right font-black text-[#0a2342]">{fmtLKR(b.tot)}</td>
                            <td className="px-2.5 py-2.5 text-right text-slate-600">{fmtLKR(cum)}</td>
                            <td className="px-2.5 py-2.5 text-right font-bold text-slate-700">{Math.max(0,left).toLocaleString()}{left===0&&' ✓'}</td>
                            <td className="px-2.5 py-2.5"><button onClick={()=>delRow(row.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={12} /></button></td>
                          </tr>
                        );
                      }); })()}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap gap-2 items-center mt-4">
                  <span className="text-xs text-slate-500 font-semibold">Add:</span>
                  <input type="number" value={newDay} min={1} max={180} onChange={e=>setNewDay(+e.target.value)} placeholder="Day" className={NI} />
                  <input type="number" value={newUnits} min={1} onChange={e=>setNewUnits(+e.target.value)} placeholder="Units" className={NI} />
                  <button onClick={addRow} className={`${BTN} bg-blue-700 hover:bg-blue-800 text-white border-blue-700 flex items-center gap-1.5`}><Plus size={13} />Add</button>
                  <button onClick={loadDefault} className={`${BTN} border-slate-200 text-slate-600 hover:border-blue-400 bg-white flex items-center gap-1.5`}><RefreshCw size={12} />Default</button>
                  <button onClick={clearAll} className={`${BTN} border-slate-200 text-slate-400 bg-white`}>Clear</button>
                </div>
                {errMsg && <p className="text-red-600 text-xs mt-2 font-semibold">{errMsg}</p>}
              </div>

              {/* SUMMARY */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-black text-blue-700 uppercase tracking-widest mb-4 pb-3 border-b border-slate-100">Deal summary (LKR)</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetCard label="Deposit upfront"        value={fmtLKR(p.orderVal*p.depPct/100)} color="text-amber-700" />
                  <MetCard label="Total to pay"           value={fmtLKR(tp)}                      color="text-amber-700" />
                  <MetCard label="Total fees"             value={fmtLKR(tf)}                      color="text-red-600" />
                  <MetCard label="Effective unit price"   value={tc2>0 ? fmtLKR(tp/tc2,2) : '—'} />
                  <MetCard label="CBM storage paid"       value={fmtLKR(tst)}                     color="text-blue-700" />
                  <MetCard label="Service fee paid"       value={fmtLKR(tsv)}                     color="text-blue-700" />
                  <MetCard label="Cost premium"           value={p.orderVal>0 ? ((tf/p.orderVal)*100).toFixed(2)+'%' : '—'} color="text-red-600" />
                  <MetCard label="Savings vs day-90"      value={fmtLKR(sav)}                     color="text-green-700" />
                </div>
              </div>

              {/* CHART */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-black text-blue-700 uppercase tracking-widest mb-3">Payment curve</div>
                <div className="flex flex-wrap gap-3 mb-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-blue-700 inline-block rounded"></span>Total</span>
                  <span className="flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-dashed border-cyan-500 inline-block"></span>Storage</span>
                  <span className="flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-dashed border-slate-400 inline-block"></span>Base</span>
                  <span className="flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-dotted border-red-500 inline-block"></span>Day-90 lump</span>
                </div>
                <div className="relative h-52"><canvas ref={chartRef} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
