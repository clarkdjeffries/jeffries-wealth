import React from 'react';
import { ArrowRight, TrendingUp, ShieldAlert, BarChart3, FileText, Activity } from 'lucide-react';

const AuditTeaser: React.FC = () => {
  return (
    <section className="py-24 bg-stone-950" id="audit">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/40 rounded-full px-4 py-1.5 text-xs text-emerald-400 font-medium mb-6 uppercase tracking-widest">
            <Activity size={12} /> Free Tool
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-stone-100 mb-5 leading-tight">
            Your Human Capital Audit
          </h2>
          <p className="text-stone-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Most high earners have no idea what their income is actually worth over time, where it's leaking, or what the next 10 years look like if nothing changes. This audit shows you all three.
          </p>
        </div>

        {/* What you get — 4 output cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex gap-5 items-start hover:border-emerald-900/50 transition-colors">
            <div className="w-10 h-10 bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-500 shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-stone-100 font-semibold mb-1">Human Capital Projection</h3>
              <p className="text-stone-400 text-sm leading-relaxed">See the total value of your remaining earning years, calculated at a 3% growth rate through age 60. Most people are surprised by the number.</p>
            </div>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex gap-5 items-start hover:border-emerald-900/50 transition-colors">
            <div className="w-10 h-10 bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-500 shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-stone-100 font-semibold mb-1">Personalized Planning Observations</h3>
              <p className="text-stone-400 text-sm leading-relaxed">Up to six severity-rated insights across tax, cash flow, risk, assets, and protection — specific to your situation, not generic advice.</p>
            </div>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex gap-5 items-start hover:border-emerald-900/50 transition-colors">
            <div className="w-10 h-10 bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-500 shrink-0">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-stone-100 font-semibold mb-1">10-Year Opportunity Cost Chart</h3>
              <p className="text-stone-400 text-sm leading-relaxed">An illustration of the gap between your current trajectory and an optimized plan — based on your actual savings rate and income.</p>
            </div>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex gap-5 items-start hover:border-emerald-900/50 transition-colors">
            <div className="w-10 h-10 bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-500 shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-stone-100 font-semibold mb-1">Downloadable PDF Report</h3>
              <p className="text-stone-400 text-sm leading-relaxed">A formatted summary of your key financial facts and planning observations, yours to keep regardless of what you decide to do next.</p>
            </div>
          </div>
        </div>

        {/* What it covers */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 mb-10">
          <p className="text-xs text-stone-500 uppercase tracking-widest font-medium mb-5">What it covers</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { num: '01', label: 'General Profile' },
              { num: '02', label: 'Income & Tax' },
              { num: '03', label: 'Cash Flow' },
              { num: '04', label: 'Assets & Liquidity' },
              { num: '05', label: 'Risk & Estate' },
            ].map(item => (
              <div key={item.num} className="text-center py-4 px-3 bg-stone-950 border border-stone-800 rounded-xl">
                <div className="text-emerald-500 text-xs font-bold tracking-widest mb-1">{item.num}</div>
                <div className="text-stone-300 text-xs font-medium leading-tight">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live feedback callout */}
        <div className="bg-stone-900/50 border border-emerald-900/30 rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <p className="text-stone-100 font-semibold mb-1">Live feedback as you go</p>
            <p className="text-stone-400 text-sm leading-relaxed">
              As you enter your income, your estimated tax rate and human capital number update in real time. As you enter cash flow, your savings rate and monthly surplus calculate automatically. It stops feeling like a form.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-center w-28">
              <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Human Capital</div>
              <div className="text-lg font-bold text-emerald-400">$4.2M</div>
            </div>
            <div className="bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-center w-28">
              <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Tax Rate</div>
              <div className="text-lg font-bold text-stone-200">28.4%</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/wealthaudit"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 text-lg font-bold text-stone-950 bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_24px_rgba(16,185,129,0.3)] mb-4"
          >
            Start your free audit <ArrowRight size={20} />
          </a>
          <p className="text-xs text-stone-500 mt-3">
            Takes about 5 minutes &bull; Free &bull; No obligation
          </p>
        </div>

      </div>
    </section>
  );
};

export default AuditTeaser;
