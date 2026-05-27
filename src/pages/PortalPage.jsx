import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogIn, Home, Package, Warehouse, FileText, Bell, Gift, Settings, LogOut, Menu, X, CheckCircle, ArrowRight, TrendingUp, AlertTriangle, Send, User, UserPlus, Eye, Edit2, Save, Printer } from 'lucide-react';
import { SITE } from '@/content';
import { useCurrency } from '@/lib/CurrencyContext';
import { loadSupabase, signIn, signUp, signOut, getUser, getMyProfile, getMyDeals, getMyCredits, resetPassword, updateMyProfile } from '@/lib/supabase';
import DealDetailModal from '@/components/DealDetailModal';
import RequestHistoryCard from '@/components/RequestHistoryCard';
import OnboardingFormModal from '@/components/OnboardingFormModal';
import WithdrawalDealPreview from '@/components/WithdrawalDealPreview'; // PHASE 3
import WithdrawalCostCalculator from '@/components/WithdrawalCostCalculator'; // PHASE 3.2
import WithdrawalEditModal from '@/components/WithdrawalEditModal'; // PHASE 4
import PaymentProofModal from '@/components/PaymentProofModal'; // PHASE 5
import { sendAdminWithdrawalRequestedEmail } from '@/lib/emailService'; // ✅ EMAIL IMPORT

const STATUS = {
  active:    { label:'In Warehouse',  color:'text-blue-600',  bg:'bg-blue-50 border-blue-200' },
  pending:   { label:'Pending',       color:'text-amber-600', bg:'bg-amber-50 border-amber-200' },
  ordered:   { label:'Ordered',       color:'text-amber-600', bg:'bg-amber-50 border-amber-200' },
  completed: { label:'Completed',     color:'text-green-600', bg:'bg-green-50 border-green-200' },
  cancelled: { label:'Cancelled',     color:'text-slate-500', bg:'bg-slate-50 border-slate-200' },
};

