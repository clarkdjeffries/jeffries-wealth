import { useEffect, useRef, useState, useCallback } from 'react';

// ── Constants ────────────────────────────────────────────────────────────────
const REAL_RETURN = 0.06;

const BRACKETS: Record<string, [number, number][]> = {
  mfj:    [[23850,0.10],[96950,0.12],[206700,0.22],[394600,0.24],[501050,0.32],[751600,0.35],[1e12,0.37]],
  single: [[11925,0.10],[48475,0.12],[103350,0.22],[197300,0.24],[250525,0.32],[626350,0.35],[1e12,0.37]],
  hoh:    [[17000,0.10],[64850,0.12],[103350,0.22],[197300,0.24],[250500,0.32],[626350,0.35],[1e12,0.37]],
};
const STD_DED: Record<string, number> = { mfj: 32200, single: 16100, hoh: 24150 };
const STATE_RATES: Record<string, number> = {
  none:0,al:0.050,az:0.025,ar:0.047,ca:0.093,co:0.044,ct:0.065,de:0.066,fl:0,ga:0.0519,
  hi:0.079,id:0.058,il:0.0495,in:0.0305,ia:0.057,ks:0.057,ky:0.040,la:0.042,me:0.075,
  md:0.050,ma:0.050,mi:0.0425,mn:0.0785,ms:0.047,mo:0.048,mt:0.059,ne:0.0684,nv:0,
  nj:0.0637,nm:0.059,ny:0.0685,nc:0.0499,nd:0.029,oh:0.040,ok:0.050,or:0.099,pa:0.0307,
  ri:0.0599,sc:0.065,sd:0,tn:0,tx:0,ut:0.0465,vt:0.0875,va:0.0575,wa:0,wv:0.065,wi:0.0765,wy:0,
};
const STATES = [
  ['none','No State Tax'],['al','Alabama (5.0%)'],['az','Arizona (2.5%)'],['ar','Arkansas (4.7%)'],
  ['ca','California (9.3%)'],['co','Colorado (4.4%)'],['ct','Connecticut (6.5%)'],['de','Delaware (6.6%)'],
  ['fl','Florida (none)'],['ga','Georgia (5.19%)'],['hi','Hawaii (7.9%)'],['id','Idaho (5.8%)'],
  ['il','Illinois (4.95%)'],['in','Indiana (3.05%)'],['ia','Iowa (5.7%)'],['ks','Kansas (5.7%)'],
  ['ky','Kentucky (4.0%)'],['la','Louisiana (4.2%)'],['me','Maine (7.5%)'],['md','Maryland (5.0%)'],
  ['ma','Massachusetts (5.0%)'],['mi','Michigan (4.25%)'],['mn','Minnesota (7.85%)'],['ms','Mississippi (4.7%)'],
  ['mo','Missouri (4.8%)'],['mt','Montana (5.9%)'],['ne','Nebraska (6.84%)'],['nv','Nevada (none)'],
  ['nj','New Jersey (6.37%)'],['nm','New Mexico (5.9%)'],['ny','New York (6.85%)'],['nc','North Carolina (4.99%)'],
  ['nd','North Dakota (2.9%)'],['oh','Ohio (4.0%)'],['ok','Oklahoma (5.0%)'],['or','Oregon (9.9%)'],
  ['pa','Pennsylvania (3.07%)'],['ri','Rhode Island (5.99%)'],['sc','South Carolina (6.5%)'],
  ['sd','South Dakota (none)'],['tn','Tennessee (none)'],['tx','Texas (none)'],['ut','Utah (4.65%)'],
  ['vt','Vermont (8.75%)'],['va','Virginia (5.75%)'],['wa','Washington (none)'],['wv','West Virginia (6.5%)'],
  ['wi','Wisconsin (7.65%)'],['wy','Wyoming (none)'],
];

