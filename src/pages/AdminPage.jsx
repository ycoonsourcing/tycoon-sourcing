import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Package, Users, FileText, Plus, CheckCircle, LogOut, Menu, LogIn, Gift, Warehouse, Eye, ArrowRight, Edit2, Trash2, Send, ArrowRightLeft, TrendingUp, DollarSign, AlertTriangle, Search, X, Bell, BarChart3 } from 'lucide-react';
import { SITE } from '@/content';
import { loadSupabase, signIn, signOut, getUser, getMyProfile, sendClientEmail } from '@/lib/supabase';
import { sendWithdrawalApprovedEmail } from '@/lib/emailService'; // ✅ Send withdrawal approval emails
import DealFormModal from '@/components/DealFormModal';
import DealDetailModal from '@/components/DealDetailModal';
import CreditAwardModal from '@/components/CreditAwardModal';
import ClientEditModal from '@/components/ClientEditModal';
import WarehouseFormModal from '@/components/WarehouseFormModal';
import FinancialDashboard from '@/components/FinancialDashboard'; // PHASE 6

const STATUS = {
  active:    { label:'Active',    color:'text-blue-600',  bg:'bg-blue-50 border-blue-200' },
  pending:   { label:'Pending',   color:'text-amber-600', bg:'bg-amber-50 border-amber-200' },
  ordered:   { label:'Ordered',   color:'text-amber-600', bg:'bg-amber-50 border-amber-200' },
  completed: { label:'Completed', color:'text-green-600', bg:'bg-green-50 border-green-200' },
  cancelled: { label:'Cancelled', color:'text-slate-500', bg:'bg-slate-50 border-slate-200' },
  new:       { label:'New',       color:'text-blue-600',  bg:'bg-blue-50 border-blue-200' },
  contacted: { label:'Contacted', color:'text-purple-600',bg:'bg-purple-50 border-purple-200' },
  verified:  { label:'Verified',  color:'text-green-600', bg:'bg-green-50 border-green-200' },
  suspended: { label:'Suspended', color:'text-red-600',   bg:'bg-red-50 border-red-200' },
};

