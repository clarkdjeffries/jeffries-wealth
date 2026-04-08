import React, { useState, useMemo } from 'react';
import {
  AlertCircle, CheckCircle, ArrowRight,
  Info, Lock, TrendingUp, X, ShieldCheck, Check, Activity,
  ArrowLeft
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { FinancialInput, AIAnalysis } from '../types';
import { generateFinancialInsights } from '../engines/wealthAuditEngine';
import { logClientData } from '../services/loggingService';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
const fmtFull = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(n));

const FieldInfo: React.FC<{ text: string }> = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block ml-1.5 align-middle">
      <Info
        size={13}
        className="text-stone-500 cursor-help hover:text-emerald-500 transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-stone-800 text-[10px] text-stone-200 rounded shadow-xl border border-stone-700 z-50 pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-stone-800" />
        </div>
      )}
    </div>
  );
};

const FormattedInput: React.FC<{
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder, className = '' }) => {
  const f = (n: number) => (n === 0 ? '' : new Intl.NumberFormat('en-US').format(n));
  const [local, setLocal] = useState(f(value));
  return (
    <input
      type="text"
      inputMode="numeric"
      className={`w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none transition-colors ${className}`}
      value={local}
      onChange={e => { if (/^[0-9,]*$/.test(e.target.value)) setLocal(e.target.value); }}
      onBlur={() => {
        const v = parseInt(local.replace(/,/g, '')) || 0;
        onChange(v);
        setLocal(f(v));
      }}
      placeholder={placeholder}
    />
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl shadow-xl">
      <p className="text-stone-300 text-sm font-bold mb-2">Age {label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-stone-400">{entry.name}:</span>
          <span className="text-stone-100 font-mono">${fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Live tax estimator (for real-time feedback only) ───────────────────────

function quickTax(gross: number, filing: string, maxing401k: string) {
  if (gross <= 0) return { rate: 0, tax: 0 };
  const isMFJ = filing === 'Married Filing Jointly';
  const pretax = maxing401k === 'Yes' ? 23500 : 0;
  const stdDed = isMFJ ? 32200 : 16100;
  const taxable = Math.max(0, gross - pretax - stdDed);
  const brackets: [number, number][] = isMFJ
    ? [[24800,.10],[100800,.12],[211400,.22],[403550,.24],[512450,.32],[768700,.35],[Infinity,.37]]
    : [[12400,.10],[50400,.12],[105700,.22],[201775,.24],[256225,.32],[640600,.35],[Infinity,.37]];
  let tax = 0, prev = 0;
  for (const [cap, rate] of brackets) {
    if (taxable > prev) { tax += (Math.min(taxable, cap) - prev) * rate; prev = cap; }
    else break;
  }
  const fica = Math.min(gross, 176100) * 0.062 + gross * 0.0145;
  const total = tax + fica;
  return { rate: total / gross, tax: total };
}

function calcHC(gross: number, age: number) {
  const years = Math.max(5, 60 - Math.max(age, 22));
  let hc = 0;
  for (let i = 0; i < years; i++) hc += gross * Math.pow(1.03, i);
  return hc;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: 'Profile',    eyebrow: 'Section 1 of 5' },
  { num: 2, label: 'Income',     eyebrow: 'Section 2 of 5' },
  { num: 3, label: 'Cash Flow',  eyebrow: 'Section 3 of 5' },
  { num: 4, label: 'Assets',     eyebrow: 'Section 4 of 5' },
  { num: 5, label: 'Protection', eyebrow: 'Section 5 of 5' },
];

const initialInput: FinancialInput = {
  firstName: '', age: 0, kidsCount: 0, filingStatus: 'Single', state: 'GA',
  financialObjectives: [], primaryConcern: '', jobTitle: '', employer: '', additionalNotes: '',
  annualBaseIncome: 0, annualVariableComp: 0, lastYearTotalComp: 0,
  equityCompensation: ['None'], equityGrantValue: 0,
  maxing401k: 'Unsure', hsaEligible: 'Unsure', hsaContributing: 'Unsure',
  hasCPA: 'No', hasSelfEmploymentIncome: false, hasRealEstateInvestments: false,
  monthlyTakeHome: 0, monthlySpending: 0, runsSurplus: 'Sometimes / Unsure',
  surplusAllocation: 'It varies / nothing consistent', hasSavingsSystem: false,
  netWorth: 0, retirementBalance: 0, retirementSplit: 'Roughly split',
  cashHoldings: 0, hasConcentratedPosition: false, housingStatus: 'rent',
  monthlyHousingPayment: 0, mortgageBalance: 0, homeValue: 0,
  disabilityCoverage: 'None', lifeInsuranceCoverage: 'None',
  hasWholeLife: 'No', hasUmbrella: 'No', hasEstatePlan: 'No',
  estateLastReviewed: 'Never / Unsure',
};

// ─── Component ────────────────────────────────────────────────────────────────

const Calculator: React.FC<{
  onBook: (source?: 'general' | 'audit' | 'private-wealth' | 'discovery', data?: any) => void;
}> = ({ onBook }) => {
  const [step, setStep]           = useState(0);
  const [inputs, setInputs]       = useState<FinancialInput>(initialInput);
  const [result, setResult]       = useState<AIAnalysis | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [analyzeMsg, setAnalyzeMsg] = useState('');
  const [showGate, setShowGate]   = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [gateError, setGateError] = useState('');

  const set = (field: keyof FinancialInput, value: any) =>
    setInputs(prev => ({ ...prev, [field]: value }));

  const toggleArr = (field: keyof FinancialInput, value: string) =>
    setInputs(prev => {
      const arr = prev[field] as string[];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });

  // Live feedback values
  const gross = inputs.annualBaseIncome + inputs.annualVariableComp;
  const liveHC      = useMemo(() => calcHC(gross, inputs.age || 35), [gross, inputs.age]);
  const liveTax     = useMemo(() => quickTax(gross, inputs.filingStatus, inputs.maxing401k), [gross, inputs.filingStatus, inputs.maxing401k]);
  const liveSurplus = inputs.monthlyTakeHome - inputs.monthlySpending;
  const liveSR      = gross > 0 ? (liveSurplus * 12) / gross : 0;

  const hasComplexEquity = inputs.equityCompensation.some(t => !['None', 'ESPP'].includes(t));

  function calcHumanCapital() {
    let inc = inputs.annualBaseIncome + inputs.annualVariableComp;
    const age = inputs.age > 0 ? inputs.age : 35;
    const years = Math.max(5, 60 - age);
    let total = 0;
    for (let i = 0; i < years; i++) { total += inc; inc *= 1.03; }
    return total;
  }

  function buildChart(g: number, surplus: number, nw: number) {
    const data = [];
    let curr = nw, pot = nw;
    const age = inputs.age > 0 ? inputs.age : 35;
    const ann = Math.max(0, surplus);
    const sr  = ann / Math.max(g, 1);
    const sqC = sr <= 0 ? 0 : 0.50 * ann;
    const optC = sr <= 0 ? 0.20 * g : sr < 0.20 ? 0.20 * g : ann;
    for (let i = 0; i <= 10; i++) {
      data.push({ year: age + i, Current: Math.round(curr), Potential: Math.round(pot) });
      curr = curr * 1.06 + sqC;
      pot  = pot  * 1.06 + optC;
    }
    return data;
  }

  function runAnalysis() {
    if (inputs.annualBaseIncome === 0) { setStep(2); return; }
    setStep(6);
    const msgs = [
      'Calculating 2026 tax estimate...',
      'Checking risk exposure...',
      'Analyzing liquidity ratios...',
      'Identifying wealth leakage...',
    ];
    let i = 0;
    setAnalyzeMsg(msgs[0]);
    const iv = setInterval(() => { i++; if (i < msgs.length) setAnalyzeMsg(msgs[i]); }, 1200);
    setTimeout(() => { clearInterval(iv); setStep(7); }, 5200);
  }

  async function executeAudit() {
    if (!inputs.firstName || !inputs.email) { setGateError('Please enter your name and email.'); return; }
    if (!consentGiven) { setGateError('Please check the consent box to continue.'); return; }
    setGateError('');
    setShowGate(false);
    const g       = inputs.annualBaseIncome + inputs.annualVariableComp;
    const surplus = (inputs.monthlyTakeHome - inputs.monthlySpending) * 12;
    const chart   = buildChart(g, surplus, inputs.netWorth);
    setChartData(chart);
    const analysis = await generateFinancialInsights(inputs);
    logClientData('WEALTH_SIMULATOR', {
      lead: { firstName: inputs.firstName, lastName: inputs.lastName, email: inputs.email, phone: inputs.phone },
      keyFacts: analysis.keyFacts,
      compliance: analysis.compliance,
      publicInsights: analysis.publicInsights,
      consent: {
        given: true,
        timestamp: new Date().toISOString(),
        text: 'I consent to Jeffries Wealth Management storing my inputs and the resulting educational insights for recordkeeping and follow-up.',
      },
    });
    setResult(analysis);
    localStorage.setItem('jwm_audit_state', JSON.stringify({ inputs, result: analysis, chartData: chart, hasRun: true, timestamp: Date.now() }));
    setStep(8);
  }

  function downloadPDF() {
    if (!result) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Wealth Audit — Jeffries Wealth</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;padding:48px;color:#1c1917;max-width:820px;margin:0 auto}
      .header{display:flex;justify-content:space-between;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #e7e5e4}
      h1{font-size:22px;font-weight:800;color:#10b981}.firm{text-align:right;font-size:11px;color:#57534e}
      .lbl{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#a8a29e;margin-bottom:6px}
      .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:32px}
      .metric{border:1px solid #e7e5e4;border-radius:8px;padding:14px}.val{font-size:20px;font-weight:800}
      .green{color:#10b981}.red{color:#ef4444}
      .insight{border-radius:8px;padding:14px;margin-bottom:10px;border-left:4px solid}
      .critical{background:#fef2f2;border-color:#ef4444}.warning{background:#fffbeb;border-color:#f59e0b}.info{background:#eff6ff;border-color:#3b82f6}
      .tag{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}
      .critical .tag{color:#ef4444}.warning .tag{color:#f59e0b}.info .tag{color:#3b82f6}
      .ititle{font-weight:700;font-size:13px;color:#1c1917;margin-bottom:3px}.idesc{font-size:11px;color:#57534e;line-height:1.5}
      .footer{margin-top:40px;padding-top:20px;border-top:1px solid #e7e5e4;font-size:9px;color:#a8a29e;line-height:1.6}
      @media print{.pbtn{display:none}}
    </style></head><body>
    <div class="header">
      <div><h1>Wealth Audit Results</h1>
        ${inputs.firstName ? `<p style="font-size:11px;color:#78716c;margin-top:4px">Prepared for: <strong>${inputs.firstName}${inputs.lastName ? ' ' + inputs.lastName : ''}</strong></p>` : ''}
        <p style="font-size:11px;color:#78716c">Generated ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
      </div>
      <div class="firm"><strong>Jeffries Wealth Management, LLC</strong><br/>Fee-Only · Fiduciary<br/>jeffrieswealth.com</div>
    </div>
    <div class="lbl" style="margin-bottom:12px">Key Financial Metrics</div>
    <div class="grid">
      <div class="metric"><div class="lbl">Total Comp</div><div class="val">$${fmt(result.keyFacts.totalComp)}</div></div>
      <div class="metric"><div class="lbl">Savings Rate</div><div class="val ${result.keyFacts.savingsRate>=.20?'green':result.keyFacts.savingsRate<.10?'red':''}">${Math.round(result.keyFacts.savingsRate*100)}%</div></div>
      <div class="metric"><div class="lbl">Effective Tax Rate</div><div class="val">${(result.keyFacts.effectiveTaxRate*100).toFixed(1)}%</div></div>
      <div class="metric"><div class="lbl">Est. Annual Tax</div><div class="val">$${fmt(result.keyFacts.totalTaxEst)}</div></div>
      <div class="metric"><div class="lbl">Monthly Surplus</div><div class="val ${result.keyFacts.monthlySurplus>=0?'green':'red'}">${result.keyFacts.monthlySurplus>=0?'+':''}$${fmt(result.keyFacts.monthlySurplus)}</div></div>
      <div class="metric"><div class="lbl">Liquidity Runway</div><div class="val">${result.keyFacts.cashRunwayMonths.toFixed(1)} mo</div></div>
      <div class="metric"><div class="lbl">Investable Assets</div><div class="val">$${fmt(result.keyFacts.netWorthExHome)}</div></div>
    </div>
    <div class="lbl" style="margin-bottom:12px">Planning Observations</div>
    ${result.publicInsights.map((i:any) => `<div class="insight ${i.status}"><div class="tag">${i.status}</div><div class="ititle">${i.title}</div><div class="idesc">${i.description}</div></div>`).join('')}
    <div class="footer">Results generated using a deterministic, rules-based framework and stored for recordkeeping by Jeffries Wealth Management, LLC. Educational purposes only. Not personalized financial advice.<br/><strong>THIS IS NOT A SUBSTITUTE FOR PROFESSIONAL FINANCIAL OR TAX ADVICE.</strong></div>
    <button class="pbtn" style="margin-top:24px;background:#10b981;color:#fff;border:none;padding:10px 22px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:700" onclick="window.print()">Save as PDF</button>
    </body></html>`);
    w.document.close();
  }

  function clearAudit() {
    setResult(null); setStep(0); setInputs(initialInput);
    setChartData([]); setConsentGiven(false);
    localStorage.removeItem('jwm_audit_state');
  }

  // ─── Sub-components ────────────────────────────────────────────────────────

  const ProgressBar = () => (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-stone-500 font-medium uppercase tracking-widest">{STEPS[step - 1]?.eyebrow}</span>
        <span className="text-xs text-stone-500">{Math.round(step / 5 * 100)}% complete</span>
      </div>
      <div className="flex gap-1.5">
        {STEPS.map(s => (
          <div key={s.num} className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${step >= s.num ? 'bg-emerald-500' : 'bg-stone-800'}`} />
        ))}
      </div>
      <div className="flex mt-2">
        {STEPS.map(s => (
          <div key={s.num} className={`flex-1 text-center text-[10px] font-medium tracking-wide transition-colors ${step >= s.num ? 'text-emerald-500' : 'text-stone-700'}`}>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );

  const NavRow = ({ onNext, nextLabel = 'Continue', disabled = false }: { onNext: () => void; nextLabel?: string; disabled?: boolean }) => (
    <div className="flex gap-3 mt-8">
      {step > 1 && (
        <button onClick={() => setStep(s => s - 1)}
          className="flex items-center gap-2 px-5 py-3 border border-stone-700 rounded-lg text-stone-400 hover:text-stone-200 hover:border-stone-600 transition-all text-sm">
          <ArrowLeft size={15} /> Back
        </button>
      )}
      <button onClick={onNext} disabled={disabled}
        className={`flex-1 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all
          ${disabled ? 'bg-stone-800 text-stone-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-stone-950'}`}>
        {nextLabel} <ArrowRight size={15} />
      </button>
    </div>
  );

  const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-stone-100 mb-3">{title}</h2>
      <p className="text-stone-400 text-sm leading-relaxed border-l-2 border-emerald-500/40 pl-4">{subtitle}</p>
    </div>
  );

  const LiveStat = ({ label, value, color = 'stone' }: { label: string; value: string; color?: string }) => (
    <div className="bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-center">
      <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-lg font-bold ${color === 'green' ? 'text-emerald-400' : color === 'amber' ? 'text-amber-400' : color === 'red' ? 'text-red-400' : 'text-stone-200'}`}>{value}</div>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <section className="py-24 bg-stone-950 min-h-screen" id="calculator">
      <div className="max-w-2xl mx-auto px-4">

        {/* STEP 0: Intro */}
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/40 rounded-full px-4 py-1.5 text-xs text-emerald-400 font-medium mb-6 uppercase tracking-widest">
                <Activity size={12} /> Human Capital Audit
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-stone-100 mb-5 leading-tight">
                Quantify what your<br />income is actually worth.
              </h1>
              <p className="text-stone-400 text-lg max-w-xl mx-auto leading-relaxed mb-3">
                Most high earners have no idea where their income is leaking — or what the next 10 years look like if nothing changes. This audit shows you.
              </p>
              <p className="text-[10px] text-stone-600 max-w-lg mx-auto uppercase tracking-wide leading-relaxed italic">
                For educational purposes only. Does not constitute financial, tax, or investment advice. Do not enter SSNs, account numbers, or other sensitive identifiers.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { label: 'Human Capital', desc: 'The real value of your earning years ahead' },
                { label: 'Wealth Leakage', desc: 'Where your high income is going instead of compounding' },
                { label: '10-Year Gap', desc: 'The cost of the status quo, illustrated' },
              ].map(item => (
                <div key={item.label} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                  <div className="text-emerald-500 font-semibold text-sm mb-2">{item.label}</div>
                  <div className="text-stone-400 text-xs leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] text-base">
              Start the audit <ArrowRight size={18} />
            </button>
            <p className="text-center text-xs text-stone-600 mt-3">Takes about 5 minutes. Free. No obligation.</p>
          </div>
        )}

        {/* STEPS 1-5 */}
        {step >= 1 && step <= 5 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <ProgressBar />

            {/* Section 1: Profile */}
            {step === 1 && (
              <>
                <SectionHeader
                  title="General Profile & Objectives"
                  subtitle="Your goals and concerns shape everything that follows. The more specific you are here, the more your results will actually mean something."
                />
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">First name</label>
                      <input type="text" className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none transition-colors"
                        placeholder="Jane" value={inputs.firstName} onChange={e => set('firstName', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Current age</label>
                      <input type="number" className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none transition-colors"
                        placeholder="35" value={inputs.age === 0 ? '' : inputs.age} onChange={e => set('age', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Job title</label>
                      <input type="text" className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none transition-colors"
                        value={inputs.jobTitle} onChange={e => set('jobTitle', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Employer</label>
                      <input type="text" className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none transition-colors"
                        value={inputs.employer} onChange={e => set('employer', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1.5 block">Number of children</label>
                    <input type="number" min="0" className="w-40 bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none transition-colors"
                      value={inputs.kidsCount === 0 ? '0' : inputs.kidsCount}
                      onChange={e => { const v = parseInt(e.target.value); set('kidsCount', isNaN(v) || v < 0 ? 0 : v); }} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-2 block font-medium uppercase tracking-wider">Primary financial objectives</label>
                    <div className="flex flex-wrap gap-2">
                      {['Building long-term wealth','Reducing taxes','Creating consistency with variable income','Improving cash flow','Optionality / early flexibility','Preparing for a major life change','Other'].map(opt => (
                        <button key={opt} onClick={() => toggleArr('financialObjectives', opt)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5
                            ${inputs.financialObjectives.includes(opt) ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-600'}`}>
                          {inputs.financialObjectives.includes(opt) && <Check size={11} />}
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-2 block font-medium uppercase tracking-wider">Primary concern right now</label>
                    <select className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                      value={inputs.primaryConcern} onChange={e => set('primaryConcern', e.target.value)}>
                      <option value="">Select one...</option>
                      <option>I make good money but don't feel ahead</option>
                      <option>My income is volatile or unpredictable</option>
                      <option>Taxes feel higher than they should be</option>
                      <option>My finances feel disorganized</option>
                      <option>I'm worried about risk or downside</option>
                      <option>I'm not sure what to focus on next</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1.5 block">Anything on your mind? <span className="text-stone-600">(optional)</span></label>
                    <textarea className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 h-20 resize-none text-sm focus:border-emerald-500 focus:outline-none"
                      placeholder="Additional context..." value={inputs.additionalNotes} onChange={e => set('additionalNotes', e.target.value)} />
                    <p className="text-[10px] text-red-400 mt-1.5 font-bold uppercase tracking-wider">
                      Do not enter SSNs, account numbers, or other sensitive identifiers.
                    </p>
                  </div>
                </div>
                <NavRow onNext={() => setStep(2)} nextLabel="Income and taxes" />
              </>
            )}

            {/* Section 2: Income */}
            {step === 2 && (
              <>
                <SectionHeader
                  title="Income & Tax Structure"
                  subtitle="Your income is your most valuable asset. Most people in your bracket have no idea how much of it goes to taxes each year — or what pre-tax strategies they're leaving unused."
                />
                {gross > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-8 animate-in fade-in duration-300">
                    <LiveStat label="Est. Human Capital"  value={`$${fmt(liveHC)}`} color="green" />
                    <LiveStat label="Est. Tax Rate" value={`${(liveTax.rate * 100).toFixed(1)}%`} color={liveTax.rate > 0.30 ? 'amber' : 'stone'} />
                    <LiveStat label="Est. Annual Tax"     value={`$${fmt(liveTax.tax)}`} />
                  </div>
                )}
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Filing status</label>
                      <select className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                        value={inputs.filingStatus} onChange={e => set('filingStatus', e.target.value)}>
                        <option>Single</option><option>Married Filing Jointly</option><option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">State of residence</label>
                      <select className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                        value={inputs.state} onChange={e => set('state', e.target.value)}>
                        {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1.5 block">Annual base income (before tax)</label>
                    <FormattedInput value={inputs.annualBaseIncome} onChange={v => set('annualBaseIncome', v)} placeholder="$0" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1.5 block">Annual variable compensation (bonus, commission, etc.)</label>
                    <FormattedInput value={inputs.annualVariableComp} onChange={v => set('annualVariableComp', v)} placeholder="$0" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1.5 block">Total compensation last year (before tax)</label>
                    <FormattedInput value={inputs.lastYearTotalComp} onChange={v => set('lastYearTotalComp', v)} placeholder="$0" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-2 block font-medium uppercase tracking-wider">Equity compensation</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {['RSUs','ISOs','NSOs','ESPP','Other','None'].map(type => (
                        <button key={type} onClick={() => {
                          if (type === 'None') { set('equityCompensation', ['None']); return; }
                          const curr = inputs.equityCompensation.filter(t => t !== 'None');
                          const next = curr.includes(type) ? curr.filter(t => t !== type) : [...curr, type];
                          set('equityCompensation', next.length ? next : ['None']);
                        }} className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all
                          ${inputs.equityCompensation.includes(type) ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-600'}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                    {hasComplexEquity && (
                      <div className="p-4 bg-stone-950 border border-stone-800 rounded-lg animate-in slide-in-from-top-1 duration-200">
                        <label className="text-xs text-stone-400 mb-1.5 block">
                          Estimated total value of equity grant
                          <FieldInfo text="Current market value of unvested RSUs, or intrinsic value of options." />
                        </label>
                        <FormattedInput value={inputs.equityGrantValue} onChange={v => set('equityGrantValue', v)} placeholder="$0" />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Maxing pre-tax 401(k)?</label>
                      <select className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                        value={inputs.maxing401k} onChange={e => set('maxing401k', e.target.value)}>
                        <option>Yes</option><option>No</option><option>Unsure</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">HSA eligible?</label>
                      <select className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                        value={inputs.hsaEligible} onChange={e => set('hsaEligible', e.target.value)}>
                        <option>Yes</option><option>No</option><option>Unsure</option>
                      </select>
                    </div>
                  </div>
                  {inputs.hsaEligible === 'Yes' && (
                    <div className="p-4 bg-stone-900/50 border border-emerald-900/30 rounded-lg animate-in slide-in-from-top-1 duration-200">
                      <label className="text-xs text-emerald-500 mb-1.5 block font-semibold">Contributing to your HSA?</label>
                      <select className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                        value={inputs.hsaContributing} onChange={e => set('hsaContributing', e.target.value)}>
                        <option>Yes</option><option>No</option><option>Unsure</option>
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Work with a CPA?</label>
                      <select className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                        value={inputs.hasCPA} onChange={e => set('hasCPA', e.target.value)}>
                        <option>Yes</option><option>No</option><option>Sometimes</option>
                      </select>
                    </div>
                    <div className="flex flex-col justify-center gap-3 pt-3">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" className="accent-emerald-500" checked={inputs.hasSelfEmploymentIncome} onChange={e => set('hasSelfEmploymentIncome', e.target.checked)} />
                        <span className="text-sm text-stone-300">Self-employment / 1099 income</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" className="accent-emerald-500" checked={inputs.hasRealEstateInvestments} onChange={e => set('hasRealEstateInvestments', e.target.checked)} />
                        <span className="text-sm text-stone-300">Real estate investments</span>
                      </label>
                    </div>
                  </div>
                </div>
                <NavRow onNext={() => setStep(3)} nextLabel="Cash flow" disabled={inputs.annualBaseIncome === 0} />
                {inputs.annualBaseIncome === 0 && <p className="text-xs text-amber-500 text-center mt-2">Enter your base income to continue.</p>}
              </>
            )}

            {/* Section 3: Cash Flow */}
            {step === 3 && (
              <>
                <SectionHeader
                  title="Cash Flow & Savings System"
                  subtitle="High earners rarely have a spending problem. They have a direction problem. Where your income goes each month determines almost everything about your long-term wealth."
                />
                {(inputs.monthlyTakeHome > 0 || inputs.monthlySpending > 0) && (
                  <div className="grid grid-cols-3 gap-3 mb-8 animate-in fade-in duration-300">
                    <LiveStat label="Monthly Surplus" value={`${liveSurplus >= 0 ? '+' : ''}$${fmtFull(liveSurplus)}`} color={liveSurplus >= 0 ? 'green' : 'red'} />
                    <LiveStat label="Savings Rate"    value={`${(liveSR * 100).toFixed(1)}%`} color={liveSR >= 0.20 ? 'green' : liveSR >= 0.10 ? 'amber' : 'red'} />
                    <LiveStat label="Annual Savings"  value={`$${fmt(Math.max(0, liveSurplus * 12))}`} />
                  </div>
                )}
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Monthly take-home income</label>
                      <FormattedInput value={inputs.monthlyTakeHome} onChange={v => set('monthlyTakeHome', v)} placeholder="$0" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">
                        Monthly spending
                        <FieldInfo text="Everything — rent, food, subscriptions, etc. Do NOT include savings or investment amounts." />
                      </label>
                      <FormattedInput value={inputs.monthlySpending} onChange={v => set('monthlySpending', v)} placeholder="$0" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-2 block">Do you typically run a monthly surplus?</label>
                    <div className="flex bg-stone-950 rounded-lg p-1 border border-stone-700">
                      {['Yes','No','Sometimes / Unsure'].map(opt => (
                        <button key={opt} onClick={() => set('runsSurplus', opt)}
                          className={`flex-1 py-2.5 text-sm rounded transition-all ${inputs.runsSurplus === opt ? 'bg-stone-800 text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Where does surplus usually go?</label>
                      <select className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                        value={inputs.surplusAllocation} onChange={e => set('surplusAllocation', e.target.value)}>
                        <option>It varies / nothing consistent</option>
                        <option>Retirement accounts</option>
                        <option>Taxable investments</option>
                        <option>Cash</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-3 cursor-pointer p-4 bg-stone-900 border border-stone-800 rounded-lg w-full">
                        <input type="checkbox" className="accent-emerald-500 w-5 h-5" checked={inputs.hasSavingsSystem} onChange={e => set('hasSavingsSystem', e.target.checked)} />
                        <span className="text-sm text-stone-300">I have a defined savings target or system</span>
                      </label>
                    </div>
                  </div>
                </div>
                <NavRow onNext={() => setStep(4)} nextLabel="Assets and liquidity" />
              </>
            )}

            {/* Section 4: Assets */}
            {step === 4 && (
              <>
                <SectionHeader
                  title="Assets, Liabilities & Liquidity"
                  subtitle="A snapshot of where you stand today. Your current position determines your leverage points and shapes which moves matter most right now."
                />
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">
                        Net worth (exclude primary home)
                        <FieldInfo text="Retirement accounts, brokerage, cash, etc. Do not include cars or primary residence." />
                      </label>
                      <FormattedInput value={inputs.netWorth} onChange={v => set('netWorth', v)} placeholder="$0" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Total retirement account balance</label>
                      <FormattedInput value={inputs.retirementBalance} onChange={v => set('retirementBalance', v)} placeholder="$0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Retirement mix (Roth vs. Traditional)</label>
                      <select className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                        value={inputs.retirementSplit} onChange={e => set('retirementSplit', e.target.value)}>
                        <option>Roughly split</option><option>Mostly Traditional</option><option>Mostly Roth</option><option>Unsure</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Total cash holdings</label>
                      <FormattedInput value={inputs.cashHoldings} onChange={v => set('cashHoldings', v)} placeholder="$0" />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-stone-900 border border-stone-800 rounded-lg">
                    <input type="checkbox" className="accent-emerald-500 w-5 h-5" checked={inputs.hasConcentratedPosition} onChange={e => set('hasConcentratedPosition', e.target.checked)} />
                    <span className="text-sm text-stone-300">I hold a large concentrated position in a single stock or equity</span>
                  </label>
                  <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-lg">
                    <div className="mb-4">
                      <label className="text-xs text-stone-400 mb-2 block">Primary residence status</label>
                      <div className="flex bg-stone-950 rounded-lg p-1 border border-stone-700 w-40">
                        {['Rent','Own'].map(opt => (
                          <button key={opt} onClick={() => set('housingStatus', opt.toLowerCase())}
                            className={`flex-1 py-2 text-sm rounded transition-all ${inputs.housingStatus === opt.toLowerCase() ? 'bg-stone-800 text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    {inputs.housingStatus === 'own' && (
                      <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div><label className="text-xs text-stone-400 mb-1.5 block">Monthly mortgage</label><FormattedInput value={inputs.monthlyHousingPayment} onChange={v => set('monthlyHousingPayment', v)} placeholder="$0" /></div>
                        <div><label className="text-xs text-stone-400 mb-1.5 block">Outstanding balance</label><FormattedInput value={inputs.mortgageBalance} onChange={v => set('mortgageBalance', v)} placeholder="$0" /></div>
                        <div><label className="text-xs text-stone-400 mb-1.5 block">Home value</label><FormattedInput value={inputs.homeValue} onChange={v => set('homeValue', v)} placeholder="$0" /></div>
                      </div>
                    )}
                  </div>
                </div>
                <NavRow onNext={() => setStep(5)} nextLabel="Risk and protection" />
              </>
            )}

            {/* Section 5: Risk & Estate */}
            {step === 5 && (
              <>
                <SectionHeader
                  title="Risk, Protection & Estate"
                  subtitle="The section most people skip — usually until something goes wrong. A few minutes here can surface gaps that would otherwise go unnoticed for years."
                />
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Disability insurance coverage</label>
                      <select className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                        value={inputs.disabilityCoverage} onChange={e => set('disabilityCoverage', e.target.value)}>
                        <option>None</option><option>Through work</option><option>Private policy</option><option>Both</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Term life insurance coverage</label>
                      <select className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                        value={inputs.lifeInsuranceCoverage} onChange={e => set('lifeInsuranceCoverage', e.target.value)}>
                        <option>None</option><option>Through work</option><option>Private policy</option><option>Both</option><option>Not Applicable</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Own whole / permanent life policy?</label>
                      <select className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                        value={inputs.hasWholeLife} onChange={e => set('hasWholeLife', e.target.value)}>
                        <option>No</option><option>Yes</option><option>Unsure</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">Umbrella liability coverage?</label>
                      <select className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                        value={inputs.hasUmbrella} onChange={e => set('hasUmbrella', e.target.value)}>
                        <option>No</option><option>Yes</option><option>Unsure</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-4 bg-stone-900 border border-stone-800 rounded-lg space-y-4">
                    <div>
                      <label className="text-xs text-stone-400 mb-2 block">Will or trust in place?</label>
                      <div className="flex bg-stone-950 rounded-lg p-1 border border-stone-700 w-56">
                        {['Yes','No','Unsure'].map(opt => (
                          <button key={opt} onClick={() => set('hasEstatePlan', opt)}
                            className={`flex-1 py-2 text-sm rounded transition-all ${inputs.hasEstatePlan === opt ? 'bg-stone-800 text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 mb-1.5 block">When were estate documents and beneficiaries last reviewed?</label>
                      <select className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                        value={inputs.estateLastReviewed} onChange={e => set('estateLastReviewed', e.target.value)}>
                        <option>Within the last 3 years</option>
                        <option>3 to 5 years ago</option>
                        <option>More than 5 years ago</option>
                        <option>Never / Unsure</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <button onClick={runAnalysis}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] text-base">
                    <Activity size={18} /> Run my audit
                  </button>
                  <button onClick={() => setStep(4)}
                    className="w-full mt-3 py-2.5 text-stone-500 hover:text-stone-300 text-sm flex items-center justify-center gap-2 transition-colors">
                    <ArrowLeft size={14} /> Back to assets
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 6: Analyzing */}
        {step === 6 && (
          <div className="text-center py-24 animate-in fade-in duration-300">
            <div className="w-14 h-14 border-2 border-stone-800 border-t-emerald-500 rounded-full mx-auto mb-8 animate-spin" />
            <h2 className="text-xl font-bold text-stone-100 mb-3">Running your audit...</h2>
            <p className="text-stone-400 text-sm">{analyzeMsg}</p>
          </div>
        )}

        {/* STEP 7: Teaser */}
        {step === 7 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/40 rounded-full px-4 py-1.5 text-xs text-emerald-400 font-medium mb-5 uppercase tracking-widest">
                <Activity size={12} /> Audit complete
              </div>
              <h2 className="text-3xl font-bold text-stone-100 mb-3">Your results are ready.</h2>
              <p className="text-stone-400 text-sm max-w-md mx-auto">Enter your details below to unlock your full report and personalized planning observations.</p>
            </div>

            {/* Human capital — visible hook */}
            <div className="bg-stone-900 border border-emerald-800/30 rounded-2xl p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-center gap-2 text-emerald-400 mb-3">
                  <TrendingUp size={18} />
                  <span className="text-xs font-semibold uppercase tracking-widest">Projected Human Capital</span>
                </div>
                <div className="text-5xl font-bold text-stone-100 mb-2 font-mono">${fmt(calcHumanCapital())}</div>
                <p className="text-stone-400 text-sm">Potential value of future earnings through age 60.</p>
              </div>
            </div>

            {/* Blurred insight cards */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-3 filter blur-sm select-none pointer-events-none" aria-hidden>
                {(['critical','warning','info'] as const).map((s, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${s === 'critical' ? 'bg-red-950/10 border-red-900/30' : s === 'warning' ? 'bg-amber-950/10 border-amber-900/30' : 'bg-blue-950/10 border-blue-900/30'}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${s === 'critical' ? 'text-red-400' : s === 'warning' ? 'text-amber-400' : 'text-blue-400'}`}>{s}</div>
                    <div className="h-3 bg-stone-700 rounded mb-2 w-4/5" />
                    <div className="h-2 bg-stone-800 rounded mb-1 w-full" />
                    <div className="h-2 bg-stone-800 rounded w-3/4" />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-stone-950/90 border border-stone-700 rounded-xl px-5 py-3 text-center backdrop-blur-sm">
                  <Lock size={16} className="text-stone-400 mx-auto mb-1.5" />
                  <span className="text-stone-300 text-sm font-medium">Planning observations locked</span>
                </div>
              </div>
            </div>

            <button onClick={() => setShowGate(true)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] text-base">
              <Lock size={16} /> Unlock my full report
            </button>
            <p className="text-center text-xs text-stone-600">Your results are calculated and waiting.</p>
          </div>
        )}

        {/* STEP 8: Full Results */}
        {step === 8 && result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Action bar */}
            <div className="flex items-center justify-between gap-3 p-4 bg-stone-900 border border-stone-800 rounded-xl">
              <button onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-xs font-semibold text-stone-300 transition-all">
                <TrendingUp size={14} /> Download PDF
              </button>
              <button onClick={clearAudit} className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-red-400 transition-colors">
                <X size={12} /> Clear and start over
              </button>
            </div>

            {/* Key Financial Facts */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2 mb-6">
                <Activity size={20} className="text-emerald-500" /> Key Financial Facts
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Total Compensation</p>
                  <p className="text-2xl font-bold text-stone-100">${fmt(result.keyFacts.totalComp)}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                    Est. Savings Rate
                    <FieldInfo text="(Take Home - Spending) / Gross Income. Targets over 20% are strong for high earners." />
                  </p>
                  <p className={`text-2xl font-bold ${result.keyFacts.savingsRate < 0.10 ? 'text-red-400' : result.keyFacts.savingsRate < 0.20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {Math.round(result.keyFacts.savingsRate * 100)}%
                  </p>
                  <p className="text-[10px] text-stone-600">% of gross income</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                    Est. Tax Rate
                    <FieldInfo text="Uses 2026 federal brackets, state rate assumptions, and FICA. Standard deduction assumed." />
                  </p>
                  <p className="text-2xl font-bold text-stone-100">{(result.keyFacts.effectiveTaxRate * 100).toFixed(1)}%</p>
                  <p className="text-[10px] text-stone-600">Fed + State + FICA</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Est. Annual Tax</p>
                  <p className="text-2xl font-bold text-stone-100">${fmt(result.keyFacts.totalTaxEst)}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Monthly Surplus</p>
                  <p className={`text-2xl font-bold ${result.keyFacts.monthlySurplus >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.keyFacts.monthlySurplus >= 0 ? '+' : ''}${fmt(result.keyFacts.monthlySurplus)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Liquidity Runway</p>
                  <p className={`text-2xl font-bold ${result.keyFacts.cashRunwayMonths < 3 ? 'text-amber-400' : 'text-stone-100'}`}>
                    {result.keyFacts.cashRunwayMonths.toFixed(1)} <span className="text-sm font-normal text-stone-500">mo</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Investable Assets</p>
                  <p className="text-2xl font-bold text-stone-100">${fmt(result.keyFacts.netWorthExHome)}</p>
                </div>
              </div>
              <p className="text-[10px] text-stone-500 text-center uppercase font-medium tracking-wide">
                Hypothetical estimates based on user inputs. Educational purposes only. Not financial or tax advice.
              </p>
            </div>

            {/* Human Capital + Top Findings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4 text-emerald-400">
                    <TrendingUp size={20} />
                    <span className="font-bold text-sm uppercase tracking-wider">Projected Human Capital</span>
                  </div>
                  <div className="text-4xl font-bold text-stone-100 mb-2 font-mono">${fmt(calcHumanCapital())}</div>
                  <p className="text-stone-400 text-sm">Potential value of future earnings through age 60.</p>
                  <p className="text-[10px] text-stone-500 mt-4 pt-4 border-t border-stone-800 italic leading-relaxed">
                    Calculated as the sum of projected gross income through age 60 assuming 3% annual growth. Represents the total remaining value of your current earning power.
                  </p>
                </div>
              </div>
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-stone-100 mb-4">What Stands Out</h3>
                <div className="space-y-3">
                  {result.publicInsights.slice(0, 3).map((insight, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {insight.status === 'critical' ? <AlertCircle size={16} className="text-red-500 shrink-0" /> :
                       insight.status === 'warning'  ? <AlertCircle size={16} className="text-amber-500 shrink-0" /> :
                       insight.status === 'info'     ? <Info size={16} className="text-blue-400 shrink-0" /> :
                       <CheckCircle size={16} className="text-emerald-500 shrink-0" />}
                      <span className="text-stone-300 text-sm font-medium">{insight.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Insight cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.publicInsights.map((insight, i) => (
                <div key={i} className={`p-5 rounded-xl border ${
                  insight.status === 'critical' ? 'bg-red-950/10 border-red-900/30' :
                  insight.status === 'warning'  ? 'bg-amber-950/10 border-amber-900/30' :
                  'bg-blue-950/10 border-blue-900/30'}`}>
                  <div className={`mb-2 font-bold text-[10px] uppercase tracking-widest ${
                    insight.status === 'critical' ? 'text-red-400' :
                    insight.status === 'warning'  ? 'text-amber-400' : 'text-blue-400'}`}>
                    {insight.status}
                  </div>
                  <h4 className="text-stone-200 font-bold text-sm mb-2">{insight.title}</h4>
                  <p className="text-xs text-stone-400 leading-relaxed">{insight.description}</p>
                </div>
              ))}
            </div>

            {/* 10-Year Chart */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div>
                  <h3 className="text-xl font-bold text-stone-100 mb-2">Illustrative 10-Year Opportunity Cost</h3>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-xl">
                    This illustration compares two hypothetical planning behaviors based on different savings and reinvestment assumptions.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-wider font-bold shrink-0">
                  <div className="flex items-center gap-2 text-emerald-500"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Optimized Scenario</div>
                  <div className="flex items-center gap-2 text-stone-500"><div className="w-2.5 h-2.5 rounded-full bg-stone-600" /> Status Quo</div>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gPot" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                    <XAxis dataKey="year" stroke="#57534e" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#57534e" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area name="Optimized Scenario" type="monotone" dataKey="Potential" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#gPot)" />
                    <Area name="Status Quo" type="monotone" dataKey="Current" stroke="#57534e" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 pt-6 border-t border-stone-800">
                <p className="text-[10px] text-stone-600 leading-relaxed">
                  <span className="font-bold text-stone-500 uppercase tracking-widest block mb-1">Disclosure of Assumptions</span>
                  Assumes a hypothetical 6% long-term return. The Optimized Scenario assumes contributions equal to 20% of gross income (when current savings are below 20%) or 100% of surplus (when above 20%). The Status Quo assumes 50% of surplus is captured. Actual results will vary based on market returns, behavior, and personal circumstances.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-stone-950 rounded-2xl p-8 border border-stone-800 text-center">
              <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-5">
                <Lock size={22} />
              </div>
              <h3 className="text-2xl font-bold text-stone-100 mb-3 max-w-lg mx-auto">
                Your inputs surfaced several planning considerations worth a deeper conversation.
              </h3>
              <button onClick={() => onBook('audit', inputs)}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-stone-950 bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-3">
                Review your results with Clark <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                Walk through context, assumptions, and potential next steps. No obligation.
              </p>
            </div>

            {/* Compliance footer */}
            <div className="text-[10px] text-stone-600 text-center max-w-2xl mx-auto space-y-2 pb-4">
              <p>Results are generated using a deterministic, rules-based framework and stored for recordkeeping by Jeffries Wealth Management, LLC. Outputs are illustrative and provided for educational purposes only — not personalized financial advice.</p>
              <p className="uppercase tracking-widest font-bold">This is not a substitute for professional financial or tax advice.</p>
            </div>
          </div>
        )}

      </div>

      {/* Email Gate Modal */}
      {showGate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-sm" onClick={() => setShowGate(false)} />
          <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-stone-100 mb-2">Unlock Your Report</h3>
              <p className="text-sm text-stone-400">Enter your details to access your full findings and planning observations.</p>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                  placeholder="First name" value={inputs.firstName} onChange={e => set('firstName', e.target.value)} />
                <input type="text" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                  placeholder="Last name" value={inputs.lastName || ''} onChange={e => set('lastName', e.target.value)} />
              </div>
              <input type="email" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                placeholder="Email address" value={inputs.email || ''} onChange={e => set('email', e.target.value)} />
              <input type="tel" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-200 focus:border-emerald-500 focus:outline-none"
                placeholder="Phone number" value={inputs.phone || ''} onChange={e => set('phone', e.target.value)} />
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-stone-950 border border-stone-800 rounded-lg hover:border-stone-700 transition-colors">
                <input type="checkbox" className="accent-emerald-500 w-5 h-5 mt-0.5 cursor-pointer shrink-0"
                  checked={consentGiven} onChange={e => setConsentGiven(e.target.checked)} />
                <span className="text-xs text-stone-300 leading-relaxed">
                  I consent to Jeffries Wealth Management storing my inputs and the resulting educational insights for recordkeeping and follow-up.
                </span>
              </label>
              {gateError && <p className="text-xs text-red-400 text-center">{gateError}</p>}
              <button onClick={executeAudit}
                className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  consentGiven ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 cursor-pointer' : 'bg-stone-800 text-stone-600 cursor-not-allowed'}`}>
                <Lock size={16} /> Unlock my results
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Calculator;