// ── Tax helpers ──────────────────────────────────────────────────────────────
function calcFedTax(gross: number, fs: string): number {
  const std = STD_DED[fs] ?? STD_DED.mfj;
  const taxable = Math.max(0, gross - std);
  const bkts = BRACKETS[fs] ?? BRACKETS.mfj;
  let tax = 0, prev = 0;
  for (const [ceil, rate] of bkts) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, ceil) - prev) * rate;
    prev = ceil;
  }
  return tax;
}
function calcFICA(g: number): number {
  return Math.min(g, 176100) * 0.062 + g * 0.0145 + Math.max(0, g - 200000) * 0.009;
}
function getTax(gross: number, fs: string, sk: string) {
  const fed = calcFedTax(gross, fs);
  const fica = calcFICA(gross);
  const state = gross * (STATE_RATES[sk] ?? 0);
  const total = fed + fica + state;
  return { rate: gross > 0 ? total / gross : 0, fed, fica, state };
}
function ytf(sav: number, port: number, fi: number): number {
  if (fi <= 0) return 0;
  if (port >= fi) return 0;
  if (sav <= 0) return 99;
  const r = REAL_RETURN;
  const n = Math.log((fi + sav / r) / (port + sav / r)) / Math.log(1 + r);
  return isFinite(n) && n >= 0 ? Math.min(n, 99) : 99;
}
const fmt  = (n: number) => '$' + Math.round(n).toLocaleString();
const fmtY = (n: number) => n >= 99 ? '99+' : n.toFixed(1);
const pct  = (n: number) => (n * 100).toFixed(1) + '%';

