import React, { useState } from 'react';
import { X, ExternalLink, Building2, LayoutDashboard, ArrowRight, Activity, TrendingUp, Zap } from 'lucide-react';
import Footer from './Footer';
import logoUrl from '../assets/logo.svg';
import { Analytics } from '@vercel/analytics/react';

export default function ResourcesPage() {
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  const tools = [
    {
      num: '01',
      tag: '2 minutes',
      featured: false,
      icon: <Zap size={20} className="text-emerald-500" />,
      title: 'Quick Fit Check',
      desc: 'Six questions that tell you whether your situation is a strong match for working with Clark, and route you to the right next step either way.',
      pills: ['6 questions', 'No email to start'],
      cta: 'Find out',
      href: '/qualifier',
    },
    {
      num: '02',
      tag: 'Most thorough',
      featured: true,
      icon: <Activity size={20} className="text-emerald-500" />,
      title: 'Human Capital Audit',
      desc: 'A full diagnostic across income, taxes, savings, assets, and protection. Personalized severity-rated insights, a 10-year opportunity cost projection, and a downloadable PDF report.',
      pills: ['10 minutes', 'PDF report', 'Free'],
      cta: 'Start the audit',
      href: '/wealthaudit',
    },
    {
      num: '03',
      tag: '3 minutes',
      featured: false,
      icon: <TrendingUp size={20} className="text-emerald-500" />,
      title: 'Time to Retirement',
      desc: 'Find out when you can realistically retire based on your income, savings rate, and target lifestyle. See how small changes today shift your timeline.',
      pills: ['Interactive', 'Instant results'],
      cta: 'Run the numbers',
      href: '/calculator',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-emerald-500 selection:text-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-stone-950/80 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <a href="/" className="flex items-center gap-3">
              <img src={logoUrl} alt="Logo" className="h-9 w-auto -mt-4" />
              <span className="font-bold text-xl text-stone-100 tracking-tight font-display">Jeffries Wealth</span>
            </a>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-400">
              <a href="/#philosophy" className="hover:text-emerald-400 transition-colors">Philosophy</a>
              <a href="/#about" className="hover:text-emerald-400 transition-colors">About</a>
              <a href="/resources" className="text-emerald-400">Resources</a>
              <a href="/#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
            </div>
            <button onClick={() => setIsPortalOpen(true)}
              className="bg-stone-100 text-stone-900 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-white transition-colors">
              Client Portal
            </button>
          </div>
        </div>
      </nav>

      {/* Portal modal */}
      {isPortalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-sm" onClick={() => setIsPortalOpen(false)} />
          <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsPortalOpen(false)} className="absolute top-4 right-4 text-stone-500 hover:text-stone-300">
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

      <main className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/40 rounded-full px-4 py-1.5 text-xs text-emerald-400 font-medium mb-6 uppercase tracking-widest">
              <Activity size={12} /> Free Tools
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-stone-100 mb-5 leading-tight">
              The clearest picture of your<br />financial life starts here.
            </h1>
            <p className="text-stone-400 text-lg max-w-xl mx-auto leading-relaxed">
              Three tools. Pick the one that matches where you are right now. All are free and leave you with something useful regardless of next steps.
            </p>
          </div>

          {/* Tool cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
            {tools.map(tool => (
              <div key={tool.num}
                className={`flex flex-col rounded-2xl border p-6 transition-colors
                  ${tool.featured ? 'bg-emerald-950/10 border-emerald-800/40 hover:border-emerald-600/50' : 'bg-stone-900 border-stone-800 hover:border-stone-700'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-semibold uppercase tracking-widest ${tool.featured ? 'text-emerald-400' : 'text-stone-500'}`}>
                    {tool.tag}
                  </span>
                  <span className="text-xs text-stone-600 font-mono">{tool.num}</span>
                </div>
                <div className="w-9 h-9 bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
                  {tool.icon}
                </div>
                <h2 className="text-lg font-bold text-stone-100 mb-2">{tool.title}</h2>
                <p className="text-stone-400 text-sm leading-relaxed mb-4 flex-1">{tool.desc}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {tool.pills.map(p => (
                    <span key={p} className={`text-[11px] px-2.5 py-1 rounded-full
                      ${tool.featured ? 'bg-emerald-900/30 text-emerald-400' : 'bg-stone-800 text-stone-400'}`}>
                      {p}
                    </span>
                  ))}
                </div>
                <a href={tool.href}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all
                    ${tool.featured ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950' : 'border border-stone-700 text-stone-300 hover:border-stone-600 hover:text-stone-200'}`}>
                  {tool.cta} <ArrowRight size={14} />
                </a>
              </div>
            ))}
          </div>

          {/* Guidance */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 mb-14 text-center">
            <p className="text-stone-400 text-sm leading-relaxed max-w-xl mx-auto">
              Not sure where to start? If you want a quick read on whether we are a fit, take the fit check. If you want a full picture of your finances first, do the audit. If you have a specific retirement question, run the calculator.
            </p>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-14">
            {['Fiduciary RIA', 'Flat-fee subscription-based', 'No AUM minimums', 'No commissions', 'Specializing in accumulators'].map(item => (
              <div key={item} className="flex items-center gap-2 text-xs text-stone-500">
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5L4.5 8.5L11 1" stroke="#52554f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />
      <Analytics />
    </div>
  );
}
