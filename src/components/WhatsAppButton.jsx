import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SITE } from '@/content';

const TOPICS = [
  { label:'Trade & Warehouse enquiry',  msg:'Hi Tycoon Sourcing! I\'d like to learn about your Trade & Warehouse Fulfilment service.' },
  { label:'Procurement service (1%)',   msg:'Hi Tycoon Sourcing! I need help sourcing goods — can you tell me about your procurement service?' },
  { label:'Import assistance to SL',    msg:'Hi Tycoon Sourcing! I need help importing goods to Sri Lanka. Can you assist?' },
  { label:'Warehouse partnership',      msg:'Hi Tycoon Sourcing! I have warehouse space and would like to join your network.' },
  { label:'Check pre-stocked goods',    msg:'Hi Tycoon Sourcing! I\'d like to know what goods you currently have in stock.' },
  { label:'General enquiry',            msg:'Hi Tycoon Sourcing! I\'d like to find out more about your services.' },
];

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const chat = msg => { window.open(`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank'); setOpen(false); };

  return (
    <div className="fixed bottom-20 right-4 md:right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-72 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 mb-1">
          <div className="bg-[#25D366] px-4 py-3 flex items-center gap-3">
            <img src="/logo.png" alt="Tycoon" className="w-10 h-10 rounded-full object-cover bg-[#0a2342]" />
            <div className="flex-1">
              <div className="text-white font-bold text-sm">{SITE.name}</div>
              <div className="text-green-100 text-xs">Usually replies within 1 hour</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white"><X size={18} /></button>
          </div>
          <div className="p-4 bg-[#ECE5DD]">
            <div className="bg-white rounded-xl rounded-tl-none shadow-sm px-3.5 py-3 text-sm text-gray-700 mb-3 leading-relaxed">
              👋 Hi! How can we help? Select a topic below.
            </div>
            <div className="space-y-2">
              {TOPICS.map(t => (
                <button key={t.label} onClick={() => chat(t.msg)}
                  className="w-full text-left px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:bg-green-50 hover:border-[#25D366] transition-all shadow-sm">
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white px-4 py-2 text-center border-t border-gray-100">
            <span className="text-xs text-gray-400">Opens WhatsApp · {SITE.phone_au}</span>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20b358] shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95">
        {open ? <X size={22} className="text-white" />
          : <svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        }
      </button>
    </div>
  );
}
