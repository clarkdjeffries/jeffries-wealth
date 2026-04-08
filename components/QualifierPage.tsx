import React, { useState } from 'react';
import { X, ExternalLink, Building2, LayoutDashboard, ArrowRight, ArrowLeft, Check, ShieldCheck, Activity } from 'lucide-react';
import Footer from './Footer';
import logoUrl from '../assets/logo.svg';
import { Analytics } from '@vercel/analytics/react';

// ─── Supabase config ──────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://vycjewmsnuzmnpivnuxq.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5Y2pld21zbnV6bW5waXZudXhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjk5NjMsImV4cCI6MjA4MTY0NTk2M30.JM7TSmWbwQixpxyKZj2wsQhMRejgjkVvaityxksNa9Q';

async function saveQualifierLead(data: object) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/qualifier_leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.error('Qualifier Supabase write failed:', e);
  }
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const EMPLOYMENT_OPTS = [
  { val: 'tech',       label: 'Tech or Sales professional',         sub: 'W-2, equity comp, variable bonus' },
  { val: 'corporate',  label: 'Corporate or W-2 employee',          sub: 'Salary, possible bonus or equity' },
  { val: 'business',   label: 'Business owner or self-employed',    sub: 'Variable income, 1099 or pass-through' },
  { val: 'transition', label: 'In transition or multiple sources',  sub: 'Job change, new role, or blended income' },
];

const INCOME_OPTS = [
  { val: 'under150',  label: 'Under $150,000',       score: 0 },
  { val: '150to250',  label: '$150,000 to $250,000',  score: 1 },
  { val: '250to500',  label: '$250,000 to $500,000',  score: 2 },
  { val: 'over500',   label: '$500,000+',             score: 2 },
];

const CHALLENGE_OPTS = [
  { val: 'taxes',     label: 'I feel like I pay too much in taxes' },
  { val: 'plan',      label: "I don't have a clear financial plan" },
  { val: 'equity',    label: 'I have equity comp I am not optimizing' },
  { val: 'savings',   label: "I earn well but don't feel like I'm building wealth fast enough" },
  { val: 'retirement',label: 'I want a clearer picture of retirement' },
  { val: 'life',      label: 'Big life change coming: home, kids, or job' },
];

const ADVISOR_OPTS = [
  { val: 'yes',   label: 'Yes, actively',              sub: 'I meet with someone at least once a year',                score: 0 },
  { val: 'sorta', label: 'Sort of, but not satisfied',  sub: "I have someone but don't feel like I'm getting real value", score: 1 },
  { val: 'no',    label: 'No, managing on my own',      sub: 'DIY investor or just have not gotten there yet',            score: 2 },
  { val: 'used',  label: 'I used to, but not anymore',  sub: '',                                                           score: 1 },
];

const PROMPT_OPTS = [
  { val: 'proactive', label: 'Being proactive — want to get ahead of it',              score: 2 },
  { val: 'event',     label: 'Life event: job change, raise, marriage, kids, home',    score: 2 },
  { val: 'market',    label: 'Market volatility has me second-guessing things',         score: 1 },
  { val: 'content',   label: "Saw Clark's content and wanted to learn more",           score: 1 },
  { val: 'curious',   label: 'Just curious or exploring options',                      score: 0 },
];

