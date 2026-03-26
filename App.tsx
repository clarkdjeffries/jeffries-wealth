
import React, { useRef, useState } from 'react';
import CalculatorPage from './components/CalculatorPage';
import WealthAuditPage from './components/WealthAuditPage';
import { X, ExternalLink, Building2, LayoutDashboard, ChevronDown, Activity, TrendingUp } from 'lucide-react';
import Hero from './components/Hero';
import Calculator from './components/Calculator';
import Pricing from './components/Pricing';
import Philosophy from './components/Philosophy';
import About from './components/About';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import Newsletter from './components/Newsletter';
import logoUrl from './assets/logo.svg';
import { Analytics } from '@vercel/analytics/react';

function App() {
  if (window.location.pathname === '/calculator') {
    return <CalculatorPage />;
  }
  if (window.location.pathname === '/wealthaudit') {   
    return <WealthAuditPage />;                         
  } 
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingSource, setBookingSource] = useState<'general' | 'audit' | 'private-wealth' | 'discovery'>('general');
  const [bookingPrefill, setBookingPrefill] = useState<any>(null);
  
  const calculatorRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const philosophyRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  const scrollToCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPricing = (e: React.MouseEvent) => {
    e.preventDefault();
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPhilosophy = (e: React.MouseEvent) => {
    e.preventDefault();
    philosophyRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAbout = (e: React.MouseEvent) => {
    e.preventDefault();
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const openBooking = (source: 'general' | 'audit' | 'private-wealth' | 'discovery' = 'general', data: any = null) => {
    setBookingSource(source);
    if (data) {
        setBookingPrefill(data);
    }
    setIsBookingOpen(true);
};

  return (
   <nav className="sticky top-0 z-50 bg-stone-950/80 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Logo" className="h-9 w-auto text-emerald-500 -mt-4" />
              <span className="font-bold text-xl text-stone-100 tracking-tight font-display">Jeffries Wealth</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-400">
              <a href="#philosophy" onClick={scrollToPhilosophy} className="hover:text-emerald-400 transition-colors">Philosophy</a>
              <a href="#about" onClick={scrollToAbout} className="hover:text-emerald-400 transition-colors">About</a>

              {/* Resources Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-emerald-400 transition-colors py-2">
                  Resources
                  <ChevronDown size={14} />
                </button>
                <div className="absolute top-full left-0 mt-0 w-64 bg-stone-900 border border-stone-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 overflow-hidden">
                  
                    href="/wealthaudit"
                    className="flex items-center gap-3 p-4 hover:bg-stone-800 transition-colors"
                  >
                    <Activity size={18} className="text-emerald-500" />
                    <span className="text-stone-200">Wealth Audit</span>
                  </a>
                  
                    href="/calculator"
                    className="flex items-center gap-3 p-4 hover:bg-stone-800 transition-colors border-t border-stone-800"
                  >
                    <TrendingUp size={18} className="text-emerald-500" />
                    <span className="text-stone-200">Time to Freedom Calculator</span>
                  </a>
                </div>
              </div>

              <a href="#pricing" onClick={scrollToPricing} className="hover:text-emerald-400 transition-colors">Pricing</a>
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

      {/* Booking Modal */}
      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        source={bookingSource}
        prefillData={bookingPrefill}
      />

      {/* Client Portal Modal */}
      {isPortalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-stone-950/90 backdrop-blur-sm transition-opacity"
            onClick={() => setIsPortalOpen(false)}
          ></div>
          <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsPortalOpen(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-stone-100">Client Access</h3>
              <p className="text-stone-400 text-sm mt-1">Select your destination below.</p>
            </div>

            <div className="space-y-3">
              <a 
                href="https://jeffrieswealthmanagement.advizr.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-xl hover:border-emerald-500/50 hover:bg-stone-800 hover:shadow-lg shadow-emerald-900/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-900/20 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-stone-900 transition-colors">
                    <img src={logoUrl} alt="Logo" className="h-6 w-auto text-emerald-500 -mt-2" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-200 group-hover:text-white">Jeffries Wealth Portal</div>
                    <div className="text-xs text-stone-500 group-hover:text-stone-400">Financial Plan & Net Worth</div>
                  </div>
                </div>
                <ExternalLink size={16} className="text-stone-600 group-hover:text-emerald-500 transition-colors" />
              </a>

              <a 
                href="https://app.altruist.com/login" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-xl hover:border-emerald-500/50 hover:bg-stone-800 hover:shadow-lg transition-all group"
              >
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

              <a 
                href="https://client.schwab.com/Areas/Access/Login" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-xl hover:border-emerald-500/50 hover:bg-stone-800 hover:shadow-lg transition-all group"
              >
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
        <Hero onStart={scrollToCalculator} onBook={() => openBooking('discovery')} />
        
        {/* Comparison / Value Prop Section */}
        <section className="py-24 bg-stone-900">
          <div className="max-w-7xl mx-auto px-4">
             <div className="grid md:grid-cols-2 gap-16 items-center">
                
                {/* The Problem */}
                <div>
                   <h2 className="text-3xl font-bold mb-8 text-stone-100 leading-tight">
                     Why "Standard" Advice <br/>Fails <span className="text-emerald-500">Accumulators</span>
                   </h2>
                   <div className="space-y-8">
                      <div className="flex gap-5">
                         <div className="text-stone-600 shrink-0">
                            <X size={28} />
                         </div>
                         <div>
                            <h3 className="text-lg font-semibold text-stone-300">Focused on Retirees</h3>
                            <p className="text-stone-500 mt-1">Most firms are built to preserve wealth for 70-year-olds. They don't have the tools to help 35-year-olds aggressively build it.</p>
                         </div>
                      </div>
                      <div className="flex gap-5">
                         <div className="text-stone-600 shrink-0">
                           <X size={28} />
                         </div>
                         <div>
                            <h3 className="text-lg font-semibold text-stone-300">Huge Asset Minimums</h3>
                            <p className="text-stone-500 mt-1">Most great advisors wont work with you until you've accumulated millions of investable assets. We help you get there.</p>
                         </div>
                      </div>
                      <div className="flex gap-5">
                         <div className="text-stone-600 shrink-0">
                           <X size={28} />
                         </div>
                         <div>
                            <h3 className="text-lg font-semibold text-stone-300">Asset-Based Fees (AUM)</h3>
                            <p className="text-stone-500 mt-1">Why pay 1% of your wealth forever? We believe in transparent, flat subscription pricing.</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* The Solution (Card) */}
                <div className="bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700 p-10 rounded-3xl relative shadow-2xl">
                    <div className="absolute -top-5 -right-5 bg-emerald-600 text-stone-950 font-bold px-6 py-2 rounded-full text-sm shadow-lg">
                        The Jeffries Wealth Approach
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-6">Made for Builders</h3>
                    <ul className="space-y-6">
                        <li className="flex items-start gap-4 text-stone-300">
                            <div className="text-emerald-500 shrink-0 mt-0.5">
                              <img src={logoUrl} alt="Logo" className="h-6 w-auto text-emerald-500 -mt-1" />
                              </div>
                            <span><strong>Variable Income Systems:</strong> We create "salary replacement" strategies from volatile commission checks.</span>
                        </li>
                        <li className="flex items-start gap-4 text-stone-300">
                             <div className="text-emerald-500 shrink-0 mt-0.5">
                              <img src={logoUrl} alt="Logo" className="h-6 w-auto text-emerald-500 -mt-1" />
                              </div>
                            <span><strong>Tax Alpha:</strong> Advanced strategies (Direct Indexing, Leveraged Long/Short, DAFs, Box-Spreads) usually reserved for the ultra-wealthy.</span>
                        </li>
                        <li className="flex items-start gap-4 text-stone-300">
                             <div className="text-emerald-500 shrink-0 mt-0.5">
                              <img src={logoUrl} alt="Logo" className="h-6 w-auto text-emerald-500 -mt-1" />
                              </div>
                            <span><strong>Tech-Forward:</strong> Real-time dashboards and digital planning, not 50-page paper binders.</span>
                        </li>
                        <li className="flex items-start gap-4 text-stone-300">
                             <div className="text-emerald-500 shrink-0 mt-0.5">
                              <img src={logoUrl} alt="Logo" className="h-6 w-auto text-emerald-500 -mt-1" />
                              </div>
                            <span><strong>Flat Fee:</strong> Simple, transparent pricing based on complexity, not your net worth.</span>
                        </li>
                    </ul>
                </div>
             </div>
          </div>
        </section>

        <div ref={philosophyRef}>
            <Philosophy />
        </div>

        <div ref={aboutRef}>
            <About />
        </div>

        <div ref={calculatorRef}>
          <Calculator onBook={openBooking} />
        </div>

        <div ref={pricingRef}>
          <Pricing onBook={openBooking} />
        </div>

        {/* CTA Section */}
        <section className="py-32 bg-stone-950 text-center relative overflow-hidden">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[120px]"></div>
            <div className="max-w-3xl mx-auto px-4 relative z-10">
                <h2 className="text-4xl font-bold text-stone-100 mb-6 font-display">Let's build your financial infrastructure.</h2>
                <p className="text-stone-400 mb-10 text-lg">
                    Schedule a complimentary strategy session. We'll review your analysis results and discuss how our subscription model fits your life.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button 
                        onClick={() => openBooking('discovery')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold px-8 py-4 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
                    >
                        Book Discovery Call
                    </button>
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