export default function AdminPage() {
  const [loading,   setLoading]   = useState(true);
  const [authed,    setAuthed]    = useState(false);
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [email,     setEmail]     = useState('');
  const [pass,      setPass]      = useState('');
  const [errMsg,    setErrMsg]    = useState('');
  const [busy,      setBusy]      = useState(false);
  const [tab,       setTab]       = useState('overview');
  const [sideOpen,  setSideOpen]  = useState(false);
  const [clients,   setClients]   = useState([]);
  const [deals,     setDeals]     = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [credits,   setCredits]   = useState([]);
  const [dealModal, setDealModal] = useState({ open: false, mode: 'create', deal: null, sourceRequest: null });
  const [detailModal, setDetailModal] = useState({ open: false, deal: null });
  const [creditModal, setCreditModal] = useState({ open: false, client: null });
  const [clientEditModal, setClientEditModal] = useState({ open: false, client: null });
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseModal, setWarehouseModal] = useState({ open: false, mode: 'create', warehouse: null });
  const [withdrawals, setWithdrawals] = useState([]);
  const [search, setSearch] = useState('');
  const [dealFilter, setDealFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const user = await getUser();
        if (user) {
          const profile = await getMyProfile();
          if (profile?.is_admin) {
            setAuthed(true);
            setIsAdmin(true);
            await loadAdminData();
          } else if (profile) {
            setErrMsg('Your account is not an admin. Only admins can access this page.');
            await signOut();
          }
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const loadAdminData = async () => {
    const sb = await loadSupabase();
    const [c, d, r, cr, wh, wd] = await Promise.all([
      sb.from('profiles').select('*').order('created_at', { ascending:false }),
      sb.from('deals').select('*, profiles(full_name, company, email)').order('created_at', { ascending:false }),
      sb.from('requests').select('*, request_documents(id, file_name, file_url, file_size, file_type)').order('created_at', { ascending:false }),
      sb.from('credits').select('*, profiles!credits_client_id_fkey(full_name, company)').order('earned_at', { ascending:false }),
      sb.from('warehouses').select('*').order('active', { ascending:false }),
      sb.from('withdrawals').select('*, profiles!withdrawals_client_id_fkey(full_name, company), deals(deal_code, product)').order('created_at', { ascending:false }),
    ]);
    setClients(c.data || []);
    setDeals(d.data || []);
    setRequests(r.data || []);
    setCredits(cr.data || []);
    setWarehouses(wh.data || []);
    setWithdrawals(wd.data || []);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true); setErrMsg('');
    try {
      const { error } = await signIn(email, pass);
      if (error) throw error;
      const profile = await getMyProfile();
      if (!profile?.is_admin) {
        await signOut();
        setErrMsg('Your account is not an admin.');
      } else {
        setAuthed(true);
        setIsAdmin(true);
        await loadAdminData();
      }
    } catch (err) { setErrMsg(err.message || 'Login failed'); }
    setBusy(false);
  };

  const handleLogout = async () => {
    await signOut();
    setAuthed(false);
    setIsAdmin(false);
  };

  const approveClient = async (clientId) => {
    const sb = await loadSupabase();
    await sb.from('profiles').update({ status:'verified' }).eq('id', clientId);
    await loadAdminData();
  };

  const completeDeal = async (deal) => {
    const sb = await loadSupabase();
    // Mark deal complete
    await sb.from('deals').update({ status:'completed', completed_at: new Date().toISOString() }).eq('id', deal.id);
    // Award credit = 5% of order value
    const creditAmt = (+deal.order_value_lkr) * (SITE.rewards_credit_pct / 100);
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + SITE.rewards_expiry_months);
    await sb.from('credits').insert({
      client_id: deal.client_id,
      deal_id: deal.id,
      amount_earned: creditAmt,
      balance: creditAmt,
      expires_at: expiresAt.toISOString(),
      status: 'active',
      notes: `Credit from deal ${deal.deal_code}`
    });
    // Create notification
    await sb.from('notifications').insert({
      client_id: deal.client_id,
      type: 'success',
      message: `Deal ${deal.deal_code} completed. You earned LKR ${creditAmt.toLocaleString()} in deposit credits!`
    });
    await loadAdminData();
  };

  const updateRequestStatus = async (reqId, status) => {
    const sb = await loadSupabase();
    await sb.from('requests').update({ status }).eq('id', reqId);
    await loadAdminData();
  };

  const updateWithdrawal = async (w, newStatus) => {
    const sb = await loadSupabase();
    const me = await getUser();
    const updates = { status: newStatus };
    if (newStatus === 'approved') { 
      updates.approved_at = new Date().toISOString(); 
      updates.approved_by = me?.id;
      // ✅ Track email sent status
      updates.email_sent = true;
      updates.email_sent_at = new Date().toISOString();
    }
    if (newStatus === 'collected') { updates.collected_at = new Date().toISOString(); }
    await sb.from('withdrawals').update(updates).eq('id', w.id);
    
    // Notify client - Create in-app notification
    const msgMap = {
      approved:  `Your withdrawal request for ${w.deals?.deal_code} has been approved. Please coordinate pickup via WhatsApp.`,
      ready:     `Your stock for ${w.deals?.deal_code} is ready for collection at our warehouse.`,
      collected: `Stock collected for ${w.deals?.deal_code}. Thank you!`,
      rejected:  `Your withdrawal request for ${w.deals?.deal_code} was not approved. Please contact us for details.`,
    };
    if (msgMap[newStatus]) {
      await sb.from('notifications').insert({
        client_id: w.client_id,
        type: newStatus === 'rejected' ? 'warning' : 'info',
        message: msgMap[newStatus],
      });
    }
    
    // ✅ SEND EMAIL TO CLIENT ON APPROVAL
    if (newStatus === 'approved') {
      try {
        const { data: clientData } = await sb
          .from('profiles')
          .select('email, full_name')
          .eq('id', w.client_id)
          .single();
        
        if (clientData?.email) {
          console.log('📧 Sending withdrawal approved email to:', clientData.email);
          await sendWithdrawalApprovedEmail(
            clientData.email,
            clientData.full_name || 'Client',
            w.amount,
            w.id // Reference ID
          );
          console.log('✅ Withdrawal approved email sent');
        } else {
          console.warn('⚠️ Client email not found');
        }
      } catch (emailErr) {
        console.warn('⚠️ Email send failed (approval not blocked):', emailErr);
        // Don't fail the approval if email fails - client still got notification
      }
    }
    
    await loadAdminData();
  };

  const sendDealReminder = async (deal) => {
    const daysLeft = deal.expires_at ? Math.ceil((new Date(deal.expires_at) - new Date()) / (1000*60*60*24)) : 0;
    const subject = daysLeft <= 0 ? 'Deal window expired' : `${daysLeft} days left to collect`;
    const notes = daysLeft <= 0
      ? `Your collection window for ${deal.deal_code} has expired. Please contact us urgently to arrange pickup or storage extension.`
      : `This is a reminder that you have ${daysLeft} days left to collect your stock for deal ${deal.deal_code}. Please schedule pickup soon to avoid any issues.`;
    const { ok, reason } = await sendClientEmail({
      clientId: deal.client_id, subject, dealCode: deal.deal_code,
      model: deal.notes?.split('\n')[0] || '', product: deal.product,
      quantity: `${deal.total_units} units (${deal.collected_units || 0} collected)`,
      price: `LKR ${(+deal.order_value_lkr).toLocaleString()}`,
      notes,
    });
    const sb = await loadSupabase();
    await sb.from('notifications').insert({
      client_id: deal.client_id,
      type: daysLeft <= 0 ? 'warning' : 'info',
      message: notes,
    });
    alert(ok ? `Reminder sent to client for ${deal.deal_code}.` : `Reminder saved as notification but email failed (${reason}).`);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
    </div>
  );

  // ============ LOGIN ============
  if (!authed || !isAdmin) return (
    <>
      <Helmet><title>Admin — Tycoon Sourcing</title></Helmet>
      <div className="min-h-screen bg-[#060e1a] flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-blue-300 hover:text-white mb-6">
            <ArrowRight size={14} className="rotate-180" /> Back to website
          </button>
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><span className="text-white font-black text-2xl">T</span></div>
            <h1 className="text-2xl font-black text-white">Admin Portal</h1>
            <p className="text-blue-300 text-sm mt-1">Tycoon Sourcing — Internal Access</p>
          </div>
          <form onSubmit={handleLogin} className="bg-[#111f33] border border-white/10 rounded-2xl p-7 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@tycoonsourcing.com" className="w-full px-4 py-3 bg-[#0a1929] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-1.5">Password</label>
              <input type="password" required value={pass} onChange={e => setPass(e.target.value)} className="w-full px-4 py-3 bg-[#0a1929] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
            </div>
            {errMsg && <p className="text-red-400 text-sm">{errMsg}</p>}
            <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all">
              {busy ? 'Signing in...' : <><LogIn size={16} /> Sign in</>}
            </button>
            <p className="text-center text-xs text-slate-500 pt-2">Access restricted to admins. Clients use the <button type="button" onClick={() => navigate('/portal')} className="text-blue-400 hover:underline">Client Portal</button>.</p>
          </form>
        </div>
      </div>
    </>
  );

  // ============ ADMIN DASHBOARD ============
  const pendingClients = clients.filter(c => c.status === 'pending');
  const activeDeals    = deals.filter(d => d.status === 'active' || d.status === 'ordered');
  const newRequests    = requests.filter(r => r.status === 'new');
  const totalCredits   = credits.filter(c => c.status === 'active').reduce((s,c) => s + (+c.balance||0), 0);

  const SIDEBAR = [
    { id:'overview',    icon:Home,          label:'Overview' },
    { id:'clients',     icon:Users,         label:'Clients',  badge: pendingClients.length || null },
    { id:'deals',       icon:Package,       label:'Deals' },
    { id:'requests',    icon:FileText,      label:'Requests', badge: newRequests.length || null },
    { id:'withdrawals', icon:ArrowRightLeft, label:'Withdrawals', badge: withdrawals.filter(w => w.status === 'requested').length || null },
    { id:'warehouses',  icon:Warehouse,     label:'Warehouses' },
    { id:'credits',     icon:Gift,          label:'Rewards' },
    { id:'financials',  icon:BarChart3,     label:'Financials' }, // PHASE 6
  ];

  return (
    <>
      <Helmet><title>Admin Dashboard — Tycoon Sourcing</title></Helmet>
      <div className="min-h-screen bg-[#060e1a] flex">

        {/* SIDEBAR */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#0a1929] flex flex-col transition-transform duration-300 ${sideOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
          <div className="p-5 border-b border-white/10">
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 w-full group">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center"><span className="text-white font-black text-base">T</span></div>
              <div className="text-left">
                <div className="text-white font-black text-sm">Tycoon Sourcing</div>
                <div className="text-amber-400 text-[9px] font-semibold uppercase tracking-wider">Admin Portal</div>
              </div>
            </button>
          </div>
          <button onClick={() => navigate('/')} className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 text-xs text-blue-300 hover:text-white hover:bg-white/5 rounded-lg">
            <ArrowRight size={12} className="rotate-180" /> Back to website
          </button>
          <nav className="flex-1 px-3 py-3 space-y-1">
            {SIDEBAR.map(item => (
              <button key={item.id} onClick={() => { setTab(item.id); setSideOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === item.id ? 'bg-blue-600 text-white' : 'text-blue-200 hover:bg-white/8 hover:text-white'}`}>
                <item.icon size={16} />
                <span>{item.label}</span>
                {item.badge && <span className="ml-auto text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">{item.badge}</span>}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-white/10">
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-300 hover:text-white hover:bg-white/8 rounded-lg">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </aside>
        {sideOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSideOpen(false)} />}

        {/* MAIN */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="bg-[#0a1929] border-b border-white/10 px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button onClick={() => setSideOpen(true)} className="lg:hidden text-white p-1"><Menu size={20} /></button>
              <div>
                <div className="text-[10px] text-amber-400 uppercase tracking-widest font-semibold">Admin</div>
                <div className="font-black text-white text-base">Dashboard</div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 md:p-6 overflow-auto">

            {/* OVERVIEW */}
            {tab === 'overview' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <h2 className="text-xl font-black text-white mb-5">Overview</h2>

                {/* Primary KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
                  {[
                    { l:'Total clients',    v:clients.length,         c:'text-blue-400' },
                    { l:'Pending approval', v:pendingClients.length,  c:'text-amber-400' },
                    { l:'Active deals',     v:activeDeals.length,     c:'text-cyan-400' },
                    { l:'New requests',     v:newRequests.length,     c:'text-green-400' },
                  ].map(m => (
                    <div key={m.l} className="bg-[#111f33] border border-white/10 rounded-xl p-4">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1 font-semibold">{m.l}</div>
                      <div className={`text-2xl font-black ${m.c}`}>{m.v}</div>
                    </div>
                  ))}
                </div>

                {/* Revenue KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                  {(() => {
                    const totalOrderValue = deals.reduce((s, d) => s + (+d.order_value_lkr || 0), 0);
                    const totalDeposits = deals.reduce((s, d) => s + (+d.deposit_paid || 0), 0);
                    const completedValue = deals.filter(d => d.status === 'completed').reduce((s, d) => s + (+d.order_value_lkr || 0), 0);
                    const outstandingValue = deals.filter(d => d.status === 'active' || d.status === 'ordered' || d.status === 'pending').reduce((s, d) => s + ((+d.order_value_lkr || 0) - (+d.deposit_paid || 0)), 0);
                    const fmt = v => `LKR ${(+v).toLocaleString()}`;
                    return [
                      { l:'Total order value',   v:fmt(totalOrderValue),   c:'text-blue-400', icon:DollarSign },
                      { l:'Deposits received',   v:fmt(totalDeposits),     c:'text-green-400', icon:TrendingUp },
                      { l:'Completed revenue',   v:fmt(completedValue),    c:'text-cyan-400', icon:CheckCircle },
                      { l:'Outstanding',         v:fmt(outstandingValue),  c:'text-amber-400', icon:AlertTriangle },
                    ].map(m => (
                      <div key={m.l} className="bg-gradient-to-br from-[#111f33] to-[#0a1929] border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <m.icon size={12} className={m.c} />
                          <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{m.l}</div>
                        </div>
                        <div className={`text-lg md:text-xl font-black ${m.c}`}>{m.v}</div>
                      </div>
                    ));
                  })()}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-[#111f33] border border-white/10 rounded-2xl p-5">
                    <h3 className="text-sm font-black text-white mb-4">Recent deals</h3>
                    {deals.slice(0,5).map(d => {
                      const s = STATUS[d.status] || STATUS.pending;
                      return (
                        <button key={d.id} onClick={() => setDetailModal({ open: true, deal: d })} className="w-full flex items-center justify-between p-3 bg-[#0a1929] hover:bg-[#0c2140] rounded-xl mb-2 transition-colors text-left">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate">{d.deal_code}</div>
                            <div className="text-[10px] text-slate-400 truncate">{d.profiles?.company || 'Unknown'} · LKR {(+d.order_value_lkr || 0).toLocaleString()}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.color} flex-shrink-0 ml-2`}>{s.label}</span>
                        </button>
                      );
                    })}
                    {deals.length === 0 && <p className="text-sm text-slate-500 text-center py-6">No deals yet</p>}
                  </div>
                  <div className="bg-[#111f33] border border-white/10 rounded-2xl p-5">
                    <h3 className="text-sm font-black text-white mb-4">Pending verifications</h3>
                    {pendingClients.slice(0,5).map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-[#0a1929] rounded-xl mb-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{c.company || c.full_name || 'Unknown'}</div>
                          <div className="text-[10px] text-slate-400 truncate">{c.email}</div>
                        </div>
                        <button onClick={() => approveClient(c.id)} className="text-[10px] font-bold bg-green-600 hover:bg-green-500 text-white px-2.5 py-1 rounded-full flex-shrink-0">Approve</button>
                      </div>
                    ))}
                    {pendingClients.length === 0 && <p className="text-sm text-slate-500 text-center py-6">No pending clients</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* CLIENTS */}
            {tab === 'clients' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                  <h2 className="text-xl font-black text-white">Clients ({clients.length})</h2>
                  <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#111f33] border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="bg-[#111f33] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-[#0a1929] border-b border-white/10">
                        {['Company','Contact','Email','Phone','Status','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {clients.filter(c => !c.is_admin && (!search || [c.company, c.full_name, c.email, c.phone].some(v => v?.toLowerCase().includes(search.toLowerCase())))).map(c => {
                          const s = STATUS[c.status] || STATUS.pending;
                          return (
                            <tr key={c.id} className="border-b border-white/5 hover:bg-white/2">
                              <td className="px-4 py-3 text-white font-semibold">{c.company || '—'}</td>
                              <td className="px-4 py-3 text-slate-300">{c.full_name || '—'}</td>
                              <td className="px-4 py-3 text-slate-400 text-xs">{c.email}</td>
                              <td className="px-4 py-3 text-slate-400 text-xs">{c.phone || '—'}</td>
                              <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>{s.label}</span></td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {c.status === 'pending' && (
                                    <button onClick={() => approveClient(c.id)} className="text-[10px] font-bold bg-green-600 hover:bg-green-500 text-white px-2.5 py-1 rounded-full">Approve</button>
                                  )}
                                  <button onClick={() => setClientEditModal({ open:true, client:c })} className="flex items-center gap-1 text-[10px] font-bold bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 px-2 py-0.5 rounded-full">
                                    <Edit2 size={9} /> Edit
                                  </button>
                                  <button onClick={() => setCreditModal({ open:true, client:c })} className="flex items-center gap-1 text-[10px] font-bold bg-green-600/20 hover:bg-green-600/40 border border-green-500/40 text-green-300 px-2 py-0.5 rounded-full">
                                    <Gift size={9} /> Credit
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DEALS */}
            {tab === 'deals' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                  <h2 className="text-xl font-black text-white">Deals ({deals.length})</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[160px] max-w-xs">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Search deals..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#111f33] border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                    </div>
                    <select value={dealFilter} onChange={e => setDealFilter(e.target.value)}
                      className="px-3 py-2 bg-[#111f33] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="ordered">Ordered</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button onClick={() => setDealModal({ open: true, mode: 'create', deal: null, sourceRequest: null })}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors">
                      <Plus size={14} /> New Deal
                    </button>
                  </div>
                </div>
                {deals.length === 0 && (
                  <div className="bg-[#111f33] border border-white/10 rounded-2xl p-8 text-center text-slate-400">
                    <Package size={32} className="text-slate-500 mx-auto mb-3" />
                    <p className="mb-4">No deals yet. Click "New Deal" to create your first one.</p>
                    <button onClick={() => setDealModal({ open: true, mode: 'create', deal: null, sourceRequest: null })}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg">
                      <Plus size={14} /> Create first deal
                    </button>
                  </div>
                )}
                {deals.filter(d => (dealFilter === 'all' || d.status === dealFilter) && (!search || [d.deal_code, d.product, d.profiles?.company, d.profiles?.full_name].some(v => v?.toLowerCase().includes(search.toLowerCase())))).map(d => {
                  const s = STATUS[d.status] || STATUS.pending;
                  const pct = Math.round(((d.collected_units||0)/(d.total_units||1))*100);
                  // Days to expiry warning
                  const daysLeft = d.expires_at ? Math.ceil((new Date(d.expires_at) - new Date()) / (1000*60*60*24)) : null;
                  const isExpiringSoon = daysLeft !== null && daysLeft <= 15 && daysLeft > 0 && d.status !== 'completed' && d.status !== 'cancelled';
                  const isExpired = daysLeft !== null && daysLeft <= 0 && d.status !== 'completed' && d.status !== 'cancelled';
                  return (
                    <div key={d.id} className={`bg-[#111f33] border rounded-2xl p-5 mb-3 ${isExpired ? 'border-red-500/40' : isExpiringSoon ? 'border-amber-500/40' : 'border-white/10'}`}>
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <div>
                          <div className="font-black text-white">{d.deal_code}</div>
                          <div className="text-xs text-slate-400">{d.profiles?.company || 'Unknown'} · {d.product}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isExpiringSoon && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40"><AlertTriangle size={9} /> {daysLeft}d left</span>
                          )}
                          {isExpired && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40"><AlertTriangle size={9} /> Expired</span>
                          )}
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${s.bg} ${s.color}`}>{s.label}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        <div className="bg-[#0a1929] rounded-lg p-2"><div className="text-[9px] text-slate-500">Value</div><div className="text-xs font-bold text-white">LKR {(+d.order_value_lkr).toLocaleString()}</div></div>
                        <div className="bg-[#0a1929] rounded-lg p-2"><div className="text-[9px] text-slate-500">Progress</div><div className="text-xs font-bold text-white">{pct}%</div></div>
                        <div className="bg-[#0a1929] rounded-lg p-2"><div className="text-[9px] text-slate-500">Units</div><div className="text-xs font-bold text-white">{(d.collected_units||0)}/{d.total_units}</div></div>
                        <div className="bg-[#0a1929] rounded-lg p-2"><div className="text-[9px] text-slate-500">Deposit</div><div className="text-xs font-bold text-white">LKR {(+d.deposit_paid||0).toLocaleString()}</div></div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setDetailModal({ open: true, deal: d })}
                          className="flex items-center gap-1.5 text-xs font-bold bg-slate-600/30 hover:bg-slate-600/50 border border-slate-500/40 text-slate-200 px-3 py-1.5 rounded-lg">
                          <Eye size={12} /> View Details
                        </button>
                        <button onClick={() => setDealModal({ open: true, mode: 'edit', deal: d, sourceRequest: null })}
                          className="flex items-center gap-1.5 text-xs font-bold bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 px-3 py-1.5 rounded-lg">
                          <Edit2 size={12} /> Edit
                        </button>
                        {d.status !== 'completed' && d.status !== 'cancelled' && (
                          <>
                            <button onClick={() => sendDealReminder(d)}
                              className="flex items-center gap-1.5 text-xs font-bold bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-lg">
                              <Bell size={12} /> Send Reminder
                            </button>
                            <button onClick={() => {
                              if (confirm(`Mark deal ${d.deal_code} as complete? This will award ${SITE.rewards_credit_pct}% credit (LKR ${((+d.order_value_lkr)*(SITE.rewards_credit_pct/100)).toLocaleString()}) to the client.`)) completeDeal(d);
                            }} className="flex items-center gap-1.5 text-xs font-bold bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg">
                              <CheckCircle size={12} /> Mark complete + award credit
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* REQUESTS */}
            {tab === 'requests' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <h2 className="text-xl font-black text-white mb-5">Product Requests ({requests.length})</h2>
                {requests.length === 0 && <div className="bg-[#111f33] border border-white/10 rounded-2xl p-8 text-center text-slate-400">No requests yet. Form submissions will appear here once Supabase is connected to the form.</div>}
                {requests.map(r => {
                  const s = STATUS[r.status] || STATUS.new;
                  return (
                    <div key={r.id} className="bg-[#111f33] border border-white/10 rounded-2xl p-5 mb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-black text-white">{r.company || r.name}</div>
                          <div className="text-xs text-slate-400">{r.email} · {r.phone}</div>
                          <div className="text-xs text-slate-500 mt-1">Submitted {new Date(r.created_at).toLocaleDateString()}</div>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${s.bg} ${s.color}`}>{s.label}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="bg-[#0a1929] rounded-lg p-2"><span className="text-slate-500">Service:</span> <span className="text-white font-semibold">{r.model}</span></div>
                        <div className="bg-[#0a1929] rounded-lg p-2"><span className="text-slate-500">Product:</span> <span className="text-white">{r.product}</span></div>
                        <div className="bg-[#0a1929] rounded-lg p-2"><span className="text-slate-500">Qty:</span> <span className="text-white">{r.quantity}</span></div>
                        <div className="bg-[#0a1929] rounded-lg p-2"><span className="text-slate-500">Price:</span> <span className="text-white">{r.price}</span></div>
                      </div>
                      {r.notes && <div className="text-xs text-slate-400 mb-3 p-2 bg-[#0a1929] rounded-lg"><span className="text-slate-500">Notes: </span>{r.notes}</div>}
                      {r.request_documents && r.request_documents.length > 0 && (
                        <div className="mb-3 p-2.5 bg-[#0a1929] rounded-lg">
                          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Attached Documents ({r.request_documents.length})</div>
                          <div className="flex flex-wrap gap-2">
                            {r.request_documents.map(doc => (
                              <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 text-[11px] bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-400/40 text-blue-300 hover:text-white px-2.5 py-1.5 rounded-lg transition-all">
                                <FileText size={11} />
                                <span className="max-w-[150px] truncate">{doc.file_name}</span>
                                <span className="text-slate-500 text-[9px]">({Math.round((doc.file_size||0)/1024)}KB)</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => updateRequestStatus(r.id, 'contacted')} className="text-[10px] font-bold bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1 rounded-full">Mark Contacted</button>
                        <button onClick={() => updateRequestStatus(r.id, 'quoted')} className="text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-full">Quoted</button>
                        <button onClick={() => setDealModal({ open: true, mode: 'convert', deal: null, sourceRequest: r })}
                          className="flex items-center gap-1 text-[10px] font-bold bg-green-600 hover:bg-green-500 text-white px-2.5 py-1 rounded-full">
                          <ArrowRightLeft size={10} /> Convert to Deal
                        </button>
                        <button onClick={() => updateRequestStatus(r.id, 'rejected')} className="text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-full">Reject</button>
                        <a href={`mailto:${r.email}`} className="text-[10px] font-bold border border-white/20 text-white hover:bg-white/10 px-2.5 py-1 rounded-full">Email</a>
                        {r.phone && <a href={`https://wa.me/${r.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold border border-green-500/40 text-green-400 hover:bg-green-500/20 px-2.5 py-1 rounded-full">WhatsApp</a>}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* CREDITS */}
            {tab === 'credits' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <h2 className="text-xl font-black text-white mb-5">Rewards Credits ({credits.length})</h2>
                <div className="bg-[#111f33] border border-white/10 rounded-2xl p-5 mb-5">
                  <div className="text-xs font-black text-green-400 uppercase tracking-widest mb-2">Total active credits</div>
                  <div className="text-3xl font-black text-white">LKR {totalCredits.toLocaleString()}</div>
                  <p className="text-xs text-slate-400 mt-2">Credits earned: {SITE.rewards_credit_pct}% of each completed deal · Expiry: {SITE.rewards_expiry_months} months · Floor: {SITE.m1_deposit_floor}% cash deposit always required</p>
                </div>
                {credits.length === 0 ? (
                  <div className="bg-[#111f33] border border-white/10 rounded-2xl p-8 text-center text-slate-400">No credits issued yet. Credits are auto-awarded when you mark a deal complete.</div>
                ) : (
                  <div className="bg-[#111f33] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-[#0a1929] border-b border-white/10">
                          {['Client','Amount','Earned','Expires','Status'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {credits.map(c => (
                            <tr key={c.id} className="border-b border-white/5">
                              <td className="px-4 py-3 text-white font-semibold">{c.profiles?.company || c.profiles?.full_name || '—'}</td>
                              <td className="px-4 py-3 text-green-400 font-bold">LKR {(+c.balance).toLocaleString()}</td>
                              <td className="px-4 py-3 text-slate-400 text-xs">{new Date(c.earned_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-amber-400 text-xs">{new Date(c.expires_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3"><span className="text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full uppercase">{c.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* WAREHOUSES */}
            {tab === 'warehouses' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                  <h2 className="text-xl font-black text-white">Warehouses ({warehouses.length})</h2>
                  <button onClick={() => setWarehouseModal({ open: true, mode: 'create', warehouse: null })}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg">
                    <Plus size={14} /> Add Warehouse
                  </button>
                </div>
                {warehouses.length === 0 ? (
                  <div className="bg-[#111f33] border border-white/10 rounded-2xl p-8 text-center text-slate-400">
                    <Warehouse size={32} className="text-slate-500 mx-auto mb-3" />
                    <p className="mb-4">No warehouses yet. Click "Add Warehouse" to add your first one.</p>
                  </div>
                ) : (
                  <div className="bg-[#111f33] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-[#0a1929] border-b border-white/10">
                          {['Name','Location','Type','CBM Rate','Wholesale','Capacity','Status','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {warehouses.map(w => (
                            <tr key={w.id} className="border-b border-white/5 hover:bg-white/2">
                              <td className="px-4 py-3 text-white font-semibold">{w.name}</td>
                              <td className="px-4 py-3 text-slate-300 text-xs">{w.location}</td>
                              <td className="px-4 py-3 text-slate-400 text-xs">{w.type}</td>
                              <td className="px-4 py-3 text-white font-semibold">LKR {(+w.cbm_rate).toLocaleString()}</td>
                              <td className="px-4 py-3 text-slate-400 text-xs">LKR {(+w.wholesale_rate || 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-slate-400 text-xs">{w.capacity_cbm} CBM</td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${w.active ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-slate-500/20 text-slate-400 border-slate-500/40'}`}>
                                  {w.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button onClick={() => setWarehouseModal({ open: true, mode: 'edit', warehouse: w })}
                                  className="flex items-center gap-1 text-[10px] font-bold bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 px-2 py-0.5 rounded-full">
                                  <Edit2 size={9} /> Edit
                                </button>
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

            {/* WITHDRAWALS */}
            {tab === 'withdrawals' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <h2 className="text-xl font-black text-white mb-5">Withdrawal Requests ({withdrawals.length})</h2>
                {withdrawals.length === 0 ? (
                  <div className="bg-[#111f33] border border-white/10 rounded-2xl p-8 text-center text-slate-400">
                    <ArrowRightLeft size={32} className="text-slate-500 mx-auto mb-3" />
                    <p>No withdrawal requests yet. Clients can request pickups from their portal.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {withdrawals.map(w => {
                      const st = {
                        requested: { bg:'bg-amber-500/20 text-amber-400 border-amber-500/40', label:'Requested' },
                        approved:  { bg:'bg-blue-500/20 text-blue-400 border-blue-500/40', label:'Approved' },
                        ready:     { bg:'bg-cyan-500/20 text-cyan-400 border-cyan-500/40', label:'Ready for pickup' },
                        collected: { bg:'bg-green-500/20 text-green-400 border-green-500/40', label:'Collected' },
                        rejected:  { bg:'bg-red-500/20 text-red-400 border-red-500/40', label:'Rejected' },
                        cancelled: { bg:'bg-slate-500/20 text-slate-400 border-slate-500/40', label:'Cancelled' },
                      }[w.status] || { bg:'bg-slate-500/20 text-slate-400 border-slate-500/40', label:w.status };
                      return (
                        <div key={w.id} className="bg-[#111f33] border border-white/10 rounded-2xl p-5">
                          <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                            <div className="min-w-0">
                              <div className="text-sm font-black text-white">{w.profiles?.company || w.profiles?.full_name || 'Client'}</div>
                              <div className="text-xs text-slate-400 mt-0.5">Deal: <span className="font-semibold text-blue-300">{w.deals?.deal_code}</span> · {w.deals?.product}</div>
                              <div className="text-[10px] text-slate-500 mt-1">Requested: {new Date(w.created_at).toLocaleString()}</div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.bg}`}>{st.label}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                            <div className="bg-[#0a1929] rounded-lg p-2"><div className="text-[9px] text-slate-500">Units requested</div><div className="text-sm font-bold text-white">{(+w.units_requested || 0).toLocaleString()}</div></div>
                            <div className="bg-[#0a1929] rounded-lg p-2"><div className="text-[9px] text-slate-500">Pickup date</div><div className="text-sm font-bold text-white">{w.pickup_date ? new Date(w.pickup_date).toLocaleDateString() : '—'}</div></div>
                            <div className="bg-[#0a1929] rounded-lg p-2"><div className="text-[9px] text-slate-500">Status</div><div className="text-sm font-bold text-white capitalize">{w.status}</div></div>
                          </div>
                          {w.client_notes && <div className="text-xs text-slate-400 mb-3 p-2 bg-[#0a1929] rounded-lg"><span className="text-slate-500 text-[10px] uppercase tracking-wide">Client notes:</span> {w.client_notes}</div>}
                          {w.admin_notes && <div className="text-xs text-slate-300 mb-3 p-2 bg-[#0a1929] rounded-lg"><span className="text-slate-500 text-[10px] uppercase tracking-wide">Admin notes:</span> {w.admin_notes}</div>}
                          {(w.status === 'requested' || w.status === 'approved') && (
                            <div className="flex flex-wrap gap-2">
                              {w.status === 'requested' && (
                                <>
                                  <button onClick={() => updateWithdrawal(w, 'approved')} className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg">
                                    <CheckCircle size={12} /> Approve
                                  </button>
                                  <button onClick={() => updateWithdrawal(w, 'rejected')} className="flex items-center gap-1.5 text-xs font-bold bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-300 px-3 py-1.5 rounded-lg">
                                    <X size={12} /> Reject
                                  </button>
                                </>
                              )}
                              {w.status === 'approved' && (
                                <>
                                  <button onClick={() => updateWithdrawal(w, 'ready')} className="flex items-center gap-1.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg">
                                    <CheckCircle size={12} /> Mark Ready
                                  </button>
                                  <button onClick={() => updateWithdrawal(w, 'collected')} className="flex items-center gap-1.5 text-xs font-bold bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg">
                                    <CheckCircle size={12} /> Mark Collected
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* FINANCIALS - PHASE 6 */}
            {tab === 'financials' && (
              <FinancialDashboard />
            )}

          </div>
        </div>
      </div>
      <DealFormModal
        open={dealModal.open}
        mode={dealModal.mode}
        deal={dealModal.deal}
        sourceRequest={dealModal.sourceRequest}
        clients={clients}
        onClose={() => setDealModal({ open: false, mode: 'create', deal: null, sourceRequest: null })}
        onSaved={() => loadAdminData()}
      />
      <DealDetailModal
        open={detailModal.open}
        deal={detailModal.deal}
        isAdmin={true}
        onClose={() => setDetailModal({ open: false, deal: null })}
        onUpdate={() => loadAdminData()}
      />
      <CreditAwardModal
        open={creditModal.open}
        client={creditModal.client}
        onClose={() => setCreditModal({ open: false, client: null })}
        onSaved={() => loadAdminData()}
      />
      <ClientEditModal
        open={clientEditModal.open}
        client={clientEditModal.client}
        onClose={() => setClientEditModal({ open: false, client: null })}
        onSaved={() => loadAdminData()}
      />
      <WarehouseFormModal
        open={warehouseModal.open}
        mode={warehouseModal.mode}
        warehouse={warehouseModal.warehouse}
        onClose={() => setWarehouseModal({ open: false, mode: 'create', warehouse: null })}
        onSaved={() => loadAdminData()}
      />
    </>
  );
}