// ── Component ────────────────────────────────────────────────────────────────
export default function CalculatorPage() {
  const [base,       setBase]       = useState(150000);
  const [comm,       setComm]       = useState(50000);
  const [mortgage,   setMortgage]   = useState(2000);
  const [fixd,       setFixd]       = useState(2000);
  const [vari,       setVari]       = useState(4000);
  const [portfolio,  setPortfolio]  = useState(0);
  const [filing,     setFiling]     = useState('mfj');
  const [stateKey,   setStateKey]   = useState('ga');

  const chartRef  = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<any>(null);

  // Derived
  const ote      = base + comm;
  const tax      = getTax(ote, filing, stateKey);
  const net      = ote * (1 - tax.rate);
  const nb       = (base * (1 - tax.rate)) / 12;
  const nc       = (comm * (1 - tax.rate)) / 12;
  const spend    = mortgage + fixd + vari;
  const aspend   = spend * 12;
  const fiNum    = aspend * 25;
  const margin   = nb - spend;
  const savings  = Math.max(0, net - aspend);
  const savRate  = ote > 0 ? (savings / ote) * 100 : 0;
  const years    = ytf(savings, portfolio, fiNum);
  const extra5   = ote * 0.05;
  const hYears   = ytf(savings + extra5, portfolio, Math.max(0, aspend - extra5) * 25);
  const delta    = Math.max(0, years - hYears);
  const passing  = margin >= 0;

  // Chart update
  const updateChart = useCallback(() => {
    if (!chartInst.current) return;
    const labels: string[] = [];
    const data: number[]   = [];
    let userIdx = -1;
    for (let r = 1; r <= 55; r++) {
      const s = Math.min(ote * (r / 100), net);
      const y = ytf(s, portfolio, fiNum);
      labels.push(r + '%');
      data.push(parseFloat(y.toFixed(2)));
      if (Math.abs(r - savRate) < Math.abs((userIdx + 1) - savRate) || userIdx === -1) userIdx = r - 1;
    }
    const ptC = data.map((_, i) => i === userIdx ? '#ef4444' : 'rgba(0,0,0,0)');
    const ptR = data.map((_, i) => i === userIdx ? 6 : 0);
    chartInst.current.data.labels = labels;
    chartInst.current.data.datasets[0].data = data;
    chartInst.current.data.datasets[0].pointBackgroundColor = ptC;
    chartInst.current.data.datasets[0].pointRadius = ptR;
    chartInst.current.update('none');
  }, [ote, net, portfolio, fiNum, savRate]);

  // Init chart once Chart.js is loaded
  useEffect(() => {
    const init = () => {
      if (!chartRef.current || !(window as any).Chart) return;
      if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; }
      const Chart = (window as any).Chart;
      chartInst.current = new Chart(chartRef.current, {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: '#09C269', borderWidth: 2, pointBackgroundColor: [], pointBorderColor: [], pointRadius: [], tension: 0.35, fill: false }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          layout: { padding: { left: 12, top: 5 } },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1a1a1a', titleColor: '#09C269', bodyColor: '#a0a0a0',
              borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10,
              callbacks: {
                title: (c: any) => 'Savings Rate: ' + c[0].label,
                label:  (c: any) => 'Years to Freedom: ' + c.parsed.y.toFixed(1),
              },
            },
          },
          scales: {
            x: { ticks: { color: '#555', font: { family: 'inherit', size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }, grid: { color: 'rgba(255,255,255,0.05)' }, border: { color: 'rgba(255,255,255,0.1)' } },
            y: { min: 0, max: 50, ticks: { color: '#555', font: { family: 'inherit', size: 10 }, stepSize: 5, callback: (v: number) => v + ' yrs' }, grid: { color: 'rgba(255,255,255,0.05)' }, border: { color: 'rgba(255,255,255,0.1)' } },
          },
        },
      });
      updateChart();
    };

    if ((window as any).Chart) { init(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    script.onload = init;
    document.head.appendChild(script);
    return () => { chartInst.current?.destroy(); chartInst.current = null; };
  }, []);

  useEffect(() => { updateChart(); }, [updateChart]);

  // Reference table
  const third = Math.ceil(55 / 3);
  const closest = Math.round(savRate);
  const tableRows = Array.from({ length: third }, (_, i) => {
    const r1 = i + 1, r2 = i + 1 + third, r3 = i + 1 + third * 2;
    const cell = (r: number) => {
      if (r > 55) return <><td className="border border-white/5 px-3 py-1.5 text-center text-stone-600 text-[10px]">--</td><td className="border border-white/5 px-3 py-1.5 text-center text-stone-500">--</td></>;
      const s  = Math.min(ote * (r / 100), net);
      const y  = ytf(s, portfolio, fiNum);
      const hi = r === closest;
      const val = y >= 99 ? '99+' : y.toFixed(1) + ' yrs';
      return <>
        <td className={`border border-white/5 px-3 py-1.5 text-center text-[10px] ${hi ? 'bg-emerald-900/30 text-emerald-400 font-semibold' : 'text-stone-600'}`}>{r}%</td>
        <td className={`border border-white/5 px-3 py-1.5 text-center ${hi ? 'bg-emerald-900/30 text-emerald-400 font-semibold' : 'text-stone-400'}`}>{val}</td>
      </>;
    };
    return <tr key={i}>{cell(r1)}{cell(r2)}{cell(r3)}</tr>;
  });

  const inputCls = "bg-stone-900 border border-stone-700 rounded-lg text-stone-100 font-inherit text-xs px-3 py-1.5 w-32 text-right outline-none focus:border-emerald-500 focus:bg-emerald-950/20 transition-colors";
  const labelCls = "text-stone-400 text-xs";
  const derivedLabelCls = "text-stone-600 text-[10px] uppercase tracking-wider";
  const derivedValCls   = "text-stone-400 text-xs text-right";

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100" style={{ fontFamily: 'inherit' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-stone-950/80 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-stone-100 no-underline">
            <span className="text-emerald-500 text-lg">&#8592;</span>
            <span className="font-bold text-base tracking-tight">Jeffries Wealth</span>
          </a>
          <span className="text-[10px] text-stone-600 uppercase tracking-widest border border-stone-800 px-3 py-1 rounded-full">Financial Freedom Calculator</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-16">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-900/50 rounded-full px-3 py-1 text-[10px] text-emerald-400 uppercase tracking-widest mb-4">Planning Tool</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-100 leading-tight mb-3">How long until <span className="text-emerald-500">financial freedom?</span></h1>
          <p className="text-stone-400 text-sm max-w-xl leading-relaxed">Enter your income, expenses, and portfolio. See exactly where you stand — and what moving your savings rate by 5% actually does to your timeline.</p>
        </div>

        {/* Sections 1 + 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          {/* Section 1 */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 hover:border-stone-700 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold flex items-center justify-center">1</div>
              <div>
                <div className="text-xs font-semibold text-stone-200">Income Profile</div>
                <div className="text-[10px] text-stone-600">Filing status and gross compensation</div>
              </div>
            </div>
            <table className="w-full border-collapse">
              <tbody>
                {[
                  ['Filing Status', <select value={filing} onChange={e => setFiling(e.target.value)} className={inputCls + ' text-left w-32'}>
                    <option value="mfj">Married / Joint</option>
                    <option value="single">Single</option>
                    <option value="hoh">Head of Household</option>
                  </select>],
                  ['State', <select value={stateKey} onChange={e => setStateKey(e.target.value)} className={inputCls + ' text-left w-32'}>
                    {STATES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>],
                  ['Base Salary (Gross)', <div className="flex items-center gap-1 justify-end"><span className="text-stone-600 text-xs">$</span><input type="number" value={base} onChange={e => setBase(+e.target.value || 0)} className={inputCls} step={5000} min={0} /></div>],
                  ['Commission / Bonus', <div className="flex items-center gap-1 justify-end"><span className="text-stone-600 text-xs">$</span><input type="number" value={comm} onChange={e => setComm(+e.target.value || 0)} className={inputCls} step={5000} min={0} /></div>],
                ].map(([label, input], i, arr) => (
                  <tr key={i} className={i < arr.length - 1 ? 'border-b border-stone-800' : ''}>
                    <td className={labelCls + ' py-2'}>{label}</td>
                    <td className="py-2 text-right">{input}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 pt-3 border-t border-stone-800 space-y-1">
              {[
                ['Total OTE', fmt(ote)],
                ['Est. Effective Tax Rate', pct(tax.rate)],
                [<span className="pl-3">Federal Income Tax</span>, pct(tax.fed / (ote || 1))],
                [<span className="pl-3">FICA + Medicare</span>, pct(tax.fica / (ote || 1))],
                [<span className="pl-3">State Income Tax</span>, pct(tax.state / (ote || 1))],
                ['Net Base (Monthly)', fmt(nb) + '/mo'],
                ['Net Commission (Monthly)', fmt(nc) + '/mo'],
              ].map(([l, v], i) => (
                <div key={i} className="flex justify-between">
                  <span className={derivedLabelCls}>{l}</span>
                  <span className={derivedValCls}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 hover:border-stone-700 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold flex items-center justify-center">2</div>
              <div>
                <div className="text-xs font-semibold text-stone-200">The Live on Base Test</div>
                <div className="text-[10px] text-stone-600">Red = failing the strategy</div>
              </div>
            </div>
            <table className="w-full border-collapse">
              <tbody>
                {[
                  ['Monthly Mortgage / Rent', setMortgage, mortgage],
                  ['Fixed Bills (Cars, Ins, Util)', setFixd, fixd],
                  ['Variable (Food, Fun, Travel)', setVari, vari],
                  ['Current Portfolio Value', setPortfolio, portfolio],
                ].map(([label, setter, val], i, arr) => (
                  <tr key={i} className={i < arr.length - 1 ? 'border-b border-stone-800' : ''}>
                    <td className={labelCls + ' py-2'}>{label as string}</td>
                    <td className="py-2 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-stone-600 text-xs">$</span>
                        <input type="number" value={val as number} onChange={e => (setter as Function)(+e.target.value || 0)} className={inputCls} step={i === 3 ? 10000 : 100} min={0} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 pt-3 border-t border-stone-800 space-y-1 mb-4">
              {[['Total Monthly Spend', fmt(spend) + '/mo'], ['Annual Spend', fmt(aspend) + '/yr']].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className={derivedLabelCls}>{l}</span>
                  <span className={derivedValCls}>{v}</span>
                </div>
              ))}
            </div>
            <div className={`rounded-lg p-3 flex items-start gap-2 text-xs ${passing ? 'bg-emerald-950/40 border border-emerald-900/50' : 'bg-red-950/40 border border-red-900/50'}`}>
              <div className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 ${passing ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <div className={passing ? 'text-emerald-400' : 'text-red-400'}>
                <strong>{passing ? 'PASSING' : 'FAILING'}</strong> —{' '}
                {passing
                  ? `Live on Base margin: +${fmt(margin)}/mo`
                  : `Shortfall: ${fmt(Math.abs(margin))}/mo — lifestyle exceeds base salary`}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Output metrics */}
        <div className="text-[10px] text-stone-600 uppercase tracking-widest mb-2">3 — Financial Freedom Output</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            ['Years to Freedom', fmtY(years), 'at current savings rate', true],
            ['FI Number (25x)', fmt(fiNum), 'target portfolio', false],
            ['Current Portfolio', fmt(portfolio), 'starting point', false],
            ['Annual Savings', fmt(savings), 'potential per year', false],
          ].map(([label, val, sub, green]) => (
            <div key={label as string} className="bg-stone-900 border border-stone-800 rounded-xl p-4 hover:border-stone-700 transition-colors">
              <div className="text-[10px] text-stone-400 uppercase tracking-wider mb-2">{label}</div>
              <div className={`text-2xl font-bold leading-none mb-1 ${green ? 'text-emerald-500' : 'text-stone-100'}`}>{val}</div>
              <div className="text-[11px] text-stone-400">{sub}</div>
            </div>
          ))}
        </div>

        {/* Rate bar + insight */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] text-stone-600 uppercase tracking-wider">Gross Savings Rate</span>
            <span className="text-sm text-emerald-500 font-semibold">{savRate.toFixed(1)}%</span>
          </div>
          <div className="h-1 bg-stone-800 rounded-full mb-4">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: Math.min(savRate, 100) + '%' }} />
          </div>
          <div className="border-l-2 border-emerald-600 pl-3 text-xs text-stone-400 leading-relaxed">
            At your current savings rate, you reach financial freedom in <strong className="text-emerald-400">{fmtY(years)} years</strong>. Increasing your savings rate by 5% would cut <strong className="text-emerald-400">{delta.toFixed(1)} years</strong> off your timeline — savings go up <em>and</em> your FI target comes down.
          </div>
        </div>

        {/* Chart */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-4">
          <div className="text-[10px] text-stone-600 uppercase tracking-widest mb-4">Savings Rate vs. Years to Freedom — red dot shows where you are</div>
          <div style={{ position: 'relative', height: '300px' }}>
            <canvas ref={chartRef} />
          </div>
        </div>

        {/* Reference table */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-8">
          <div className="text-[10px] text-stone-600 uppercase tracking-widest mb-4">Reference Table</div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {['Rate','Years','Rate','Years','Rate','Years'].map((h, i) => (
                    <th key={i} className="bg-stone-950 border border-stone-800 px-3 py-2 text-center text-[10px] text-stone-600 uppercase tracking-wider font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{tableRows}</tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-stone-800 pt-5 text-[10px] text-stone-600 leading-relaxed">
          <strong className="text-stone-500">Important Disclosures:</strong> This tool is for educational and informational purposes only and does not constitute investment, legal, or tax advice. Assumed real return of 6% annualized net of inflation — market returns are volatile and cannot be guaranteed. Federal tax calculated using 2026 brackets and standard deductions. State tax uses approximate effective rates. FICA includes Social Security (6.2% up to $176,100), Medicare (1.45%), and the 0.9% Additional Medicare Tax above $200,000. Pre-tax contributions (401k, HSA) may reduce your effective tax rate and improve outcomes beyond what this model shows. This model excludes Social Security income, which may meaningfully reduce your required portfolio in traditional retirement. It assumes current monthly expenses continue in retirement — actual retirement spending is often lower. "Financial Freedom" is defined as the point where a 4% annual withdrawal from the portfolio covers projected spending. Past performance is not indicative of future results. Jeffries Wealth Management is a registered investment adviser.
        </div>

      </div>
    </div>
  );
}
