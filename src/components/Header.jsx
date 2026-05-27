import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Home, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SITE } from '@/content';
import { getUser, getMyProfile, signOut } from '@/lib/supabase';

const NAV = [
  { label:'Home',         path:'/' },
  { label:'Services',     path:'/services' },
  { label:'How It Works', path:'/how-it-works' },
  { label:'Pricing',      path:'/pricing' },
  { label:'Calculator',   path:'/calculator' },
  { label:'Tracking',     path:'/tracking' },
  { label:'Warehouses',   path:'/warehouses' },
  { label:'About',        path:'/about' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setOpen(false); setUserOpen(false); }, [location.pathname]);

  // Load user profile if logged in
  useEffect(() => {
    (async () => {
      try {
        const u = await getUser();
        if (u) {
          const p = await getMyProfile();
          if (p) setProfile(p);
        }
      } catch {}
    })();
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false); };
    if (userOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userOpen]);

  const go = p => { navigate(p); window.scrollTo({ top:0, behavior:'smooth' }); };
  const active = p => location.pathname === p;

  const handleSignOut = async () => {
    await signOut();
    setProfile(null);
    setUserOpen(false);
    navigate('/');
  };

  const firstName = profile?.full_name?.split(' ')[0] || profile?.company?.split(' ')[0] || 'Account';

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg shadow-slate-200/80' : ''} bg-white`}>

      {/* Top contact bar */}
      <div className="bg-[#0a2342]">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-5 text-xs text-blue-200">
            <span>AU: {SITE.phone_au}</span>
            <span className="hidden sm:inline">SL: {SITE.phone_sl}</span>
          </div>
          <div className="flex items-center gap-3">
            <a href={`mailto:${SITE.email}`} className="text-xs text-blue-200 hover:text-white transition-colors hidden sm:block">{SITE.email}</a>
            <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer"
              className="text-xs font-bold bg-green-600 hover:bg-green-500 text-white px-3 py-0.5 rounded-full transition-colors">
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

          <button onClick={() => go('/')} className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-11 h-11 bg-[#0a2342] rounded-xl flex items-center justify-center shadow-md group-hover:bg-blue-700 transition-colors flex-shrink-0">
              <span className="text-white font-black text-xl leading-none">T</span>
            </div>
            <div>
              <div className="text-[17px] font-black text-[#0a2342] group-hover:text-blue-700 transition-colors leading-tight tracking-wide">
                {SITE.name}
              </div>
              <div className="text-[9px] text-blue-600 tracking-[0.18em] uppercase leading-none font-bold mt-0.5">
                {SITE.tagline}
              </div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden xl:flex items-center gap-0.5">
            {NAV.map(item => (
              <button key={item.path} onClick={() => go(item.path)}
                className={`px-2.5 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                  active(item.path)
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                }`}>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => go('/request')}
              className="hidden sm:block px-4 py-2 text-sm font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-all shadow-sm">
              Request
            </button>

            {profile ? (
              // Logged in — show user dropdown
              <div ref={userRef} className="relative">
                <button onClick={() => setUserOpen(!userOpen)}
                  className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-semibold border-2 border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white rounded-lg transition-all">
                  <div className="w-6 h-6 bg-blue-700 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <span>Hi, {firstName}</span>
                  <ChevronDown size={14} className={`transition-transform ${userOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {userOpen && (
                    <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <div className="text-xs text-slate-400">Signed in as</div>
                        <div className="text-sm font-bold text-[#0a2342] truncate">{profile.company || profile.full_name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{profile.email}</div>
                      </div>
                      <button onClick={() => { go('/portal'); setUserOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        <Home size={14} /> My Portal
                      </button>
                      <button onClick={() => { go('/request'); setUserOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        <User size={14} /> New Request
                      </button>
                      <button onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100">
                        <LogOut size={14} /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              // Logged out — show Client Portal button
              <button onClick={() => go('/portal')}
                className="hidden md:block px-4 py-2 text-sm font-semibold border-2 border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white rounded-lg transition-all">
                Client Portal
              </button>
            )}

            <button onClick={() => setOpen(!open)} className="xl:hidden text-slate-700 p-1">
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
            exit={{ opacity:0, height:0 }} transition={{ duration:0.2 }}
            className="xl:hidden overflow-hidden border-b border-slate-100 bg-white">
            <div className="px-4 py-4 grid grid-cols-2 gap-1.5">
              {NAV.map(item => (
                <button key={item.path} onClick={() => go(item.path)}
                  className={`text-left px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors ${active(item.path) ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'}`}>
                  {item.label}
                </button>
              ))}
              <button onClick={() => go('/request')} className="col-span-1 text-left px-3 py-2.5 text-sm font-bold text-white bg-blue-700 rounded-xl">Request</button>
              {profile ? (
                <>
                  <button onClick={() => go('/portal')} className="col-span-1 text-left px-3 py-2.5 text-sm font-bold text-blue-700 border-2 border-blue-700 rounded-xl">My Portal</button>
                  <button onClick={handleSignOut} className="col-span-2 text-left px-3 py-2.5 text-sm font-bold text-red-600 border border-red-200 rounded-xl">Sign out ({firstName})</button>
                </>
              ) : (
                <button onClick={() => go('/portal')} className="col-span-1 text-left px-3 py-2.5 text-sm font-bold text-blue-700 border-2 border-blue-700 rounded-xl">Portal</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
