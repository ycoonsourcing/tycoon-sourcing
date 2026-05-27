import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Linkedin } from 'lucide-react';
import { SITE } from '@/content';
import { AUFlag, SLFlag } from './FlagBadge';

const LINKS = {
  Services: [
    { label:'Trade & Warehouse',   path:'/services' },
    { label:'Pure Procurement',    path:'/services' },
    { label:'Import Facilitation', path:'/services' },
    { label:'Pre-Stocked Goods',   path:'/services' },
    { label:'Consolidation',       path:'/services' },
    { label:'Product Sourcing',    path:'/services' },
  ],
  Platform: [
    { label:'How It Works',   path:'/how-it-works' },
    { label:'Pricing & Fees', path:'/pricing' },
    { label:'Calculator',     path:'/calculator' },
    { label:'Order Tracking', path:'/tracking' },
    { label:'Warehouses',     path:'/warehouses' },
  ],
  Company: [
    { label:'About Us',          path:'/about' },
    { label:'Request a Product', path:'/request' },
    { label:'Client Portal',     path:'/portal' },
    { label:'Warehouse Partner', path:'/warehouses' },
  ],
};

export default function Footer() {
  const navigate = useNavigate();
  const go = p => { navigate(p); window.scrollTo({ top:0, behavior:'smooth' }); };

  return (
    <footer className="bg-[#0a2342] text-white">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-blue-800 via-blue-500 to-blue-800" />

      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

          {/* Brand col */}
          <div className="lg:col-span-2">
            {/* CSS logo */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-xl leading-none">T</span>
              </div>
              <div>
                <div className="font-black text-white text-base tracking-wide">{SITE.name}</div>
                <div className="text-[9px] text-blue-400 tracking-widest uppercase font-bold mt-0.5">{SITE.tagline}</div>
              </div>
            </div>

            <p className="text-blue-200 text-sm leading-relaxed mb-5 max-w-xs">{SITE.description}</p>

            {/* Two locations — CSS flags */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2.5">
                <AUFlag />
                <span className="text-xs text-blue-200 font-medium">{SITE.entity_au} — Australia</span>
              </div>
              <div className="flex items-center gap-2.5">
                <SLFlag />
                <span className="text-xs text-blue-200 font-medium">{SITE.entity_sl} — Sri Lanka</span>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-2 mb-5">
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-2.5 text-sm text-blue-200 hover:text-white transition-colors">
                <Mail size={13} className="text-blue-400 flex-shrink-0" />{SITE.email}
              </a>
              <a href={`tel:${SITE.phone_au}`} className="flex items-center gap-2.5 text-sm text-blue-200 hover:text-white transition-colors">
                <Phone size={13} className="text-blue-400 flex-shrink-0" />{SITE.phone_au} (AU)
              </a>
              <a href={`tel:${SITE.phone_sl}`} className="flex items-center gap-2.5 text-sm text-blue-200 hover:text-white transition-colors">
                <Phone size={13} className="text-blue-400 flex-shrink-0" />{SITE.phone_sl} (SL)
              </a>
              <div className="flex items-start gap-2.5 text-sm text-blue-200">
                <MapPin size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <span>{SITE.address_au}</span>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {SITE.facebook && (
                <a href={SITE.facebook} target="_blank" rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-blue-600 flex items-center justify-center transition-all">
                  <Facebook size={15} className="text-white" />
                </a>
              )}
              {SITE.linkedin && (
                <a href={SITE.linkedin} target="_blank" rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-blue-600 flex items-center justify-center transition-all">
                  <Linkedin size={15} className="text-white" />
                </a>
              )}
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-green-600 flex items-center justify-center transition-all">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>

          {/* Link cols */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">{group}</div>
              <nav className="space-y-2">
                {items.map(item => (
                  <button key={item.label} onClick={() => go(item.path)}
                    className="block text-sm text-blue-200 hover:text-white transition-colors text-left">
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-blue-800/60 pt-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <p className="text-blue-400 text-xs">
            © 2026 <span className="text-blue-200 font-semibold">{SITE.entity_au}</span> &amp; <span className="text-blue-200 font-semibold">{SITE.entity_sl}</span>. All rights reserved.
          </p>
          <p className="text-blue-600 text-xs">Procurement · Trade · Warehousing · {SITE.website}</p>
        </div>
      </div>
    </footer>
  );
}
