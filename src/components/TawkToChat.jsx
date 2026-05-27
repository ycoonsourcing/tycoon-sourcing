import { useEffect } from 'react';
import { SITE } from '@/content';

export default function TawkToChat() {
  useEffect(() => {
    if (!SITE.tawkto_property_id || !SITE.tawkto_widget_id) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://embed.tawk.to/${SITE.tawkto_property_id}/${SITE.tawkto_widget_id}`;
    s.charset = 'UTF-8';
    s.setAttribute('crossorigin', '*');
    document.body.appendChild(s);
    return () => { try { document.body.removeChild(s); } catch(e) {} };
  }, []);
  return null;
}
