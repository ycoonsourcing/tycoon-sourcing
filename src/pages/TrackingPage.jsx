import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, CheckCircle, Clock, Truck, AlertCircle } from 'lucide-react';

const DEMO_ORDERS = {
  'TS-2026-001': {
    client: 'ABC Trading Pvt Ltd', product: 'Electronic accessories — 1000 units',
    orderValue: 'LKR 2,000,000', deposit: 'LKR 400,000', totalCBM: '5.0',
    status: 'In Warehouse', orderDate: '01 Apr 2026', arrivalDate: '06 Apr 2026',
    totalUnits: 1000, collected: 350, remaining: 650,
    paidToDate: 'LKR 844,000', outstanding: 'LKR 1,471,000',
    batches: [
      { num: 1, day: 'Day 5 (06 Apr)', units: 200, paid: 'LKR 422,000', status: 'Paid' },
      { num: 2, day: 'Day 10 (11 Apr)', units: 150, paid: 'LKR 336,000', status: 'Paid' },
      { num: 3, day: 'Day 15 (16 Apr)', units: 0, paid: '—', status: 'Pending' },
    ]
  },
  'TS-2026-002': {
    client: 'XYZ Distributors', product: 'Household goods — 500 units',
    orderValue: 'LKR 1,000,000', deposit: 'LKR 200,000', totalCBM: '3.2',
    status: 'Ordered', orderDate: '10 Apr 2026', arrivalDate: 'Est. 18 Apr 2026',
    totalUnits: 500, collected: 0, remaining: 500,
    paidToDate: 'LKR 1,000', outstanding: 'LKR 4,000+',
    batches: []
  },
};

const statusConfig = {
  'Ordered':             { icon: Clock,         color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', label: 'Order placed — awaiting delivery' },
  'In Warehouse':        { icon: Package,       color: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/30',  label: 'In warehouse — ready for collection' },
  'Partially Released':  { icon: Truck,         color: 'text-indigo-400',bg: 'bg-indigo-500/10 border-indigo-500/30', label: 'Partially collected' },
  'Completed':           { icon: CheckCircle,   color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', label: 'All units collected — deal closed' },
};

export default function TrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const search = () => {
    const id = orderId.trim().toUpperCase();
    if (DEMO_ORDERS[id]) { setResult(DEMO_ORDERS[id]); setNotFound(false); }
    else { setResult(null); setNotFound(true); }
  };

  const order = result;
  const sc = order ? statusConfig[order.status] || statusConfig['In Warehouse'] : null;
  const pct = order ? Math.round((order.collected / order.totalUnits) * 100) : 0;

  return (
    <>
      <Helmet>
        <title>Order Tracking — Tycoon Sourcing</title>
        <meta name="description" content="Track your Tycoon Sourcing order status, inventory balance, and payment history." />
      </Helmet>

      <section className="pt-32 pb-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <span className="inline-block text-xs font-bold tracking-widest text-blue-400 uppercase border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 rounded-full mb-6">Track order</span>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4">Order tracking</h1>
          <p className="text-xl text-gray-300 font-light mb-10">Enter your Tycoon order ID to see stock status, payment balance, and batch history.</p>

          <div className="flex gap-3">
            <input type="text" value={orderId} onChange={e => setOrderId(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="e.g. TS-2026-001" className="flex-1 px-5 py-4 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-base" />
            <button onClick={search} className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center gap-2">
              <Search size={18} /> Track
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3">Try demo IDs: <button onClick={() => { setOrderId('TS-2026-001'); }} className="text-blue-400 hover:underline">TS-2026-001</button> or <button onClick={() => { setOrderId('TS-2026-002'); }} className="text-blue-400 hover:underline">TS-2026-002</button></p>
        </div>
      </section>

      <section className="py-10 md:py-16 bg-slate-900 min-h-64">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatePresence mode="wait">
            {notFound && (
              <motion.div key="notfound" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-4 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
                <AlertCircle size={24} className="text-red-400 flex-shrink-0" />
                <div>
                  <div className="font-bold text-white">Order not found</div>
                  <div className="text-sm text-gray-400 mt-1">Please check your order ID and try again, or contact support.</div>
                </div>
              </motion.div>
            )}

            {order && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                {/* Header */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Order ID</div>
                      <div className="text-2xl font-black text-white">{orderId.toUpperCase()}</div>
                      <div className="text-gray-400 text-sm mt-1">{order.client}</div>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${sc.bg} ${sc.color}`}>
                      <sc.icon size={16} />
                      {order.status}
                    </div>
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Product', val: order.product.split('—')[0].trim() },
                    { label: 'Order value', val: order.orderValue },
                    { label: 'Order date', val: order.orderDate },
                    { label: 'Arrival date', val: order.arrivalDate },
                  ].map(m => (
                    <div key={m.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                      <div className="text-sm font-semibold text-white">{m.val}</div>
                    </div>
                  ))}
                </div>

                {/* Inventory progress */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-5">Inventory status</div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-400">Units collected: <strong className="text-white">{order.collected.toLocaleString()}</strong></span>
                    <span className="text-gray-400">Remaining: <strong className="text-white">{order.remaining.toLocaleString()}</strong></span>
                    <span className="text-gray-400">Total: <strong className="text-white">{order.totalUnits.toLocaleString()}</strong></span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: pct + '%' }} transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{pct}% collected</div>
                </div>

                {/* Payment */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-5">Payment balance</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 rounded-xl p-4">
                      <div className="text-xs text-gray-500 mb-1">Paid to date</div>
                      <div className="text-xl font-black text-green-400">{order.paidToDate}</div>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4">
                      <div className="text-xs text-gray-500 mb-1">Outstanding (est.)</div>
                      <div className="text-xl font-black text-amber-400">{order.outstanding}</div>
                    </div>
                  </div>
                </div>

                {/* Batch history */}
                {order.batches.length > 0 && (
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-5">Batch history</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-slate-700">
                          <th className="text-left pb-3 font-semibold">Batch</th>
                          <th className="text-left pb-3 font-semibold">Date</th>
                          <th className="text-right pb-3 font-semibold">Units</th>
                          <th className="text-right pb-3 font-semibold">Amount paid</th>
                          <th className="text-right pb-3 font-semibold">Status</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-700/40">
                          {order.batches.map(b => (
                            <tr key={b.num}>
                              <td className="py-3 text-gray-300">#{b.num}</td>
                              <td className="py-3 text-gray-400 text-xs">{b.day}</td>
                              <td className="py-3 text-right text-white">{b.units > 0 ? b.units : '—'}</td>
                              <td className="py-3 text-right text-white">{b.paid}</td>
                              <td className="py-3 text-right">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.status === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{b.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
