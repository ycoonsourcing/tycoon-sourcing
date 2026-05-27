import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import TawkToChat from '@/components/TawkToChat';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-[104px] md:pt-[108px]">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <TawkToChat />
    </div>
  );
}
