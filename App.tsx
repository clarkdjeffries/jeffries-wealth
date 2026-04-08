import React, { useRef, useState } from 'react';
import CalculatorPage from './components/CalculatorPage';
import WealthAuditPage from './components/WealthAuditPage';
import QualifierPage from './components/QualifierPage';
import ResourcesPage from './components/ResourcesPage';
import { X, ExternalLink, Building2, LayoutDashboard, Activity, TrendingUp } from 'lucide-react';
import Hero from './components/Hero';
import AuditTeaser from './components/AuditTeaser';
import Pricing from './components/Pricing';
import Philosophy from './components/Philosophy';
import About from './components/About';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import Newsletter from './components/Newsletter';
import logoUrl from './assets/logo.svg';
import { Analytics } from '@vercel/analytics/react';

function App() {
  if (window.location.pathname === '/calculator')  return <CalculatorPage />;
  if (window.location.pathname === '/wealthaudit') return <WealthAuditPage />;
  if (window.location.pathname === '/qualifier')   return <QualifierPage />;
  if (window.location.pathname === '/resources')   return <ResourcesPage />;

  const [isPortalOpen,   setIsPortalOpen]   = useState(false);
  const [isBookingOpen,  setIsBookingOpen]  = useState(false);
  const [bookingSource,  setBookingSource]  = useState<'general' | 'audit' | 'private-wealth' | 'discovery'>('general');
  const [bookingPrefill, setBookingPrefill] = useState<any>(null);

  const pricingRef    = useRef<HTMLDivElement>(null);
  const philosophyRef = useRef<HTMLDivElement>(null);
  const aboutRef      = useRef<HTMLDivElement>(null);

  const scrollToPricing    = (e: React.MouseEvent) => { e.preventDefault(); pricingRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  const scrollToPhilosophy = (e: React.MouseEvent) => { e.preventDefault(); philosophyRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  const scrollToAbout      = (e: React.MouseEvent) => { e.preventDefault(); aboutRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  const openBooking = (source: 'general' | 'audit' | 'private-wealth' | 'discovery' = 'general', data: any = null) => {
    setBookingSource(source);
    if (data) setBookingPrefill(data);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-emerald-500 selection:text-white">

      <nav className="sticky top-0 z-50 bg-stone-950/80 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Logo" className="h-9 w-auto text-emerald-500 -mt-4" />
              <span className="font-bold text-xl text-stone-100 tracking-tight font-display">Jeffries Wealth</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-400">
              <a href="#philosophy" onClick={scrollToPhilosophy} className="hover:text-emerald-400 transition-colors">Philosophy</a>
              <a href="#about"      onClick={scrollToAbout}      className="hover:text-emerald-400 transition-colors">About</a>
              <a href="/resources"                               className="hover:text-emerald-400 transition-colors">Resources</a>
              <a href="#pricing"    onClick={scrollToPricing}    className="hover:text-emerald-400 transition-colors">Pricing</a>
            </div>
            <button onClick={() => setIsPortalOpen(true)}
              className="bg-stone-100 text-stone-900 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-white transition-colors">
              Client Portal
            </button>
          </div>
        </div>
      </nav>

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} source={bookingSource} prefillData={bookingPrefill} />

      {isPortalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-sm" onClick={() => setIsPortalOpen(false)} />
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
                  <div className="w-10 h-10 rounded-full bg-emerald-900/20 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                    <img src={logoUrl} alt="Logo" className="h-6 w-auto -mt-2" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-200 group-hover:text-white">Jeffries Wealth Portal</div>
                    <div className="text-xs text-stone-500">Financial Plan & Net Worth</div>
                  </div>
                </div>
                <ExternalLink size={16} className="text-stone-600 group-hover:text-emerald-500 transition-colors" />
              </a>
              <a href="https://app.altruist.com/login" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-xl hover:border-emerald-500/50 hover:bg-stone-800 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center group-hover:bg-stone-700 transition-colors">
                    <LayoutDashboard size={20} className="text-stone-400" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-200 group-hover:text-white">Altruist</div>
                    <div className="text-xs text-stone-500">Custodial Accounts</div>
                  </div>
                </div>
                <ExternalLink size={16} className="text-stone-600 group-hover:text-stone-300 transition-colors" />
              </a>
              <a href="https://client.schwab.com/Areas/Access/Login" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-xl hover:border-emerald-500/50 hover:bg-stone-800 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center group-hover:bg-stone-700 transition-colors">
                    <Building2 size={20} className="text-stone-400" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-200 group-hover:text-white">Charles Schwab</div>
                    <div className="text-xs text-stone-500">Custodial Accounts</div>
                  </div>
                </div>
                <ExternalLink size={16} className="text-stone-600 group-hover:text-stone-300 transition-colors" />
              </a>
            </div>
          </div>
        </div>
      )}

      <main>
        <Hero onBook={() => openBooking('discovery')} />

        <section className="py-24 bg-stone-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-8 text-stone-100 leading-tight">
                  Why "Standard" Advice <br />Fails <span className="text-emerald-500">Accumulators</span>
                </h2>
                <div className="space-y-8">
                  {[
                    { head: 'Focused on Retirees',    body: "Most firms are built to preserve wealth for 70-year-olds. They don't have the tools to help 35-year-olds aggressively build it." },
                    { head: 'Huge Asset Minimums',    body: "Most great advisors won't work with you until you've accumulated millions of investable assets. We help you get there." },
                    { head: 'Asset-Based Fees (AUM)', body: 'Why pay 1% of your wealth forever? We believe in transparent, flat subscription pricing.' },
                  ].map(item => (
                    <div key={item.head} className="flex gap-5">
                      <div className="text-stone-600 shrink-0"><X size={28} /></div>
                      <div>
                        <h3 className="text-lg font-semibold text-stone-300">{item.head}</h3>
                        <p className="text-stone-500 mt-1">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700 p-10 rounded-3xl relative shadow-2xl">
                <div className="absolute -top-5 -right-5 bg-emerald-600 text-stone-950 font-bold px-6 py-2 rounded-full text-sm shadow-lg">
                  The Jeffries Wealth Approach
                </div>
                <h3 className="text-2xl font-bold text-white mb-6">Made for Builders</h3>
                <ul className="space-y-6">
                  {[
                    { head: 'Variable Income Systems', body: 'We create "salary replacement" strategies from volatile commission checks.' },
                    { head: 'Tax Alpha',               body: 'Advanced strategies (Direct Indexing, Leveraged Long/Short, DAFs, Box-Spreads) usually reserved for the ultra-wealthy.' },
                    { head: 'Tech-Forward',            body: 'Real-time dashboards and digital planning, not 50-page paper binders.' },
                    { head: 'Flat Fee',                body: 'Simple, transparent pricing based on complexity, not your net worth.' },
                  ].map(item => (
                    <li key={item.head} className="flex items-start gap-4 text-stone-300">
                      <div className="text-emerald-500 shrink-0 mt-0.5">
                        <img src={logoUrl} alt="Logo" className="h-6 w-auto -mt-1" />
                      </div>
                      <span><strong>{item.head}:</strong> {item.body}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <div ref={philosophyRef}><Philosophy /></div>
        <div ref={aboutRef}><About /></div>
        <AuditTeaser />
        <div ref={pricingRef}><Pricing onBook={openBooking} /></div>

        <section className="py-32 bg-stone-950 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[120px]" />
          <div className="max-w-3xl mx-auto px-4 relative z-10">
            <h2 className="text-4xl font-bold text-stone-100 mb-6 font-display">Let's build your financial infrastructure.</h2>
            <p className="text-stone-400 mb-10 text-lg">
              Not sure if we are the right fit? Take two minutes to find out — then we will point you to exactly the right next step.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="/qualifier"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold px-8 py-4 rounded-lg transition-colors shadow-lg shadow-emerald-900/20">
                See if we are a fit <Activity size={18} />
              </a>
              <a href="/wealthaudit"
                className="inline-flex items-center justify-center gap-2 border border-stone-700 text-stone-300 hover:bg-stone-900 font-semibold px-8 py-4 rounded-lg transition-colors">
                Start the wealth audit <TrendingUp size={18} />
              </a>
            </div>
          </div>
        </section>

        <Newsletter />
      </main>

      <Footer />
      <Analytics />
    </div>
  );
}

export default App;