export default function PortalPage() {
  const [authed,   setAuthed]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [mode,     setMode]     = useState('login');
  const [form,     setForm]     = useState({ email:'', password:'', fullName:'', company:'', phone:'' });
  const [errMsg,   setErrMsg]   = useState('');
  const [okMsg,    setOkMsg]    = useState('');
  const [busy,     setBusy]     = useState(false);
  const [profile,  setProfile]  = useState(null);
  const [deals,    setDeals]    = useState([]);
  const [credits,  setCredits]  = useState({ active:[], total:0 });
  const [tab,      setTab]      = useState('dashboard');
  const [sideOpen, setSideOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ dealId:'', units:'', date:'', notes:'' });
  const [withdrawDone, setWithdrawDone] = useState(false);
  const [myWithdrawals, setMyWithdrawals] = useState([]);
  const [detailModal, setDetailModal] = useState({ open:false, deal:null });
  const [editWithdrawalModal, setEditWithdrawalModal] = useState({ open:false, withdrawal:null });
  const [paymentModal, setPaymentModal] = useState({ open:false, batch:null, invoice:null });
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);

  const { fmt } = useCurrency();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        if (window.location.hash.includes('access_token') || window.location.hash.includes('type=signup')) {
          setOkMsg('✓ Email verified successfully! Please sign in with your password below.');
          window.history.replaceState(null, '', window.location.pathname);
        } else if (window.location.hash.includes('type=recovery')) {
          setOkMsg('Password reset confirmed. Please sign in.');
          window.history.replaceState(null, '', window.location.pathname);
        } else if (window.location.hash.includes('error')) {
          const params = new URLSearchParams(window.location.hash.substring(1));
          const desc = params.get('error_description') || 'Verification failed';
          setErrMsg(decodeURIComponent(desc.replace(/\+/g, ' ')));
          window.history.replaceState(null, '', window.location.pathname);
        }
        const user = await getUser();
        if (user) {
          setAuthed(true);
          await refreshData();
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const refreshData = async () => {
    const [p, d, c] = await Promise.all([getMyProfile(), getMyDeals(), getMyCredits()]);
    setProfile(p);
    setDeals(d || []);
    setCredits(c || { active:[], total:0 });
    try {
      const sb = await loadSupabase();
      const [inv, notif, wd] = await Promise.all([
        sb.from('invoices').select('*').order('issued_at', { ascending: false }),
        sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(20),
        sb.from('withdrawals').select('*, deals(deal_code, product)').order('created_at', { ascending: false }),
      ]);
      setInvoices(inv.data || []);
      setNotifications(notif.data || []);
      setMyWithdrawals(wd.data || []);
    } catch (e) { console.warn('Extra data load failed:', e); }
  };

  const markNotifRead = async (id) => {
    const sb = await loadSupabase();
    await sb.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(nn => nn.map(n => n.id === id ? { ...n, read:true } : n));
  };

  const startEditProfile = () => {
    setProfileForm({
      full_name: profile?.full_name || '',
      company:   profile?.company || '',
      phone:     profile?.phone || '',
      nic:       profile?.nic || '',
      address:   profile?.address || '',
      district:  profile?.district || '',
    });
    setEditingProfile(true);
    setProfileSaved(false);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateMyProfile(profileForm);
      const p = await getMyProfile();
      setProfile(p);
      setEditingProfile(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e) { console.error(e); }
    setProfileSaving(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setBusy(true); setErrMsg(''); setOkMsg('');
    try {
      const { error } = await signIn(form.email, form.password);
      if (error) throw error;
      setAuthed(true);
      await refreshData();
    } catch (err) { setErrMsg(err.message || 'Invalid credentials'); }
    setBusy(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault(); setBusy(true); setErrMsg(''); setOkMsg('');
    try {
      const { error } = await signUp(form.email, form.password, { full_name: form.fullName, company: form.company, phone: form.phone });
      if (error) throw error;
      setOkMsg('Account created! Please verify your email, then complete your onboarding.');
      
      // ✅ SHOW ONBOARDING MODAL AFTER SIGNUP
      setTimeout(() => {
        setOnboardingModalOpen(true);
      }, 1500);
      
      setMode('login');
    } catch (err) { setErrMsg(err.message || 'Signup failed'); }
    setBusy(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault(); setBusy(true); setErrMsg(''); setOkMsg('');
    try {
      await resetPassword(form.email);
      setOkMsg('Password reset email sent! Check your inbox.');
    } catch (err) { setErrMsg(err.message); }
    setBusy(false);
  };

  const handleLogout = async () => {
    await signOut();
    setAuthed(false);
    setProfile(null);
    setDeals([]);
    setForm({ email:'', password:'', fullName:'', company:'', phone:'' });
  };

  // ✅ IMPROVED submitWithdraw WITH EMAIL AND PAYMENT MODAL FIX
  const submitWithdraw = async (e) => {
    e.preventDefault();
    const deal = deals.find(d => d.id === withdrawForm.dealId);
    if (!deal) {
      setErrMsg('Please select a deal');
      return;
    }

    try {
      const sb = await loadSupabase();
      const user = await getUser();
      
      // Insert withdrawal
      const { data, error } = await sb.from('withdrawals').insert({
        client_id:       user.id,
        deal_id:         deal.id,
        units_requested: parseInt(withdrawForm.units) || 0,
        pickup_date:     withdrawForm.date || null,
        status:          'requested',
        client_notes:    withdrawForm.notes || null,
      }).select().single();

      if (error) throw error;

      // ✅ SEND EMAIL TO ADMIN - WITH CORRECT AMOUNT
      try {
        const { data: userProfile } = await sb
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        // ✅ CALCULATE REAL WITHDRAWAL AMOUNT
        const pricePerUnit = (deal.order_value_lkr || 0) / (deal.total_units || 1);
        const withdrawalAmount = (parseInt(withdrawForm.units) || 0) * pricePerUnit;
        
        await sendAdminWithdrawalRequestedEmail(
          userProfile?.full_name || 'Client',
          withdrawalAmount,  // ✅ NOW HAS REAL AMOUNT
          deal.deal_code
        );
        console.log('✅ Admin email sent with amount:', withdrawalAmount);
      } catch (emailErr) {
        console.warn('Email failed:', emailErr);
      }

      // Create notification
      await sb.from('notifications').insert({
        client_id: user.id,
        type: 'info',
        message: `Withdrawal request submitted for ${deal.deal_code} — ${withdrawForm.units} units`,
      });

      // Refresh data
      await refreshData();
      const freshDeals = await getMyDeals();
      const dealWithBatch = freshDeals?.find(d => d.id === deal.id);
      
      if (dealWithBatch && dealWithBatch.batches && dealWithBatch.batches.length > 0) {
        const newBatch = dealWithBatch.batches[dealWithBatch.batches.length - 1];
        console.log('✅ Batch found:', newBatch.batch_num, 'ID:', newBatch.id);
        
        // ⏱️ ULTRA-FAST: Wait only 200ms (was 1000ms)
        await new Promise(r => setTimeout(r, 200));
        
        // Try to find invoice - SINGLE ATTEMPT
        let newInvoice = null;
        try {
          const { data: invoiceData } = await sb
            .from('invoices')
            .select('*')
            .eq('batch_id', newBatch.id)
            .eq('type', 'batch');
          
          if (invoiceData && invoiceData.length > 0) {
            newInvoice = invoiceData[0];
            console.log('✅ Invoice found instantly:', newInvoice.invoice_num);
          }
        } catch (err) {
          console.log('Invoice search completed');
        }
        
        // ✅ IF NO INVOICE, CREATE IT IMMEDIATELY
        if (!newInvoice) {
          console.log('📝 Creating invoice instantly...');
          try {
            const invoiceNum = 'INV-' + Date.now();
            const { data: createdInvoice, error: createError } = await sb
              .from('invoices')
              .insert({
                batch_id: newBatch.id,
                deal_id: deal.id,
                client_id: user.id,
                invoice_num: invoiceNum,
                type: 'batch',
                amount: newBatch.amount_lkr || 0,
                status: 'unpaid',
                issued_at: new Date().toISOString(),
              })
              .select()
              .single();
            
            if (!createError && createdInvoice) {
              newInvoice = createdInvoice;
              console.log('✅ Invoice created instantly:', newInvoice.invoice_num);
            }
          } catch (err) {
            console.error('Invoice creation error:', err);
          }
        }
        
        // ✅ OPEN PAYMENT MODAL NOW (instant!)
        if (newBatch && newInvoice) {
          console.log('✅ PAYMENT MODAL OPENING INSTANTLY');
          setPaymentModal({ 
            open: true, 
            batch: newBatch, 
            invoice: newInvoice 
          });
        } else {
          if (dealWithBatch) {
            setDetailModal({ open: true, deal: dealWithBatch });
          }
        }
      } else {
        console.warn('⚠️ No batches found');
      }
      
      setWithdrawDone(true);
      setWithdrawForm({ dealId:'', units:'', date:'', notes:'' });

    } catch (e) {
      console.error('Withdrawal failed:', e);
      setErrMsg('Error: ' + e.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
    </div>
  );

  if (!authed) return (
    <>
      <Helmet><title>Client Portal — Tycoon Sourcing</title></Helmet>
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-700 mb-6 transition-colors">
            <ArrowRight size={14} className="rotate-180" /> Back to website
          </button>
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#0a2342] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white font-black text-2xl">T</span>
            </div>
            <h1 className="text-2xl font-black text-[#0a2342]">
              {mode === 'login' ? 'Client Portal' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {mode === 'login' ? 'Sign in to manage your deals' : mode === 'signup' ? 'Register for the Tycoon Sourcing portal' : 'We\'ll send you a reset link'}
            </p>
          </div>

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <input type="email" required value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} placeholder="you@company.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <input type="password" required value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))} placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              {errMsg && <p className="text-red-600 text-sm font-medium">{errMsg}</p>}
              {okMsg && <p className="text-green-700 text-sm font-medium bg-green-50 border border-green-200 px-3 py-2 rounded-lg">{okMsg}</p>}
              <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold rounded-xl transition-all">
                {busy ? 'Signing in...' : <><LogIn size={16} /> Sign in</>}
              </button>
              <div className="flex flex-col gap-2 items-center pt-2">
                <button type="button" onClick={() => { setMode('signup'); setErrMsg(''); setOkMsg(''); }} className="text-sm text-blue-700 font-semibold hover:underline">Create an account →</button>
                <button type="button" onClick={() => { setMode('forgot'); setErrMsg(''); setOkMsg(''); }} className="text-xs text-slate-500 hover:text-blue-700">Forgot password?</button>
              </div>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm space-y-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Full name</label>
                <input type="text" required value={form.fullName} onChange={e => setForm(f => ({...f, fullName:e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Company name</label>
                <input type="text" required value={form.company} onChange={e => setForm(f => ({...f, company:e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone / WhatsApp</label>
                <input type="tel" required value={form.phone} onChange={e => setForm(f => ({...f, phone:e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <input type="password" required minLength={6} value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))} placeholder="Min 6 characters" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" /></div>
              {errMsg && <p className="text-red-600 text-sm">{errMsg}</p>}
              <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold rounded-xl">
                {busy ? 'Creating...' : <><UserPlus size={16} /> Create account</>}
              </button>
              <button type="button" onClick={() => { setMode('login'); setErrMsg(''); }} className="w-full text-sm text-slate-600 hover:text-blue-700">← Back to sign in</button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm space-y-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <input type="email" required value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" /></div>
              {errMsg && <p className="text-red-600 text-sm">{errMsg}</p>}
              {okMsg && <p className="text-green-700 text-sm bg-green-50 border border-green-200 px-3 py-2 rounded-lg">{okMsg}</p>}
              <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold rounded-xl">
                {busy ? 'Sending...' : 'Send reset link'}
              </button>
              <button type="button" onClick={() => setMode('login')} className="w-full text-sm text-slate-600 hover:text-blue-700">← Back to sign in</button>
            </form>
          )}
        </div>
      </div>
    </>
  );

  const activeDeals = deals.filter(d => d.status === 'active' || d.status === 'ordered');
  const totalUnitsInWh = activeDeals.reduce((s, d) => s + Math.max(0, (d.total_units||0) - (d.collected_units||0)), 0);
  const totalPaid = deals.reduce((s, d) => {
    const bts = d.batches || [];
    return s + bts.filter(b => b.status === 'paid' || b.status === 'released').reduce((a, b) => a + (+b.amount_lkr || 0), 0);
  }, 0);
  const outstanding = activeDeals.reduce((s, d) => s + Math.max(0, (+d.order_value_lkr || 0) - (+d.deposit_paid || 0)), 0);

  const SIDEBAR = [
    { id:'dashboard',     icon:Home,       label:'Dashboard' },
    { id:'requests',      icon:FileText,   label:'My Requests' },
    { id:'deals',         icon:Package,    label:'My Deals' },
    { id:'withdraw',      icon:TrendingUp, label:'Withdraw Stock' },
    { id:'credits',       icon:Gift,       label:'Rewards Credits', badge: credits.total > 0 ? fmt(credits.total/SITE.rate_lkr) : null },
    { id:'invoices',      icon:FileText,   label:'Invoices' },
    { id:'account',       icon:Settings,   label:'My Account' },
  ];

  return (
    <>
      <Helmet><title>Client Portal — Tycoon Sourcing</title></Helmet>
      <div className="min-h-screen bg-[#f8fafc] flex">

        <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#0a2342] flex flex-col transition-transform duration-300 ${sideOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
          <div className="p-5 border-b border-white/10">
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 w-full group">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-base">T</span>
              </div>
              <div className="text-left">
                <div className="text-white font-black text-sm group-hover:text-blue-300 transition-colors">Tycoon Sourcing</div>
                <div className="text-blue-400 text-[9px] font-semibold uppercase tracking-wider">Client Portal</div>
              </div>
            </button>
          </div>
          <button onClick={() => navigate('/')} className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 text-xs text-blue-300 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <ArrowRight size={12} className="rotate-180" /> Back to website
          </button>
          <nav className="flex-1 px-3 py-3 space-y-1">
            {SIDEBAR.map(item => (
              <button key={item.id} onClick={() => { setTab(item.id); setSideOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === item.id ? 'bg-blue-600 text-white' : 'text-blue-200 hover:bg-white/8 hover:text-white'}`}>
                <item.icon size={16} className="flex-shrink-0" />
                <span>{item.label}</span>
                {item.badge && <span className="ml-auto text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold truncate max-w-[80px]">{item.badge}</span>}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-white/10">
            <div className="px-3 py-2 mb-1">
              <div className="text-xs font-bold text-white truncate">{profile?.company || profile?.full_name || 'Client'}</div>
              <div className="text-[10px] text-blue-400 truncate">{profile?.email}</div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-300 hover:text-white hover:bg-white/8 rounded-lg transition-all">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </aside>
        {sideOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSideOpen(false)} />}

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button onClick={() => setSideOpen(true)} className="lg:hidden text-slate-600 p-1"><Menu size={20} /></button>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Welcome back</div>
                <div className="font-black text-[#0a2342] text-base leading-tight">{profile?.company || profile?.full_name || 'Client'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setNotifPanelOpen(p => !p)}
                  className="relative p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors">
                  <Bell size={18} />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                {notifPanelOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifPanelOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-black text-[#0a2342]">Notifications</span>
                        <button onClick={() => setNotifPanelOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={14} /></button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-slate-500">No notifications yet</div>
                        ) : notifications.map(n => (
                          <button key={n.id} onClick={() => markNotifRead(n.id)}
                            className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}>
                            <div className="flex items-start gap-2">
                              {!n.read && <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />}
                              <div className={`flex-1 ${n.read ? 'pl-4' : ''}`}>
                                <div className="text-xs text-slate-700">{n.message}</div>
                                <div className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {profile?.status === 'verified' && (
                <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full"><CheckCircle size={11} /> Verified</span>
              )}
              {profile?.status === 'pending' && (
                <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full"><AlertTriangle size={11} /> Verification pending</span>
              )}
            </div>
          </div>

          <div className="flex-1 p-4 md:p-6 overflow-auto">

            {tab === 'dashboard' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <h2 className="text-xl font-black text-[#0a2342] mb-5">Dashboard</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                  {[
                    { label:'Active deals',        val: activeDeals.length,        color:'text-blue-700' },
                    { label:'Units in warehouse',  val: totalUnitsInWh.toLocaleString(), color:'text-[#0a2342]' },
                    { label:'Total paid',          val: fmt(totalPaid/SITE.rate_lkr), color:'text-green-700' },
                    { label:'Outstanding',         val: fmt(outstanding/SITE.rate_lkr), color:'text-amber-600' },
                  ].map(m => (
                    <div key={m.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wide mb-1 font-semibold">{m.label}</div>
                      <div className={`text-lg md:text-xl font-black ${m.color}`}>{m.val}</div>
                    </div>
                  ))}
                </div>

                {credits.total > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-2xl p-5 mb-5">
                    <div className="flex items-center gap-3 mb-2">
                      <Gift size={18} className="text-green-700" />
                      <span className="text-xs font-black text-green-700 uppercase tracking-widest">Your rewards</span>
                    </div>
                    <div className="text-2xl font-black text-green-800 mb-1">{fmt(credits.total/SITE.rate_lkr)}</div>
                    <div className="text-sm text-slate-600 mb-3">Deposit credits available — use on your next order</div>
                    <button onClick={() => setTab('credits')} className="text-sm font-bold text-blue-700 hover:underline flex items-center gap-1">
                      View details <ArrowRight size={13} />
                    </button>
                  </div>
                )}

                {activeDeals.length === 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                    <Package size={36} className="text-slate-300 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-700 mb-2">No active deals yet</h3>
                    <p className="text-sm text-slate-500 mb-5">Ready to start trading? Submit your first product request.</p>
                    <button onClick={() => navigate('/request')} className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold">Submit a request</button>
                  </div>
                )}

                {activeDeals.map(d => {
                  const pct = Math.round(((d.collected_units||0) / (d.total_units||1)) * 100);
                  const s = STATUS[d.status] || STATUS.pending;
                  return (
                    <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-xs font-black text-blue-700 uppercase tracking-widest">Active deal — {d.deal_code}</div>
                          <div className="text-sm text-slate-600 mt-0.5">{d.product}</div>
                        </div>
                        <span className={`text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full border ${s.bg} ${s.color}`}>{s.label}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-4">
                        <div className="bg-slate-50 rounded-xl p-3"><div className="text-[10px] text-slate-400">Total</div><div className="text-sm font-bold">{d.total_units?.toLocaleString()}</div></div>
                        <div className="bg-slate-50 rounded-xl p-3"><div className="text-[10px] text-slate-400">Collected</div><div className="text-sm font-bold">{(d.collected_units||0).toLocaleString()}</div></div>
                        <div className="bg-slate-50 rounded-xl p-3"><div className="text-[10px] text-slate-400">Remaining</div><div className="text-sm font-bold">{((d.total_units||0)-(d.collected_units||0)).toLocaleString()}</div></div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-blue-700 rounded-full transition-all" style={{width:`${pct}%`}} />
                      </div>
                      <div className="text-xs text-slate-500">{pct}% collected</div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {tab === 'requests' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-black text-[#0a2342]">My Service Requests</h2>
                  <button onClick={() => navigate('/request')}
                    className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg">
                    <Send size={12} /> New Request
                  </button>
                </div>
                <RequestHistoryCard userId={profile?.id} />
              </motion.div>
            )}

            {tab === 'deals' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <h2 className="text-xl font-black text-[#0a2342] mb-5">My Deals</h2>
                {deals.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center"><Package size={32} className="text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No deals yet.</p></div>
                ) : deals.map(d => {
                  const s = STATUS[d.status] || STATUS.pending;
                  const p2 = Math.round(((d.collected_units||0)/(d.total_units||1))*100);
                  return (
                    <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div><div className="font-black text-[#0a2342]">{d.deal_code}</div><div className="text-sm text-slate-500">{d.product}</div></div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${s.bg} ${s.color}`}>{s.label}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-slate-50 rounded-xl p-3"><div className="text-[10px] text-slate-400">Order value</div><div className="text-sm font-bold">LKR {(+d.order_value_lkr || 0).toLocaleString()}</div></div>
                        <div className="bg-slate-50 rounded-xl p-3"><div className="text-[10px] text-slate-400">Deposit paid</div><div className="text-sm font-bold">LKR {(+d.deposit_paid || 0).toLocaleString()}</div></div>
                        <div className="bg-slate-50 rounded-xl p-3"><div className="text-[10px] text-slate-400">Remaining</div><div className="text-sm font-bold">{((d.total_units||0)-(d.collected_units||0)).toLocaleString()} units</div></div>
                        <div className="bg-slate-50 rounded-xl p-3"><div className="text-[10px] text-slate-400">Progress</div><div className="text-sm font-bold">{p2}%</div></div>
                      </div>
                      {(+d.credit_applied || 0) > 0 && (
                        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-fit">
                          <Gift size={12} />
                          <span>LKR {(+d.credit_applied).toLocaleString()} credit applied on this deal</span>
                        </div>
                      )}
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-blue-700" style={{width:`${p2}%`}} />
                      </div>
                      <button onClick={() => setDetailModal({ open:true, deal:d })}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors">
                        <Eye size={12} /> View details &amp; batches
                      </button>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {tab === 'withdraw' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <h2 className="text-xl font-black text-[#0a2342] mb-5">Request Stock Withdrawal</h2>
                {withdrawDone ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                    <CheckCircle size={40} className="text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-[#0a2342] mb-2">Request sent!</h3>
                    <p className="text-slate-500 text-sm mb-6">Your request has been submitted. Our team will review it and update you here shortly.</p>
                    <button onClick={() => { setWithdrawDone(false); setWithdrawForm({ dealId:'', units:'', date:'', notes:'' }); }} className="px-6 py-3 bg-blue-700 text-white rounded-xl font-bold">New request</button>
                  </div>
                ) : activeDeals.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center"><p className="text-slate-500">No active deals to withdraw from.</p></div>
                ) : (
                  <div className="grid md:grid-cols-[1fr_350px] gap-6 mb-6">
                    <form onSubmit={submitWithdraw} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Select deal *</label>
                        <select required value={withdrawForm.dealId} onChange={e => setWithdrawForm(f => ({...f, dealId:e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm">
                          <option value="">Select...</option>
                          {activeDeals.map(d => <option key={d.id} value={d.id}>{d.deal_code} — {d.product}</option>)}
                        </select></div>

                      {/* ✅ SHOW CURRENT STOCK ON HAND */}
                      {withdrawForm.dealId && (
                        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                          <div className="text-sm text-blue-700 font-bold uppercase tracking-wider">📦 Current Stock On Hand</div>
                          {(() => {
                            const selectedDeal = activeDeals.find(d => d.id === withdrawForm.dealId);
                            const available = selectedDeal ? (selectedDeal.total_units || 0) - (selectedDeal.collected_units || 0) : 0;
                            return (
                              <div className="text-3xl font-black text-blue-600 mt-2">{available.toLocaleString()} units</div>
                            );
                          })()}
                          <div className="text-xs text-blue-600 mt-1">
                            Total: {(() => {
                              const selectedDeal = activeDeals.find(d => d.id === withdrawForm.dealId);
                              return selectedDeal ? selectedDeal.total_units : 0;
                            })().toLocaleString()} | Collected: {(() => {
                              const selectedDeal = activeDeals.find(d => d.id === withdrawForm.dealId);
                              return selectedDeal ? (selectedDeal.collected_units || 0) : 0;
                            })().toLocaleString()}
                          </div>
                        </div>
                      )}
                      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Units to collect *</label>
                        <input required type="number" value={withdrawForm.units} onChange={e => setWithdrawForm(f => ({...f, units:e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" /></div>
                      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Preferred pickup date *</label>
                        <input required type="date" value={withdrawForm.date} onChange={e => {
                          const dateStr = e.target.value;
                          if (dateStr) {
                            const year = dateStr.split('-')[0];
                            if (year.length !== 4) {
                              setErrMsg('Please enter a valid year (4 digits)');
                              return;
                            }
                          }
                          setErrMsg('');
                          setWithdrawForm(f => ({...f, date: dateStr}));
                        }} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" /></div>
                      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
                        <textarea rows={3} value={withdrawForm.notes} onChange={e => setWithdrawForm(f => ({...f, notes:e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none" /></div>
                      {errMsg && <p className="text-red-600 text-sm font-medium">{errMsg}</p>}
                      <button type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-700 text-white font-bold rounded-xl"><Send size={16} /> Submit request</button>
                    </form>

                    <div className="hidden md:block">
                      <WithdrawalCostCalculator 
                        deal={activeDeals.find(d => d.id === withdrawForm.dealId)} 
                        withdrawForm={withdrawForm}
                      />
                    </div>
                  </div>
                )}

                {myWithdrawals.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-[#0a2342] mb-3 uppercase tracking-wider">History ({myWithdrawals.length})</h3>
                    <div className="space-y-2">
                      {myWithdrawals.map(w => {
                        const st = {
                          requested: { bg:'bg-amber-100 text-amber-700 border-amber-200', label:'Awaiting approval' },
                          approved:  { bg:'bg-blue-100 text-blue-700 border-blue-200', label:'Approved' },
                          ready:     { bg:'bg-cyan-100 text-cyan-700 border-cyan-200', label:'Ready for pickup' },
                          collected: { bg:'bg-green-100 text-green-700 border-green-200', label:'Collected' },
                          rejected:  { bg:'bg-red-100 text-red-700 border-red-200', label:'Rejected' },
                          cancelled: { bg:'bg-slate-100 text-slate-500 border-slate-200', label:'Cancelled' },
                        }[w.status] || { bg:'bg-slate-100 text-slate-500 border-slate-200', label:w.status };
                        return (
                          <div key={w.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-[#0a2342]">{w.deals?.deal_code} — {w.deals?.product}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{(+w.units_requested).toLocaleString()} units · pickup {w.pickup_date ? new Date(w.pickup_date).toLocaleDateString() : '—'}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">Requested {new Date(w.created_at).toLocaleDateString()}</div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.bg}`}>{st.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'credits' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <h2 className="text-xl font-black text-[#0a2342] mb-5">Rewards Credits</h2>
                <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 mb-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Gift size={22} className="text-green-700" />
                    <span className="text-xs font-black text-green-700 uppercase tracking-widest">Available balance</span>
                  </div>
                  <div className="text-4xl font-black text-green-800 mb-2">LKR {credits.total.toLocaleString()}</div>
                  <p className="text-sm text-slate-600">Earn {SITE.rewards_credit_pct}% of every completed deal as deposit credit. Use credits to reduce the deposit on your next order (minimum {SITE.m1_deposit_floor}% cash deposit always required).</p>
                </div>
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-3">Credits earned</h3>
                {credits.active.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500">No credits earned yet. Complete your first deal to start earning rewards.</div>
                ) : (
                  <div className="space-y-2">
                    {credits.active.map(c => (
                      <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-400">Earned {new Date(c.earned_at).toLocaleDateString()}</div>
                          <div className="text-xs text-amber-600">Expires {new Date(c.expires_at).toLocaleDateString()}</div>
                        </div>
                        <div className="text-lg font-black text-green-700">+LKR {(+c.balance).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'invoices' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <h2 className="text-xl font-black text-[#0a2342] mb-5">Invoices</h2>
                {invoices.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                    <FileText size={32} className="text-slate-300 mx-auto mb-3" />
                    <p>No invoices yet. Invoices are auto-generated for each deposit and batch pickup.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invoices.map(inv => {
                      const statusColors = {
                        paid:      'bg-green-100 text-green-700 border-green-200',
                        unpaid:    'bg-amber-100 text-amber-700 border-amber-200',
                        cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
                      };
                      const printInv = () => {
                        const w = window.open('', '_blank');
                        w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${inv.invoice_num}</title>\n                        <style>body{font-family:sans-serif;padding:40px;color:#0a2342;max-width:700px;margin:0 auto}\n                        h1{font-size:22px;font-weight:900;margin-bottom:4px}\n                        .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;background:${inv.status==='paid'?'#d1fae5':'#fef3c7'};color:${inv.status==='paid'?'#065f46':'#92400e'}}\n                        table{width:100%;border-collapse:collapse;margin-top:20px}\n                        th{background:#f8fafc;padding:10px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;border:1px solid #e2e8f0}\n                        td{padding:10px;border:1px solid #e2e8f0;font-size:13px}\n                        .total{font-weight:900;font-size:16px}\n                        @media print{button{display:none}}</style></head><body>\n                        <h1>TAX INVOICE</h1>\n                        <p style="color:#64748b;font-size:13px">Tycoon Holdings (Pvt) Ltd · No. 15, Galle Road, Colombo 03</p>\n                        <hr style="margin:16px 0;border:none;border-top:2px solid #e2e8f0"/>\n                        <table style="width:100%;font-size:13px;border:none"><tr>\n                          <td style="border:none;padding:4px 0"><b>Invoice No:</b> ${inv.invoice_num}</td>\n                          <td style="border:none;padding:4px 0;text-align:right"><span class="badge">${inv.status}</span></td>\n                        </tr><tr>\n                          <td style="border:none;padding:4px 0"><b>Type:</b> ${inv.type}</td>\n                          <td style="border:none;padding:4px 0;text-align:right"><b>Date:</b> ${new Date(inv.issued_at).toLocaleDateString()}</td>\n                        </tr></table>\n                        <table>\n                          <tr><th>Description</th><th style="text-align:right">Amount (LKR)</th></tr>\n                          ${(inv.line_items || []).map(li => `<tr><td>${li.label || li.description || 'Item'}</td><td style="text-align:right">${(+li.amount||0).toLocaleString()}</td></tr>`).join('') || `<tr><td>${inv.type === 'deposit' ? 'Deposit payment' : 'Pickup batch payment'}</td><td style="text-align:right">${(+inv.amount).toLocaleString()}</td></tr>`}\n                          <tr><td class="total">TOTAL</td><td class="total" style="text-align:right">LKR ${(+inv.amount).toLocaleString()}</td></tr>\n                        </table>\n                        <p style="margin-top:30px;font-size:11px;color:#94a3b8">This is a computer-generated invoice. For queries contact info@tycoonsourcing.com</p>\n                        <button onclick="window.print()" style="margin-top:20px;padding:10px 24px;background:#1d4ed8;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px">🖨 Print / Save PDF</button>\n                        </body></html>`);
                        w.document.close();
                      };
                      return (
                        <div key={inv.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileText size={18} className="text-blue-700 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-[#0a2342] truncate">{inv.invoice_num}</div>
                              <div className="text-[10px] text-slate-500">{inv.type} · {new Date(inv.issued_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-black text-[#0a2342]">LKR {(+inv.amount).toLocaleString()}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${statusColors[inv.status] || statusColors.unpaid}`}>{inv.status}</span>
                            <button onClick={printInv} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg">
                              <Printer size={12} /> Print
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-slate-400 mt-4 text-center">Invoices are auto-generated for each deposit and batch pickup.</p>
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'account' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <h2 className="text-xl font-black text-[#0a2342]">My Account</h2>
                  {!editingProfile && (
                    <button onClick={startEditProfile}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg">
                      <Edit2 size={12} /> Edit Profile
                    </button>
                  )}
                </div>
                {profileSaved && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-semibold flex items-center gap-2">
                    <CheckCircle size={14} /> Profile updated successfully.
                  </div>
                )}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg">
                  {editingProfile ? (
                    <form onSubmit={saveProfile} className="space-y-3">
                      <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1">Email (cannot be changed)</div>
                      <div className="text-sm text-slate-600 mb-3 p-2 bg-slate-50 rounded-lg">{profile?.email}</div>
                      {[
                        { l:'Full name', k:'full_name' },
                        { l:'Company', k:'company' },
                        { l:'Phone', k:'phone' },
                        { l:'NIC', k:'nic' },
                        { l:'District', k:'district' },
                      ].map(f => (
                        <div key={f.k}>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">{f.l}</label>
                          <input type="text" value={profileForm[f.k] || ''}
                            onChange={e => setProfileForm(fd => ({ ...fd, [f.k]: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                        <textarea rows="2" value={profileForm.address || ''}
                          onChange={e => setProfileForm(fd => ({ ...fd, address: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="flex gap-2 pt-3">
                        <button type="submit" disabled={profileSaving}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-bold rounded-lg">
                          <Save size={14} /> {profileSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" onClick={() => setEditingProfile(false)}
                          className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold rounded-lg">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {['Full name:full_name','Company:company','Email:email','Phone:phone','NIC:nic','Address:address','District:district'].map(pair => {
                        const [label, key] = pair.split(':');
                        return (
                          <div key={key} className="flex justify-between py-3 border-b border-slate-50 last:border-0">
                            <span className="text-sm text-slate-500 font-medium">{label}</span>
                            <span className="text-sm font-semibold text-[#0a2342] text-right max-w-[60%] break-words">{profile?.[key] || '—'}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <DealDetailModal
        open={detailModal.open}
        deal={detailModal.deal}
        isAdmin={false}
        withdrawForm={withdrawForm}
        onClose={() => setDetailModal({ open:false, deal:null })}
        onUpdate={refreshData}
      />

      <WithdrawalEditModal
        open={editWithdrawalModal.open}
        withdrawal={editWithdrawalModal.withdrawal}
        deal={deals.find(d => d.id === editWithdrawalModal.withdrawal?.deal_id)}
        onClose={() => setEditWithdrawalModal({ open:false, withdrawal:null })}
        onSuccess={() => { refreshData(); }}
      />

      {/* ✅ PAYMENT PROOF MODAL */}
      <PaymentProofModal
        open={paymentModal.open}
        batch={paymentModal.batch}
        invoice={paymentModal.invoice}
        onClose={() => setPaymentModal({ open:false, batch:null, invoice:null })}
        onSuccess={() => { refreshData(); setPaymentModal({ open:false, batch:null, invoice:null }); }}
      />

      {/* ✅ ONBOARDING MODAL - ACTIVATED AFTER SIGNUP */}
      <OnboardingFormModal
        open={onboardingModalOpen}
        user={profile}
        onClose={() => setOnboardingModalOpen(false)}
        onSuccess={() => {
          setOnboardingModalOpen(false);
          setMode('login');
          setOkMsg('Onboarding complete! Please sign in with your new account.');
        }}
      />
    </>
  );
}
