import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop';
import MainLayout from '@/layouts/MainLayout';
import { CurrencyProvider } from '@/lib/CurrencyContext';

import HomePage       from '@/pages/HomePage';
import ServicesPage   from '@/pages/ServicesPage';
import HowItWorksPage from '@/pages/HowItWorksPage';
import PricingPage    from '@/pages/PricingPage';
import CalculatorPage from '@/pages/CalculatorPage';
import RequestPage    from '@/pages/RequestPage';
import TrackingPage   from '@/pages/TrackingPage';
import AboutPage      from '@/pages/AboutPage';
import WarehousePage  from '@/pages/WarehousePage';
import PortalPage     from '@/pages/PortalPage';
import AdminPage      from '@/pages/AdminPage';
import TestEmail      from '@/pages/TestEmail';

// Catches Supabase auth redirect tokens and sends them to /portal
function AuthRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token') || hash.includes('type=signup') || hash.includes('type=recovery') || hash.includes('error_code'))) {
      if (location.pathname !== '/portal') {
        // Preserve the hash so PortalPage can process it
        navigate('/portal' + hash, { replace: true });
      }
    }
  }, [location.pathname, navigate]);
  return null;
}

export default function App() {
  return (
    <CurrencyProvider>
      <BrowserRouter>
        <AuthRedirectHandler />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index             element={<HomePage />} />
            <Route path="services"   element={<ServicesPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="pricing"    element={<PricingPage />} />
            <Route path="calculator" element={<CalculatorPage />} />
            <Route path="request"    element={<RequestPage />} />
            <Route path="tracking"   element={<TrackingPage />} />
            <Route path="about"      element={<AboutPage />} />
            <Route path="warehouses" element={<WarehousePage />} />
          </Route>
          <Route path="/portal" element={<PortalPage />} />
          <Route path="/admin"  element={<AdminPage />} />
          <Route path="/test-email" element={<TestEmail />} />
        </Routes>
      </BrowserRouter>
    </CurrencyProvider>
  );
}
