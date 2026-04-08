import React, { useState } from 'react';
import { X, ExternalLink, Building2, LayoutDashboard } from 'lucide-react';
import Calculator from './Calculator';
import Footer from './Footer';
import BookingModal from './BookingModal';
import logoUrl from '../assets/logo.svg';
import { Analytics } from '@vercel/analytics/react';

export default function WealthAuditPage() {
  const [isPortalOpen,  setIsPortalOpen]  = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingSource, setBookingSource] = useState<'general' | 'audit' | 'private-wealth' | 'discovery'>('general');
  const [bookingPrefill, setBookingPrefill] = useState<any>(null);

  const openBooking = (
    source: 'general' | 'audit' | 'private-wealth' | 'discovery' = 'general',
    data: any = null
  ) => {
    setBookingSource(source);
    if (data) setBookingPrefill(data);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-emerald-500 selection:text-white">

      <nav className="sticky top-0 z-50 bg-stone-950/80 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <a href="/" className="flex items-center gap-3">
              <img src={logoUrl} alt="Logo" className="h-9 w-auto -mt-4" />
              <span className="font-bold text-xl text-stone-100 tracking-tight font-display">Jeffries Wealth</span>
            </a>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-400">
              <a href="/#philosophy" className="hover:text-emerald-400 transition-colors">Philosophy</a>
              <a href="/#about"      className="hover:text-emerald-400 transition-colors">About</a>
              <a href="/resources"   className="hover:text-emerald-400 transition-colors">Resources</a>
              <a href="/#pricing"    className="hover:text-emerald-400 transition-colors">Pricing</a>
            </div>
            <button
              onClick={() => setIsPortalOpen(true)}
              className="bg-stone-100 text-stone-900 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-white transition-colors"
            >
              Client Portal
            </button>
          </div>
        </div>
      </nav>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        source={bookingSource}
        prefillData={bookingPrefill}
      />

      {isPortalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-sm transition-opacity" onClick={() => setIsPortalOpen(false)} />
          <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsPortalOpen(false)} className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 transition-colors">
              <X size={20} />
            </button>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-stone-100">Client Access</h3>
              <p className="text-stone-400 text-sm mt-1">Select your destination below.</p>
            </div>
            <div className="space-y-3">
              <a href="https://jeffrieswealthmanagement.advizr.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-xl hover:border-emerald-500/50 hover:bg-stone-800 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-900/20 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-stone-900 transition-colors">
                    <img src={logoUrl} alt="Logo" className="h-6 w-auto -mt-2" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-200 group-hover:text-white">Jeffries Wealth Portal</div>
                    <div className="text-xs text-stone-500 group-hover:text-stone-400">Financial Plan & Net Worth</div>
                  </div>
                </div>
                <ExternalLink size={16} className="text-stone-600 group-hover:text-emerald-500 transition-colors" />
              </a>
              <a href="https://app.altruist.com/login" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-xl hover:border-emerald-500/50 hover:bg-stone-800 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 group-hover:bg-stone-700 transition-colors">
                    <LayoutDashboard size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-stone-200 group-hover:text-white">Altruist</div>
                    <div className="text-xs text-stone-500 group-hover:text-stone-400">Custodial Accounts</div>
                  </div>
                </div>
                <ExternalLink size={16} className="text-stone-600 group-hover:text-stone-300 transition-colors" />
              </a>
              <a href="https://client.schwab.com/Areas/Access/Login" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-xl hover:border-emerald-500/50 hover:bg-stone-800 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 group-hover:bg-stone-700 transition-colors">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-stone-200 group-hover:text-white">Charles Schwab</div>
                    <div className="text-xs text-stone-500 group-hover:text-stone-400">Custodial Accounts</div>
                  </div>
                </div>
                <ExternalLink size={16} className="text-stone-600 group-hover:text-stone-300 transition-colors" />
              </a>
            </div>
          </div>
        </div>
      )}

      <main>
        <Calculator onBook={openBooking} />
      </main>

      <Footer />
      <Analytics />
    </div>
  );
}