const STEPS = [
  { num: 1, label: 'About you' },
  { num: 2, label: 'Income' },
  { num: 3, label: 'Priorities' },
  { num: 4, label: 'Advisor' },
  { num: 5, label: 'Timing' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function QualifierPage() {
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  const [step, setStep] = useState(0);
  const [employment, setEmployment] = useState('');
  const [income, setIncome] = useState('');
  const [incomeScore, setIncomeScore] = useState(0);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [advisorVal, setAdvisorVal] = useState('');
  const [advisorScore, setAdvisorScore] = useState(0);
  const [promptVal, setPromptVal] = useState('');
  const [promptScore, setPromptScore] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState('');
  const [qualified, setQualified] = useState<boolean | null>(null);
  const [fitScore, setFitScore] = useState(0);

  function calcScore() {
    let s = incomeScore + advisorScore + promptScore;
    if (challenges.length >= 2) s += 1;
    if (['tech', 'business'].includes(employment)) s += 1;
    return s;
  }

  function toggleChallenge(val: string) {
    setChallenges(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  function runAnalysis() {
    setAnalyzing(true);
    const msgs = ['Scoring your fit profile...', 'Reviewing your situation...', 'Finding your best next step...'];
    let i = 0;
    setAnalyzeMsg(msgs[0]);
    const iv = setInterval(() => { i++; if (i < msgs.length) setAnalyzeMsg(msgs[i]); }, 900);
    setTimeout(async () => {
      clearInterval(iv);
      const score = calcScore();
      const isQualified = score >= 4;
      setFitScore(score);
      setQualified(isQualified);
      await saveQualifierLead({
        name,
        email,
        phone,
        employment,
        income_range: income,
        challenges,
        advisor_status: advisorScore === 2 ? 'none' : advisorScore === 1 ? 'sorta_or_used' : 'yes',
        prompt: promptScore === 2 ? 'proactive_or_event' : promptScore === 1 ? 'market_or_content' : 'curious',
        fit_score: score,
        qualified: isQualified,
        created_at: new Date().toISOString(),
      });
      setAnalyzing(false);
      setStep(8);
    }, 2800);
  }

  // ─── Shared UI ──────────────────────────────────────────────────────────────

  const ProgressBar = () => (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-stone-500 uppercase tracking-widest font-medium">{STEPS[step - 1]?.label}</span>
        <span className="text-xs text-stone-500">Step {step} of 5</span>
      </div>
      <div className="flex gap-1.5">
        {STEPS.map(s => (
          <div key={s.num} className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${step >= s.num ? 'bg-emerald-500' : 'bg-stone-800'}`} />
        ))}
      </div>
    </div>
  );

  const OptCard = ({
    selected, onClick, label, sub,
  }: { selected: boolean; onClick: () => void; label: string; sub?: string }) => (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-all
        ${selected ? 'border-emerald-500 bg-emerald-950/20' : 'border-stone-800 bg-stone-900 hover:border-stone-700'}`}
    >
      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all
        ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-stone-600'}`}>
        {selected && <Check size={11} className="text-stone-950" />}
      </div>
      <div>
        <div className="text-sm font-medium text-stone-200">{label}</div>
        {sub && <div className="text-xs text-stone-500 mt-0.5">{sub}</div>}
      </div>
    </button>
  );

  const MultiCard = ({ val, label }: { val: string; label: string }) => {
    const sel = challenges.includes(val);
    return (
      <button onClick={() => toggleChallenge(val)}
        className={`w-full text-left flex items-center gap-3 p-4 rounded-xl border transition-all
          ${sel ? 'border-emerald-500 bg-emerald-950/20' : 'border-stone-800 bg-stone-900 hover:border-stone-700'}`}>
        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all
          ${sel ? 'bg-emerald-500 border-emerald-500' : 'border-stone-600'}`}>
          {sel && <Check size={11} className="text-stone-950" />}
        </div>
        <span className="text-sm font-medium text-stone-200">{label}</span>
      </button>
    );
  };

  const NextBtn = ({ onClick, label = 'Continue', disabled = false }: { onClick: () => void; label?: string; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}
      className={`w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
        ${disabled ? 'bg-stone-800 text-stone-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-stone-950'}`}>
      {label} <ArrowRight size={15} />
    </button>
  );

  const BackBtn = () => (
    <button onClick={() => setStep(s => s - 1)}
      className="flex items-center gap-2 text-stone-500 hover:text-stone-300 text-sm transition-colors mb-8">
      <ArrowLeft size={14} /> Back
    </button>
  );

  const SectionHead = ({ title, sub }: { title: string; sub: string }) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-stone-100 mb-2">{title}</h2>
      <p className="text-stone-400 text-sm leading-relaxed">{sub}</p>
    </div>
  );

  // ─── Nav ────────────────────────────────────────────────────────────────────

  const Nav = () => (
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
            <a href="/resources" className="hover:text-emerald-400 transition-colors">Resources</a>
            <a href="/#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
          </div>
          <button onClick={() => setIsPortalOpen(true)}
            className="bg-stone-100 text-stone-900 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-white transition-colors">
            Client Portal
          </button>
        </div>
      </div>
    </nav>
  );

  // ─── Portal modal ─────────────────────────────────────────────────────────

  const PortalModal = () => (
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
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-emerald-500 selection:text-white">
      <Nav />
      {isPortalOpen && <PortalModal />}

      <main className="py-20">
        <div className="max-w-lg mx-auto px-4">

          {/* Step 0: Intro */}
          {step === 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/40 rounded-full px-4 py-1.5 text-xs text-emerald-400 font-medium mb-6 uppercase tracking-widest">
                  <Activity size={12} /> Quick Fit Check
                </div>
                <h1 className="text-4xl font-bold text-stone-100 mb-5 leading-tight">
                  Find out if we are<br />the right fit.
                </h1>
                <p className="text-stone-400 text-base leading-relaxed mb-3 max-w-md mx-auto">
                  Six quick questions that tell you whether your situation is a strong match — and routes you straight to booking a call if it is.
                </p>
              </div>
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 mb-8 space-y-3">
                {[
                  'Whether your income and situation match who we work best with',
                  'Which tool or next step makes the most sense for you',
                  'No pitch. No spam. A clear answer in under 2 minutes.',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <span className="text-stone-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(1)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-base">
                Let's find out <ArrowRight size={18} />
              </button>
              <p className="text-center text-xs text-stone-600 mt-3">2 minutes. No email required to start.</p>
            </div>
          )}

          {/* Steps 1-5 */}
          {step >= 1 && step <= 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
              <ProgressBar />

              {/* Step 1: Employment */}
              {step === 1 && (
                <>
                  <SectionHead title="How would you describe your work situation?" sub="This helps us understand the complexity of your financial picture." />
                  <div className="space-y-3 mb-8">
                    {EMPLOYMENT_OPTS.map(o => (
                      <OptCard key={o.val} selected={employment === o.val} onClick={() => setEmployment(o.val)} label={o.label} sub={o.sub} />
                    ))}
                  </div>
                  <NextBtn onClick={() => setStep(2)} disabled={!employment} />
                </>
              )}

              {/* Step 2: Income */}
              {step === 2 && (
                <>
                  <BackBtn />
                  <SectionHead title="What is your household income range?" sub="Combined gross before taxes. There is no wrong answer — this helps route you to the right next step." />
                  <div className="space-y-3 mb-8">
                    {INCOME_OPTS.map(o => (
                      <OptCard key={o.val} selected={income === o.val} onClick={() => { setIncome(o.val); setIncomeScore(o.score); }} label={o.label} />
                    ))}
                  </div>
                  <NextBtn onClick={() => setStep(3)} disabled={!income} />
                </>
              )}

              {/* Step 3: Challenges */}
              {step === 3 && (
                <>
                  <BackBtn />
                  <SectionHead title="What is on your financial radar right now?" sub="Select everything that applies." />
                  <div className="space-y-3 mb-8">
                    {CHALLENGE_OPTS.map(o => <MultiCard key={o.val} val={o.val} label={o.label} />)}
                  </div>
                  <NextBtn onClick={() => setStep(4)} label="Continue" />
                </>
              )}

              {/* Step 4: Advisor status */}
              {step === 4 && (
                <>
                  <BackBtn />
                  <SectionHead title="Do you currently work with a financial advisor?" sub="No judgment either way — this just shapes what we recommend." />
                  <div className="space-y-3 mb-8">
                    {ADVISOR_OPTS.map(o => (
                      <OptCard key={o.val} selected={advisorVal === o.val} onClick={() => { setAdvisorVal(o.val); setAdvisorScore(o.score); }} label={o.label} sub={o.sub} />
                    ))}
                  </div>
                  <NextBtn onClick={() => setStep(5)} />
                </>
              )}

              {/* Step 5: Prompt */}
              {step === 5 && (
                <>
                  <BackBtn />
                  <SectionHead title="What is prompting you to look into this now?" sub="Honest answer is best — this shapes how Clark prepares for a potential conversation." />
                  <div className="space-y-3 mb-8">
                    {PROMPT_OPTS.map(o => (
                      <OptCard key={o.val} selected={promptVal === o.val} onClick={() => { setPromptVal(o.val); setPromptScore(o.score); }} label={o.label} />
                    ))}
                  </div>
                  <NextBtn onClick={() => setStep(6)} />
                </>
              )}
            </div>
          )}

          {/* Step 6: Email gate */}
          {step === 6 && (
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
              <BackBtn />
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-2xl font-bold text-stone-100 mb-2">Almost there</h2>
                <p className="text-stone-400 text-sm">Enter your details and we will show you your result and recommended next step.</p>
              </div>
              <div className="space-y-3 mb-6">
                <input type="text" placeholder="First name" value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3.5 text-stone-200 focus:border-emerald-500 focus:outline-none transition-colors" />
                <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3.5 text-stone-200 focus:border-emerald-500 focus:outline-none transition-colors" />
                <input type="tel" placeholder="Phone number (optional)" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3.5 text-stone-200 focus:border-emerald-500 focus:outline-none transition-colors" />
              </div>
              <button onClick={runAnalysis} disabled={!name || !email}
                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                  ${name && email ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950' : 'bg-stone-800 text-stone-600 cursor-not-allowed'}`}>
                See my result <ArrowRight size={15} />
              </button>
              <p className="text-[10px] text-stone-600 text-center mt-3 leading-relaxed">
                Your information is kept private and never sold. Jeffries Wealth Management, LLC.
              </p>
            </div>
          )}

          {/* Step 7: Analyzing */}
          {step === 7 || analyzing ? (
            <div className="text-center py-24 animate-in fade-in duration-300">
              <div className="w-14 h-14 border-2 border-stone-800 border-t-emerald-500 rounded-full mx-auto mb-8 animate-spin" />
              <h2 className="text-xl font-bold text-stone-100 mb-3">Reviewing your answers...</h2>
              <p className="text-stone-400 text-sm">{analyzeMsg}</p>
            </div>
          ) : null}

          {/* Step 8: Result */}
          {step === 8 && !analyzing && qualified !== null && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {qualified ? (
                <>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-900/30 border border-emerald-800/50 rounded-full flex items-center justify-center mx-auto mb-5">
                      <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
                        <path d="M2 11L10 19L26 3" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="text-xs text-emerald-400 uppercase tracking-widest font-medium mb-3">Strong fit</div>
                    <h2 className="text-3xl font-bold text-stone-100 mb-3">You are a strong fit.<br />Let's talk.</h2>
                    <p className="text-stone-400 text-sm leading-relaxed max-w-sm mx-auto">
                      Based on your answers, your situation has exactly the complexity — income structure, tax exposure, and growth opportunity — where coordinated financial planning pays for itself many times over.
                    </p>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 mb-6 space-y-3">
                    <p className="text-xs text-stone-500 uppercase tracking-widest font-medium">What a discovery call looks like</p>
                    {[
                      '15 minutes with Clark — no pitch, no obligation',
                      "We cover your biggest financial challenges and whether there's a fit",
                      'You leave knowing your clearest next move regardless of what you decide',
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        <span className="text-stone-300 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                  <a
                    href="https://calendly.com/jeffrieswealth/discoverycall"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-base mb-3">
                    Book my 15-minute discovery call <ArrowRight size={18} />
                  </a>
                  <a href="/wealthaudit"
                    className="w-full py-3 border border-stone-700 rounded-xl text-stone-400 hover:text-stone-200 hover:border-stone-600 text-sm font-medium flex items-center justify-center gap-2 transition-all">
                    Or start with the full wealth audit first
                  </a>
                </>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-stone-900 border border-stone-700 rounded-full flex items-center justify-center mx-auto mb-5">
                      <ArrowRight size={24} className="text-emerald-500" />
                    </div>
                    <div className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-3">Great starting point</div>
                    <h2 className="text-3xl font-bold text-stone-100 mb-3">Start with the full audit.</h2>
                    <p className="text-stone-400 text-sm leading-relaxed max-w-sm mx-auto">
                      The Human Capital Audit is the best way to get a clear, personalized picture of your financial situation — and figure out what would actually move the needle.
                    </p>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 mb-6 space-y-3">
                    <p className="text-xs text-stone-500 uppercase tracking-widest font-medium">What the audit gives you</p>
                    {[
                      'Your projected human capital — the real value of your earning years ahead',
                      'Key gaps across tax, cash flow, protection, and savings — severity-rated',
                      'A downloadable PDF report you keep regardless of next steps',
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        <span className="text-stone-300 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                  <a href="/wealthaudit"
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-base mb-3 block text-center">
                    Start my human capital audit <ArrowRight size={18} className="inline" />
                  </a>
                  <a href="mailto:clark@jeffrieswealth.com"
                    className="w-full py-3 border border-stone-700 rounded-xl text-stone-400 hover:text-stone-200 hover:border-stone-600 text-sm font-medium flex items-center justify-center gap-2 transition-all">
                    Or email Clark a question first
                  </a>
                </>
              )}
              <p className="text-center text-[10px] text-stone-600 mt-6 leading-relaxed">
                Jeffries Wealth Management, LLC &nbsp;·&nbsp; Fiduciary RIA &nbsp;·&nbsp; Marietta, GA<br />
                clark@jeffrieswealth.com &nbsp;·&nbsp; jeffrieswealth.com
              </p>
            </div>
          )}

        </div>
      </main>
      <Footer />
      <Analytics />
    </div>
  );
}
