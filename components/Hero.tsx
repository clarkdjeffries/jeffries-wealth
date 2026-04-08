import React from 'react';
import { TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import logoUrl from "../assets/logo.svg";

const Hero: React.FC<{ onBook: () => void }> = ({ onBook }) => {
  return (
    <div className="relative overflow-hidden bg-stone-950 pt-20 pb-32">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-800 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-stone-700 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 border border-emerald-900/50 text-emerald-100 text-sm font-medium mb-8 shadow-lg shadow-emerald-900/10">
          <img src={logoUrl} alt="Logo" className="h-6 w-auto text-emerald-500 -mt-2" />
          <span>Flat-Fee &amp; Subscription Model &bull; Fiduciary</span>
        </div>

        <h1 className="font-display mb-8 flex flex-col items-center gap-6">
          <span className="text-5xl md:text-7xl font-bold tracking-tight text-stone-100">
            Build Wealth on Purpose
          </span>
          <span className="text-[1.75rem] md:text-[2.6rem] font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#00C67A] to-[#A6F18A] pb-2 leading-tight">
            Start With a 5-Minute Wealth Audit
          </span>
        </h1>

        <p className="text-lg md:text-xl text-stone-400 max-w-2xl mb-10 leading-relaxed">
          Variable income, RSUs, and high taxes require a smarter kind of planning. Get a personalized breakdown of your top opportunities in under 5 minutes.
        </p>

        <div className="flex flex-col items-center">
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/wealthaudit"
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-stone-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              Start Your Free Wealth Audit
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/qualifier"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-stone-300 border border-stone-700 rounded-lg hover:bg-stone-900 transition-all group"
            >
              See if we are a fit
              <ArrowRight className="ml-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
          <p className="text-xs text-stone-500 mt-4 font-medium tracking-wide">
            Takes 3 to 5 minutes &bull; Personalized insights &bull; No commitment required
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl w-full">
          <div className="p-8 bg-stone-900/50 backdrop-blur border border-stone-800 rounded-2xl hover:border-emerald-900/50 transition-colors">
            <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 text-emerald-500">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-lg font-semibold text-stone-100">Variable &amp; Equity Compensation</h3>
            <p className="text-stone-400 mt-2 leading-relaxed">We design cash-flow and tax systems that tame commissions, bonuses, and equity compensation so volatile income does not derail long-term planning.</p>
          </div>
          <div className="p-8 bg-stone-900/50 backdrop-blur border border-stone-800 rounded-2xl hover:border-emerald-900/50 transition-colors">
            <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 text-emerald-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-3.5L11 21l2.5-2.5L17 21z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-stone-100">Multi-Year Tax Strategy</h3>
            <p className="text-stone-400 mt-2 leading-relaxed">Tax planning across high- and low-income years, designed to reduce lifetime taxes, not just this year's bill.</p>
          </div>
          <div className="p-8 bg-stone-900/50 backdrop-blur border border-stone-800 rounded-2xl hover:border-emerald-900/50 transition-colors">
            <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 text-emerald-500">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-lg font-semibold text-stone-100">Flat-Fee, Fiduciary Advice</h3>
            <p className="text-stone-400 mt-2 leading-relaxed">Transparent subscription pricing. Advice aligned to your goals, not asset balances or commissions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
