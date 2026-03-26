
import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight, 
  Info, 
  Lock, 
  TrendingUp,
  X,
  ShieldCheck,
  Search,
  Home,
  Check,
  DollarSign,
  Percent,
  Activity,
  Wallet
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer
} from 'recharts';
import { FinancialInput, AIAnalysis } from '../types';
import { generateFinancialInsights } from '../engines/wealthAuditEngine';
import { logClientData } from '../services/loggingService';

// --- Helper: Tooltip Component ---
const FieldInfo: React.FC<{ text: string }> = ({ text }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative inline-block ml-1.5 align-middle group">
            <Info 
                size={14} 
                className="text-stone-500 cursor-help hover:text-emerald-500 transition-colors"
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
            />
            {show && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-stone-800 text-[10px] text-stone-200 rounded shadow-xl border border-stone-700 z-50 animate-in fade-in zoom-in duration-150 pointer-events-none">
                    {text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-stone-800"></div>
                </div>
            )}
        </div>
    );
};

// --- Helper: Formatted Simple Input ---
const FormattedInput: React.FC<{
    value: number;
    onChange: (val: number) => void;
    placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
    const formatNumber = (num: number) => num === 0 ? '' : new Intl.NumberFormat('en-US').format(num);
    const [localValue, setLocalValue] = useState<string>(formatNumber(value));

    useEffect(() => {
        if (document.activeElement?.tagName !== 'INPUT') {
            setLocalValue(formatNumber(value));
        }
    }, [value]);

    const handleBlur = () => {
        const parsed = parseInt(localValue.replace(/,/g, '')) || 0;
        onChange(parsed);
        setLocalValue(formatNumber(parsed));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^[0-9,]*$/.test(val)) {
            setLocalValue(val);
        }
    };

    return (
        <input 
            type="text" 
            inputMode="numeric"
            className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
        />
    );
};

// --- Helper: Tooltip for Chart ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl shadow-xl">
          <p className="text-stone-300 text-sm font-bold mb-2">Age {label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-stone-400">{entry.name}:</span>
              <span className="text-stone-100 font-mono">
                ${new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
};

// --- Initial State ---

const initialInput: FinancialInput = {
    firstName: '',
    age: 0,
    kidsCount: 0,
    filingStatus: 'Single',
    state: 'CA',
    financialObjectives: [],
    primaryConcern: '',
    jobTitle: '',
    employer: '',
    additionalNotes: '',
    annualBaseIncome: 0,
    annualVariableComp: 0,
    lastYearTotalComp: 0,
    equityCompensation: ['None'],
    equityGrantValue: 0,
    maxing401k: 'Unsure',
    hsaEligible: 'Unsure',
    hsaContributing: 'Unsure',
    hasCPA: 'No',
    hasSelfEmploymentIncome: false,
    hasRealEstateInvestments: false,
    monthlyTakeHome: 0,
    monthlySpending: 0,
    runsSurplus: 'Sometimes / Unsure',
    surplusAllocation: 'It varies / nothing consistent',
    hasSavingsSystem: false,
    netWorth: 0,
    retirementBalance: 0,
    retirementSplit: 'Roughly split',
    cashHoldings: 0,
    hasConcentratedPosition: false,
    housingStatus: 'rent',
    monthlyHousingPayment: 0,
    mortgageBalance: 0,
    homeValue: 0,
    disabilityCoverage: 'None',
    lifeInsuranceCoverage: 'None',
    hasWholeLife: 'No',
    hasUmbrella: 'No',
    hasEstatePlan: 'No',
    estateLastReviewed: 'Never / Unsure',
};

const Calculator: React.FC<{ onBook: (source?: 'general' | 'audit' | 'private-wealth' | 'discovery', data?: any) => void }> = ({ onBook }) => {
    const [inputs, setInputs] = useState<FinancialInput>(initialInput);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AIAnalysis | null>(null);
    const [activeSection, setActiveSection] = useState<number>(0);
    const [chartData, setChartData] = useState<any[]>([]);
    const [hasRun, setHasRun] = useState(false);
    
    const [analyzing, setAnalyzing] = useState(false);
    const [analyzeMessage, setAnalyzeMessage] = useState('');
    const [showGate, setShowGate] = useState(false);
    const [consentGiven, setConsentGiven] = useState(false);
  

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('audit') === 'true') {
            const calculatorElement = document.getElementById('calculator');
            if (calculatorElement) {
                calculatorElement.scrollIntoView({ behavior: 'smooth' });
                setActiveSection(0);
            }
        }
    }, []);
   // Restore from URL param or localStorage         
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('r');
      if (encoded) {
        try {
          const decoded = JSON.parse(atob(encoded));
          if (decoded.inputs) setInputs(decoded.inputs);
          if (decoded.result) {
            setResult(decoded.result);
            setChartData(decoded.chartData || []);
            setHasRun(true);
          }
          return;
        } catch (e) { /* ignore malformed param */ }
      }
      try {
        const saved = localStorage.getItem('jwm_audit_state');
        if (saved) {
          const { inputs: si, result: sr, chartData: sc, hasRun: shr } = JSON.parse(saved);
          if (si) setInputs(si);
          if (sr && shr) {
            setResult(sr);
            setChartData(sc || []);
            setHasRun(true);
          }
        }
      } catch (e) { /* ignore */ }
    }, []);

    const handleInputChange = (field: keyof FinancialInput, value: any) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    const toggleArraySelection = (field: keyof FinancialInput, value: string) => {
        setInputs(prev => {
            const currentArray = prev[field] as string[];
            if (currentArray.includes(value)) {
                return { ...prev, [field]: currentArray.filter(item => item !== value) };
            } else {
                return { ...prev, [field]: [...currentArray, value] };
            }
        });
    };

    const calculateProjections = (gross: number, surplus: number, netWorth: number) => {
        const data = [];
        let currentWealth = netWorth;
        let potentialWealth = netWorth;
        const years = 10;
        const currentAge = inputs.age > 0 ? inputs.age : 35;
        
        const annualSurplus = Math.max(0, surplus);
        const savingsRate = annualSurplus / Math.max(gross, 1);
        
        let statusQuoContribution = 0;
        let optimizedContribution = 0;

        // Banded contribution logic
        if (savingsRate <= 0) {
            statusQuoContribution = 0;
            optimizedContribution = 0.20 * gross;
        } else if (savingsRate < 0.20) {
            statusQuoContribution = 0.50 * annualSurplus;
            optimizedContribution = 0.20 * gross;
        } else {
            statusQuoContribution = 0.50 * annualSurplus;
            optimizedContribution = 1.00 * annualSurplus;
        }

        for (let i = 0; i <= years; i++) {
            data.push({
                year: currentAge + i,
                Current: Math.round(currentWealth),
                Potential: Math.round(potentialWealth),
            });
            // Update wealth using 6% compounding + annual contribution
            currentWealth = (currentWealth * 1.06) + statusQuoContribution;
            potentialWealth = (potentialWealth * 1.06) + optimizedContribution;
        }
        return data;
    };

    const handleInitialRunClick = () => {
        if (inputs.annualBaseIncome === 0) {
            alert("Please enter your income information before running the audit.");
            setActiveSection(1);
            return;
        }

        setAnalyzing(true);
        const messages = [
            "Calculating 2026 Tax Estimate...", 
            "Checking Risk Exposure...", 
            "Analyzing Liquidity Ratios...",
            "Identifying Wealth Leakage..."
        ];
        let i = 0;
        setAnalyzeMessage(messages[0]);
        const interval = setInterval(() => {
            i++;
            if (i < messages.length) setAnalyzeMessage(messages[i]);
        }, 1250);

        setTimeout(() => {
            clearInterval(interval);
            setAnalyzing(false);
            setShowGate(true);
        }, 5000);
    };

    const executeAudit = async () => {
        setShowGate(false);
        setLoading(true);
        const computedGross = inputs.annualBaseIncome + inputs.annualVariableComp;
        const computedSurplus = (inputs.monthlyTakeHome - inputs.monthlySpending) * 12;
        const chart = calculateProjections(computedGross, computedSurplus, inputs.netWorth);
        setChartData(chart);
        try {
            const analysis = await generateFinancialInsights(inputs);
            
            // Structure payload to match audit endpoint expectations
            logClientData('WEALTH_SIMULATOR', {
                lead: {
                    firstName: inputs.firstName,
                    lastName: inputs.lastName,
                    email: inputs.email,
                    phone: inputs.phone
                },
                keyFacts: analysis.keyFacts,
                compliance: analysis.compliance,
                publicInsights: analysis.publicInsights,
                consent: {
                    given: true,
                    timestamp: new Date().toISOString(),
                    text: 'I consent to Jeffries Wealth Management storing my inputs and the resulting educational insights for recordkeeping and follow-up.'
                }
            });
            
            setResult(analysis);
          const stateToSave = { inputs, result: analysis, chartData: chart, hasRun: true, timestamp: Date.now() };   
            localStorage.setItem('jwm_audit_state', JSON.stringify(stateToSave));                                       
            setHasRun(true);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setActiveSection(-1);
        }
    };

    const calculateHumanCapitalPotential = () => {
        let income = inputs.annualBaseIncome + inputs.annualVariableComp;
        const incomeGrowth = 0.03;
        const currentAge = inputs.age > 0 ? inputs.age : 35;
        const retirementAge = 60;
        const yearsToWork = Math.max(5, retirementAge - currentAge);
        let totalFutureIncome = 0;
        for (let i = 0; i < yearsToWork; i++) {
            totalFutureIncome += income;
            income = income * (1 + incomeGrowth);
        }
        return totalFutureIncome;
    };

  const copyShareableLink = () => {
      const base = window.location.origin + '/wealthaudit';
      const encoded = btoa(JSON.stringify({ inputs, result, chartData }));
      navigator.clipboard.writeText(`${base}?r=${encoded}`);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    };

    const clearAudit = () => {
      localStorage.removeItem('jwm_audit_state');
      setResult(null);
      setHasRun(false);
      setInputs(initialInput);
      setChartData([]);
      window.history.replaceState({}, '', window.location.pathname);
    };

    const downloadPDF = () => {
      if (!result) return;
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Wealth Audit — Jeffries Wealth Management</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 48px; color: #1c1917; max-width: 820px; margin: 0 auto; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e7e5e4; }
            .header h1 { font-size: 22px; font-weight: 800; color: #10b981; letter-spacing: -0.5px; }
            .header p { font-size: 11px; color: #78716c; margin-top: 4px; }
            .header .firm { text-align: right; font-size: 11px; color: #57534e; }
            .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #78716c; margin-bottom: 12px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
            .metric { border: 1px solid #e7e5e4; border-radius: 8px; padding: 14px; }
            .metric-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #a8a29e; margin-bottom: 6px; }
            .metric-value { font-size: 20px; font-weight: 800; color: #1c1917; letter-spacing: -0.5px; }
            .metric-value.green { color: #10b981; }
            .metric-value.red { color: #ef4444; }
            .insights { margin-bottom: 32px; }
            .insight { border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; border-left: 4px solid; }
            .insight.critical { background: #fef2f2; border-color: #ef4444; }
            .insight.warning { background: #fffbeb; border-color: #f59e0b; }
            .insight.info { background: #eff6ff; border-color: #3b82f6; }
            .insight.ok { background: #f0fdf4; border-color: #10b981; }
            .insight-tag { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
            .critical .insight-tag { color: #ef4444; }
            .warning .insight-tag { color: #f59e0b; }
            .info .insight-tag { color: #3b82f6; }
            .ok .insight-tag { color: #10b981; }
            .insight-title { font-weight: 700; font-size: 13px; color: #1c1917; margin-bottom: 3px; }
            .insight-desc { font-size: 11px; color: #57534e; line-height: 1.5; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e7e5e4; font-size: 9px; color: #a8a29e; line-height: 1.6; }
            .print-btn { background: #10b981; color: white; border: none; padding: 10px 22px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 700; margin-top: 24px; }
            @media print { .print-btn { display: none; } body { padding: 24px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Wealth Audit Results</h1>
              ${inputs.firstName ? `<p>Prepared for: <strong>${inputs.firstName}${inputs.lastName ? ' ' + inputs.lastName : ''}</strong></p>` : ''}
              <p>Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div class="firm">
              <strong>Jeffries Wealth Management, LLC</strong><br/>
              Fee-Only Financial Advisory<br/>
              jeffrieswealth.com
            </div>
          </div>
          <div class="section-title">Key Financial Metrics</div>
          <div class="grid">
            <div class="metric">
              <div class="metric-label">Total Compensation</div>
              <div class="metric-value">$${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(result.keyFacts.totalComp)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Est. Savings Rate</div>
              <div class="metric-value ${result.keyFacts.savingsRate >= 0.20 ? 'green' : result.keyFacts.savingsRate < 0.10 ? 'red' : ''}">${Math.round(result.keyFacts.savingsRate * 100)}%</div>
            </div>
            <div class="metric">
              <div class="metric-label">Est. Effective Tax Rate</div>
              <div class="metric-value">${(result.keyFacts.effectiveTaxRate * 100).toFixed(1)}%</div>
            </div>
            <div class="metric">
              <div class="metric-label">Est. Annual Tax</div>
              <div class="metric-value">$${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(result.keyFacts.totalTaxEst)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Monthly Surplus</div>
              <div class="metric-value ${result.keyFacts.monthlySurplus >= 0 ? 'green' : 'red'}">${result.keyFacts.monthlySurplus >= 0 ? '+' : ''}$${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(result.keyFacts.monthlySurplus)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Liquidity Runway</div>
              <div class="metric-value">${result.keyFacts.cashRunwayMonths.toFixed(1)} mo</div>
            </div>
            <div class="metric">
              <div class="metric-label">Investable Assets</div>
              <div class="metric-value">$${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(result.keyFacts.netWorthExHome)}</div>
            </div>
          </div>
          <div class="insights">
            <div class="section-title">Planning Observations</div>
            ${result.publicInsights.map((i: any) => `
              <div class="insight ${i.status}">
                <div class="insight-tag">${i.status}</div>
                <div class="insight-title">${i.title}</div>
                <div class="insight-desc">${i.description}</div>
              </div>
            `).join('')}
          </div>
          <div class="footer">
            <strong>Important Disclosures:</strong> This report is for general educational purposes only and does not constitute personalized investment, legal, or tax advice. Results are generated using a deterministic, rules-based framework based on user-provided inputs which have not been independently verified. Jeffries Wealth Management, LLC is a registered investment adviser.
          </div>
          <button class="print-btn" onclick="window.print()">Save as PDF (Print → Save as PDF)</button>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    };

    const emailResults = async () => {
      if (!result || !inputs.email) return;
      try {
        await logClientData('SEND_RESULTS_EMAIL', {
          lead: {
            firstName: inputs.firstName,
            lastName: inputs.lastName,
            email: inputs.email,
            phone: inputs.phone,
          },
          keyFacts: result.keyFacts,
          publicInsights: result.publicInsights,
          timestamp: new Date().toISOString(),
        });
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      } catch (e) {
        console.error('Email send failed:', e);
      }
    };

    const humanCapitalValue = calculateHumanCapitalPotential();
    const hasComplexEquity = inputs.equityCompensation.some(t => !['None', 'ESPP'].includes(t));

    return (
        <section className="py-24 bg-stone-950" id="calculator">
            <div className="max-w-4xl mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold text-stone-100 mb-4 font-display">Your Human Capital Audit</h2>
                    <p className="text-stone-400 text-lg max-w-2xl mx-auto mb-4">
                        <strong>Quantify</strong> your human capital, identify where your high income is leaking, and <strong>project</strong> the 10-year cost of the status quo.
                    </p>
                    <p className="text-[10px] text-stone-600 max-w-xl mx-auto uppercase tracking-wide leading-relaxed italic">
                        Disclaimer: This tool is for general educational purposes only and does not reflect tax, legal, or investment advice. Information is derived from user inputs which have not been independently verified for accuracy or completeness. Consult with a qualified professional before making any financial decisions.
                    </p>
                </div>

                {/* --- INPUT FORM --- */}
                <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-xl overflow-hidden mb-12">
                    
                    {/* SECTION 1: General Profile */}
                    <div className="border-b border-stone-800">
                        <button 
                            className="w-full flex items-center justify-between p-6 text-left hover:bg-stone-800 transition-colors"
                            onClick={() => setActiveSection(activeSection === 0 ? -1 : 0)}
                        >
                            <span className="text-lg font-bold text-stone-200 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-emerald-500 text-sm">1</div>
                                General Profile & Objectives
                            </span>
                            {activeSection === 0 ? <ChevronUp className="text-emerald-500"/> : <ChevronDown className="text-stone-500"/>}
                        </button>
                        {activeSection === 0 && (
                            <div className="p-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">First Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                            placeholder="Jane"
                                            value={inputs.firstName}
                                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Current Age</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                            placeholder="35"
                                            value={inputs.age === 0 ? '' : inputs.age}
                                            onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Current Job Title</label>
                                        <input type="text" className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200" 
                                            value={inputs.jobTitle} onChange={(e) => handleInputChange('jobTitle', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Current Employer</label>
                                        <input type="text" className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200" 
                                            value={inputs.employer} onChange={(e) => handleInputChange('employer', e.target.value)} />
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="text-xs text-stone-400 mb-1 block">Number of Children</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        className="w-full md:w-1/2 bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                        placeholder="0"
                                        value={inputs.kidsCount === 0 ? '0' : inputs.kidsCount}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            handleInputChange('kidsCount', isNaN(val) || val < 0 ? 0 : val);
                                        }}
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="text-xs text-stone-400 mb-2 block font-bold uppercase">Primary Financial Objectives</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            "Building long-term wealth", 
                                            "Reducing taxes", 
                                            "Creating consistency with variable income", 
                                            "Improving cash flow",
                                            "Optionality / early flexibility",
                                            "Preparing for a major life change",
                                            "Other"
                                        ].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => toggleArraySelection('financialObjectives', opt)}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 ${
                                                    inputs.financialObjectives.includes(opt)
                                                    ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400'
                                                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-600'
                                                }`}
                                            >
                                                {inputs.financialObjectives.includes(opt) && <Check size={12} />}
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="text-xs text-stone-400 mb-2 block font-bold uppercase">Primary Concern Right Now</label>
                                    <select 
                                        className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200 text-sm"
                                        value={inputs.primaryConcern}
                                        onChange={(e) => handleInputChange('primaryConcern', e.target.value)}
                                    >
                                        <option value="">Select one...</option>
                                        <option>I make good money but don’t feel ahead</option>
                                        <option>My income is volatile or unpredictable</option>
                                        <option>Taxes feel higher than they should be</option>
                                        <option>My finances feel disorganized</option>
                                        <option>I’m worried about risk or downside</option>
                                        <option>I’m not sure what to focus on next</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-stone-400 mb-1 block italic font-medium">Anything on your mind? (Optional)</label>
                                    <textarea 
                                        className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200 h-20 resize-none text-sm"
                                        placeholder="Additional context..."
                                        value={inputs.additionalNotes}
                                        onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                                    />
                                    <p className="text-[10px] text-red-400 mt-2 font-bold uppercase tracking-wider leading-relaxed">
                                        Compliance Reminder: Do not enter any personally identifiable or sensitive information (SSN, account numbers, etc).
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 2: Income & Tax */}
                    <div className="border-b border-stone-800">
                        <button 
                            className="w-full flex items-center justify-between p-6 text-left hover:bg-stone-800 transition-colors"
                            onClick={() => setActiveSection(activeSection === 1 ? -1 : 1)}
                        >
                            <span className="text-lg font-bold text-stone-200 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-emerald-500 text-sm">2</div>
                                Income & Tax Structure
                            </span>
                            {activeSection === 1 ? <ChevronUp className="text-emerald-500"/> : <ChevronDown className="text-stone-500"/>}
                        </button>
                        {activeSection === 1 && (
                            <div className="p-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Filing Status</label>
                                        <select className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                            value={inputs.filingStatus} onChange={(e) => handleInputChange('filingStatus', e.target.value)}>
                                            <option>Single</option>
                                            <option>Married Filing Jointly</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                         <label className="text-xs text-stone-400 mb-1 block">State of Residence</label>
                                         <select className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                            value={inputs.state} onChange={(e) => handleInputChange('state', e.target.value)}
                                        >
                                            {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => <option key={s} value={s}>{s}</option>)}
                                         </select>
                                    </div>
                                </div>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Annual Base Income (Before Tax)</label>
                                        <FormattedInput value={inputs.annualBaseIncome} onChange={(v) => handleInputChange('annualBaseIncome', v)} placeholder="$0" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Annual Variable Compensation (Bonus, Commish, etc.)</label>
                                        <FormattedInput value={inputs.annualVariableComp} onChange={(v) => handleInputChange('annualVariableComp', v)} placeholder="$0" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Total Compensation Last Year (Before Tax)</label>
                                        <FormattedInput value={inputs.lastYearTotalComp} onChange={(v) => handleInputChange('lastYearTotalComp', v)} placeholder="$0" />
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="text-xs text-stone-400 mb-2 block font-bold uppercase">Equity Compensation</label>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {["RSUs", "ISOs", "NSOs", "ESPP", "Other", "None"].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    if (type === 'None') handleInputChange('equityCompensation', ['None']);
                                                    else {
                                                        const current = inputs.equityCompensation.filter(t => t !== 'None');
                                                        if (current.includes(type)) {
                                                            const newArr = current.filter(t => t !== type);
                                                            handleInputChange('equityCompensation', newArr.length ? newArr : ['None']);
                                                        } else handleInputChange('equityCompensation', [...current, type]);
                                                    }
                                                }}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                                                    inputs.equityCompensation.includes(type)
                                                    ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400'
                                                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-600'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    {hasComplexEquity && (
                                        <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl animate-in slide-in-from-top-1 duration-200">
                                            <label className="text-xs text-stone-400 mb-1 block">
                                                Estimated Total Value of Your Equity Grant
                                                <FieldInfo text="Include the current market value of all unvested shares (RSUs) or the intrinsic value of options." />
                                            </label>
                                            <FormattedInput value={inputs.equityGrantValue} onChange={(v) => handleInputChange('equityGrantValue', v)} placeholder="$0" />
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Maxing Pre-Tax Retirement (401k)?</label>
                                        <select className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                            value={inputs.maxing401k} onChange={(e) => handleInputChange('maxing401k', e.target.value)}>
                                            <option>Yes</option>
                                            <option>No</option>
                                            <option>Unsure</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">HSA Eligible?</label>
                                        <select className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                            value={inputs.hsaEligible} onChange={(e) => handleInputChange('hsaEligible', e.target.value)}>
                                            <option>Yes</option>
                                            <option>No</option>
                                            <option>Unsure</option>
                                        </select>
                                    </div>
                                    {inputs.hsaEligible === 'Yes' && (
                                        <div className="col-span-full animate-in slide-in-from-top-1 duration-200 bg-stone-900/50 p-4 rounded-lg border border-emerald-900/30">
                                            <label className="text-xs text-stone-400 mb-1 block font-bold text-emerald-500">Are you contributing to your HSA?</label>
                                            <select className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                                value={inputs.hsaContributing} onChange={(e) => handleInputChange('hsaContributing', e.target.value)}>
                                                <option>Yes</option>
                                                <option>No</option>
                                                <option>Unsure</option>
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Do you work with a CPA?</label>
                                        <select className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                            value={inputs.hasCPA} onChange={(e) => handleInputChange('hasCPA', e.target.value)}>
                                            <option>Yes</option>
                                            <option>No</option>
                                            <option>Sometimes</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col justify-center space-y-2 pt-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" className="accent-emerald-500" checked={inputs.hasSelfEmploymentIncome} onChange={(e) => handleInputChange('hasSelfEmploymentIncome', e.target.checked)} />
                                            <span className="text-sm text-stone-300">Self-Employment / 1099 Income?</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" className="accent-emerald-500" checked={inputs.hasRealEstateInvestments} onChange={(e) => handleInputChange('hasRealEstateInvestments', e.target.checked)} />
                                            <span className="text-sm text-stone-300">Own Real Estate Investments?</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 3: Cash Flow */}
                    <div className="border-b border-stone-800">
                        <button 
                            className="w-full flex items-center justify-between p-6 text-left hover:bg-stone-800 transition-colors"
                            onClick={() => setActiveSection(activeSection === 2 ? -1 : 2)}
                        >
                            <span className="text-lg font-bold text-stone-200 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-emerald-500 text-sm">3</div>
                                Cash Flow & Savings System
                            </span>
                            {activeSection === 2 ? <ChevronUp className="text-emerald-500"/> : <ChevronDown className="text-stone-500"/>}
                        </button>
                        {activeSection === 2 && (
                            <div className="p-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Approx. Monthly Take-Home Income</label>
                                        <FormattedInput value={inputs.monthlyTakeHome} onChange={(v) => handleInputChange('monthlyTakeHome', v)} placeholder="$0" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">
                                            Approx. Monthly Spending
                                            <FieldInfo text="Include everything (mortgage/rent, utilities, food, etc.) but DO NOT include any savings or investment amounts." />
                                        </label>
                                        <FormattedInput value={inputs.monthlySpending} onChange={(v) => handleInputChange('monthlySpending', v)} placeholder="$0" />
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="text-xs text-stone-400 mb-1 block">Do you typically run a monthly surplus?</label>
                                    <div className="flex bg-stone-950 rounded-lg p-1 border border-stone-700">
                                        {['Yes', 'No', 'Sometimes / Unsure'].map(opt => (
                                            <button key={opt} className={`flex-1 py-2 text-xs md:text-sm rounded transition-all ${inputs.runsSurplus === opt ? 'bg-stone-800 text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
                                                onClick={() => handleInputChange('runsSurplus', opt)}>{opt}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Where does surplus usually go?</label>
                                        <select className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                            value={inputs.surplusAllocation} onChange={(e) => handleInputChange('surplusAllocation', e.target.value)}>
                                            <option>It varies / nothing consistent</option>
                                            <option>Retirement accounts</option>
                                            <option>Taxable investments</option>
                                            <option>Cash</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center">
                                         <label className="flex items-center gap-3 cursor-pointer p-4 bg-stone-900 border border-stone-800 rounded-lg w-full">
                                            <input type="checkbox" className="accent-emerald-500 w-5 h-5" checked={inputs.hasSavingsSystem} onChange={(e) => handleInputChange('hasSavingsSystem', e.target.checked)} />
                                            <span className="text-sm text-stone-300">I have a defined savings target or system</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: Assets */}
                    <div className="border-b border-stone-800">
                        <button 
                            className="w-full flex items-center justify-between p-6 text-left hover:bg-stone-800 transition-colors"
                            onClick={() => setActiveSection(activeSection === 3 ? -1 : 3)}
                        >
                             <span className="text-lg font-bold text-stone-200 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-emerald-500 text-sm">4</div>
                                Assets, Liabilities & Liquidity
                            </span>
                            {activeSection === 3 ? <ChevronUp className="text-emerald-500"/> : <ChevronDown className="text-stone-500"/>}
                        </button>
                        {activeSection === 3 && (
                            <div className="p-6 pt-0 animate-in slide-in-from-top-2 duration-200 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div>
                                        <label className="text-xs text-stone-400 mb-1 block">
                                            Approx. Net Worth (Exclude Primary Home)
                                            <FieldInfo text="Include retirement accounts, brokerage accounts, cash, physical gold, etc. Do not include cars or your primary residence value." />
                                        </label>
                                        <FormattedInput value={inputs.netWorth} onChange={(v) => handleInputChange('netWorth', v)} placeholder="$0" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Total Retirement Account Balance</label>
                                        <FormattedInput value={inputs.retirementBalance} onChange={(v) => handleInputChange('retirementBalance', v)} placeholder="$0" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Retirement Split (Roth vs Trad)</label>
                                        <select className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                            value={inputs.retirementSplit} onChange={(e) => handleInputChange('retirementSplit', e.target.value)}>
                                            <option>Roughly split</option>
                                            <option>Mostly Traditional</option>
                                            <option>Mostly Roth</option>
                                            <option>Unsure</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Total Cash Holdings</label>
                                        <FormattedInput value={inputs.cashHoldings} onChange={(v) => handleInputChange('cashHoldings', v)} placeholder="$0" />
                                    </div>
                                </div>
                                <div className="flex items-center py-2">
                                     <label className="flex items-center gap-3 cursor-pointer p-4 bg-stone-900 border border-stone-800 rounded-lg w-full">
                                        <input type="checkbox" className="accent-emerald-500 w-5 h-5" checked={inputs.hasConcentratedPosition} onChange={(e) => handleInputChange('hasConcentratedPosition', e.target.checked)} />
                                        <span className="text-sm text-stone-300">Do you hold a large concentrated position (single stock/equity)?</span>
                                    </label>
                                </div>
                                <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-lg">
                                    <div className="mb-4">
                                        <label className="text-xs text-stone-400 mb-1 block">Primary Residence Status</label>
                                        <div className="flex bg-stone-950 rounded-lg p-1 border border-stone-700 w-48">
                                            {['Rent', 'Own'].map(opt => (
                                                <button key={opt} className={`flex-1 py-2 text-sm rounded ${inputs.housingStatus === opt.toLowerCase() ? 'bg-stone-800 text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
                                                    onClick={() => handleInputChange('housingStatus', opt.toLowerCase())}>{opt}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {inputs.housingStatus === 'own' && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1">
                                            <div>
                                                <label className="text-xs text-stone-400 mb-1 block">Monthly Mortgage Payment</label>
                                                <FormattedInput value={inputs.monthlyHousingPayment} onChange={(v) => handleInputChange('monthlyHousingPayment', v)} placeholder="$0" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-stone-400 mb-1 block">Outstanding Balance</label>
                                                <FormattedInput value={inputs.mortgageBalance} onChange={(v) => handleInputChange('mortgageBalance', v)} placeholder="$0" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-stone-400 mb-1 block">Approx. Home Value</label>
                                                <FormattedInput value={inputs.homeValue} onChange={(v) => handleInputChange('homeValue', v)} placeholder="$0" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 5: Risk & Estate */}
                    <div className="border-b border-stone-800">
                        <button 
                            className="w-full flex items-center justify-between p-6 text-left hover:bg-stone-800 transition-colors"
                            onClick={() => setActiveSection(activeSection === 4 ? -1 : 4)}
                        >
                             <span className="text-lg font-bold text-stone-200 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-emerald-500 text-sm">5</div>
                                Risk, Protection & Estate
                            </span>
                            {activeSection === 4 ? <ChevronUp className="text-emerald-500"/> : <ChevronDown className="text-stone-500"/>}
                        </button>
                        {activeSection === 4 && (
                            <div className="p-6 pt-0 animate-in slide-in-from-top-2 duration-200 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Disability Insurance Coverage</label>
                                        <select className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                            value={inputs.disabilityCoverage} onChange={(e) => handleInputChange('disabilityCoverage', e.target.value)}>
                                            <option>None</option>
                                            <option>Through work</option>
                                            <option>Private policy</option>
                                            <option>Both</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Term Life Insurance Coverage</label>
                                        <select className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                            value={inputs.lifeInsuranceCoverage} onChange={(e) => handleInputChange('lifeInsuranceCoverage', e.target.value)}>
                                            <option>None</option>
                                            <option>Through work</option>
                                            <option>Private policy</option>
                                            <option>Both</option>
                                            <option>Not Applicable</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Do you own Whole/Permanent Life?</label>
                                        <select className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                            value={inputs.hasWholeLife} onChange={(e) => handleInputChange('hasWholeLife', e.target.value)}>
                                            <option>No</option>
                                            <option>Yes</option>
                                            <option>Unsure</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-stone-400 mb-1 block">Do you have Umbrella Liability?</label>
                                        <select className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                            value={inputs.hasUmbrella} onChange={(e) => handleInputChange('hasUmbrella', e.target.value)}>
                                            <option>No</option>
                                            <option>Yes</option>
                                            <option>Unsure</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="p-4 bg-stone-900 border border-stone-800 rounded-lg">
                                    <div className="mb-4">
                                        <label className="text-xs text-stone-400 mb-1 block">Do you have a Will or Trust?</label>
                                        <div className="flex bg-stone-950 rounded-lg p-1 border border-stone-700 w-full md:w-64">
                                            {['Yes', 'No', 'Unsure'].map(opt => (
                                                <button key={opt} className={`flex-1 py-2 text-sm rounded ${inputs.hasEstatePlan === opt ? 'bg-stone-800 text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
                                                    onClick={() => handleInputChange('hasEstatePlan', opt)}>{opt}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="animate-in fade-in">
                                        <label className="text-xs text-stone-400 mb-1 block">When were documents/beneficiaries last reviewed?</label>
                                        <select className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200"
                                            value={inputs.estateLastReviewed} onChange={(e) => handleInputChange('estateLastReviewed', e.target.value)}>
                                            <option>Within the last 3 years</option>
                                            <option>3–5 years ago</option>
                                            <option>More than 5 years ago</option>
                                            <option>Never / Unsure</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-6 bg-stone-900 border-t border-stone-800">
                        {analyzing ? (
                            <div className="w-full py-4 bg-stone-800 border border-stone-700 rounded-xl flex items-center justify-center gap-3 animate-pulse">
                                <Loader2 className="animate-spin text-emerald-500" />
                                <span className="text-emerald-400 font-bold tracking-wide">{analyzeMessage}</span>
                            </div>
                        ) : (
                            <button onClick={handleInitialRunClick} disabled={loading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                <Sparkles size={20} />
                                {loading ? 'Fetching Results...' : 'Run Audit'}
                            </button>
                        )}
                    </div>
                </div>

                {!hasRun && !loading && !analyzing && (
                    <div className="relative opacity-30 select-none pointer-events-none filter blur-sm">
                        <div className="bg-stone-900 border border-stone-800 h-64 rounded-2xl mb-8"></div>
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="bg-stone-950/80 p-6 rounded-xl border border-stone-800 text-center">
                                <Lock className="mx-auto mb-2 text-stone-500" />
                                <span className="text-stone-400 text-sm font-medium">Run Audit to Unlock Results</span>
                            </div>
                        </div>
                    </div>
                )}

                {result && hasRun && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       {/* Action bar — persistence + export */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-stone-900 border border-stone-800 rounded-xl">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={downloadPDF}
                              className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-xs font-semibold text-stone-300 transition-all"
                            >
                              <TrendingUp size={14} />
                              Download PDF
                            </button>
                          </div>
                          <button
                            onClick={clearAudit}
                            className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-red-400 transition-colors"
                          >
                            <X size={12} />
                            Clear & start over
                          </button>
                        </div>

                        {/* Key Financial Facts card — already exists, no change */}
                        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl flex flex-col">
                        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                                    <Activity size={20} className="text-emerald-500" />
                                    Key Financial Facts
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                                <div>
                                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Total Compensation</p>
                                    <p className="text-2xl font-bold text-stone-100">${new Intl.NumberFormat('en-US', { notation: "compact" }).format(result.keyFacts.totalComp)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                                        Est. Savings Rate
                                        <FieldInfo text="Estimated as (Take Home - Spending) ÷ Gross Income. Targets over 20% are generally considered strong for high earners." />
                                    </p>
                                    <p className={`text-2xl font-bold ${result.keyFacts.savingsRate < 0.10 ? 'text-red-400' : result.keyFacts.savingsRate < 0.20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {Math.round(result.keyFacts.savingsRate * 100)}%
                                    </p>
                                    <p className="text-[10px] text-stone-600">% of Gross Income</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                                        Est. Tax Rate
                                        <FieldInfo text="Uses 2026 federal income tax brackets and state tax rate assumptions, includes FICA. Uses standard deduction which may not be the best choice for you. Consult a tax advisor." />
                                    </p>
                                    <p className="text-2xl font-bold text-stone-100">{(result.keyFacts.effectiveTaxRate * 100).toFixed(1)}%</p>
                                    <p className="text-[10px] text-stone-600">Fed + State + FICA</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Est. Annual Tax</p>
                                    <p className="text-2xl font-bold text-stone-100">${new Intl.NumberFormat('en-US', { notation: "compact" }).format(result.keyFacts.totalTaxEst)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Monthly Surplus</p>
                                    <p className={`text-2xl font-bold ${result.keyFacts.monthlySurplus >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {result.keyFacts.monthlySurplus >= 0 ? '+' : ''}${new Intl.NumberFormat('en-US', { notation: "compact" }).format(result.keyFacts.monthlySurplus)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Liquidity Runway</p>
                                    <p className={`text-2xl font-bold ${result.keyFacts.cashRunwayMonths < 3 ? 'text-amber-400' : 'text-stone-100'}`}>{result.keyFacts.cashRunwayMonths.toFixed(1)} <span className="text-sm font-normal text-stone-500">mo</span></p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Investable Assets</p>
                                    <p className="text-2xl font-bold text-stone-100">${new Intl.NumberFormat('en-US', { notation: "compact" }).format(result.keyFacts.netWorthExHome)}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-stone-800 flex justify-center">
                                <p className="text-[10px] text-stone-500 text-center max-w-lg leading-tight uppercase font-medium">
                                    Hypothetical estimates based on user inputs. Educational purposes only. Not financial or tax advice. Use of standard deduction assumed.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-4 text-emerald-400">
                                    <TrendingUp size={20} />
                                    <span className="font-bold text-sm uppercase tracking-wider">Projected Human Capital</span>
                                </div>
                                <div className="text-4xl font-bold text-stone-100 mb-2 font-mono">${new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(humanCapitalValue)}</div>
                                <p className="text-stone-400 text-sm">Potential value of future earnings through age 60.</p>
                                <div className="mt-4 pt-4 border-t border-stone-800">
                                    <p className="text-[10px] text-stone-500 italic">
                                        * Calculated as the sum of projected gross income through age 60, assuming a 3% annual growth rate. This represents the total remaining value of your current earning power (Human Capital).
                                    </p>
                                </div>
                            </div>
                            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl flex flex-col justify-center">
                                <h3 className="text-xl font-bold text-stone-100 mb-4">What Stands Out From Your Audit</h3>
                                <div className="space-y-3">
                                    {result.publicInsights.slice(0, 3).map((insight, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            {insight.status === 'critical' ? <AlertCircle size={16} className="text-red-500 shrink-0"/> : 
                                             insight.status === 'warning' ? <AlertCircle size={16} className="text-amber-500 shrink-0"/> :
                                             insight.status === 'info' ? <Info size={16} className="text-blue-400 shrink-0"/> :
                                             <CheckCircle size={16} className="text-emerald-500 shrink-0"/>}
                                            <span className="text-stone-300 text-sm font-medium">{insight.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {result.publicInsights.map((insight, idx) => (
                                <div key={idx} className={`p-5 rounded-xl border ${insight.status === 'critical' ? 'bg-red-950/10 border-red-900/30' : insight.status === 'warning' ? 'bg-amber-950/10 border-amber-900/30' : insight.status === 'info' ? 'bg-blue-950/10 border-blue-900/30' : 'bg-emerald-950/10 border-emerald-900/30'}`}>
                                    <div className={`mb-2 font-bold text-[10px] uppercase tracking-widest ${insight.status === 'critical' ? 'text-red-400' : insight.status === 'warning' ? 'text-amber-400' : insight.status === 'info' ? 'text-blue-400' : 'text-emerald-400'}`}>
                                        {insight.status}
                                    </div>
                                    <h4 className="text-stone-200 font-bold text-sm mb-1">{insight.title}</h4>
                                    <p className="text-xs text-stone-400 leading-relaxed">{insight.description}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 shadow-xl">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-stone-100 mb-2">Illustrative 10-Year Opportunity Cost</h3>
                                    <p className="text-xs text-stone-500 leading-relaxed max-w-xl">
                                        This illustration compares two hypothetical planning behaviors over time based on different savings and reinvestment assumptions. It highlights how consistent savings and reinvestment behaviors can compound over long periods.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-wider font-bold shrink-0">
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Illustrative Optimized Scenario
                                    </div>
                                    <div className="flex items-center gap-2 text-stone-500">
                                        <div className="w-2.5 h-2.5 rounded-full bg-stone-600"></div> Illustrative Status Quo
                                    </div>
                                </div>
                            </div>
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorPotential" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                                        <XAxis dataKey="year" stroke="#57534e" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#57534e" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Area name="Illustrative Optimized Scenario" type="monotone" dataKey="Potential" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPotential)" />
                                        <Area name="Illustrative Status Quo" type="monotone" dataKey="Current" stroke="#57534e" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-8 pt-6 border-t border-stone-800 space-y-4">
                                <p className="text-[10px] text-stone-600 leading-relaxed">
                                    <span className="font-bold text-stone-500 uppercase tracking-widest block mb-1">Disclosure of Assumptions</span>
                                    Assumptions include a hypothetical 6% long-term real return and consistent annual contributions. The "Optimized Scenario" illustratively assumes a contribution level equal to either a 20% gross income benchmark (when current reported savings are below 20%) or 100% of the reported annual surplus (when savings are 20% or higher). The "Status Quo" scenario assumes that 50% of the current reported surplus is captured and reinvested, while the remaining half is hypothetically lost to lifestyle creep or cash flow inefficiencies. Actual market returns, personal behavior, tax outcomes, and financial circumstances can vary significantly from these models.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <p className="text-[9px] text-stone-700 leading-relaxed italic">
                                        <strong>Performance Disclaimer:</strong> This illustration is hypothetical and for educational purposes only. It does not represent actual investment performance and should not be interpreted as a forecast, recommendation, or guarantee of future results.
                                    </p>
                                    <p className="text-[9px] text-stone-700 leading-relaxed italic">
                                        <strong>Advisory Relationship Clarification:</strong> This illustration does not reflect the impact of any specific advisory service, investment strategy, or portfolio. It should not be relied upon as a substitute for personalized financial advice.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-stone-950 rounded-2xl p-8 border border-stone-800 text-center relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4"><Lock size={24} /></div>
                                <h3 className="text-2xl font-bold text-stone-100 mb-6 max-w-xl mx-auto">
                                    Your inputs surfaced several planning considerations worth deeper discussion.
                                </h3>
                                <button onClick={() => onBook('audit', inputs)} className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-stone-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-4">
                                    Review Your Results <ArrowRight className="ml-2 w-5 h-5" />
                                </button>
                                <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                                    Use this session to walk through context, assumptions, and potential next steps. No obligation.
                                </p>
                            </div>
                        </div>
                        
                        {/* Final Compliance Footer */}
                        <div className="text-[10px] text-stone-600 text-center max-w-2xl mx-auto space-y-2">
                            <p>Results are generated using a deterministic, rules-based framework and stored for record keeping purposes by Jeffries Wealth Management, LLC. Outputs are illustrative and provided for educational purposes only and do not constitute personalized financial advice.</p>
                            <p className="uppercase tracking-widest font-bold">This is not a substitute for professional financial or tax advice.</p>
                        </div>
                    </div>
                      </div>
                )}
            </div>

            {showGate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-sm" onClick={() => { setShowGate(false); setConsentGiven(false); }}></div>
                    <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4"><ShieldCheck size={24} /></div>
                            <h3 className="text-xl font-bold text-stone-100 mb-2">Unlock Your Report</h3>
                            <p className="text-sm text-stone-400">Enter your details to reveal your findings and projected wealth gap.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-200" placeholder="First Name" value={inputs.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} />
                                <input type="text" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-200" placeholder="Last Name" value={inputs.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} />
                            </div>
                            <input type="email" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-200" placeholder="Email Address" value={inputs.email} onChange={(e) => handleInputChange('email', e.target.value)} />
                            <input type="tel" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-200" placeholder="Phone Number" value={inputs.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
                            <label className="flex items-start gap-3 cursor-pointer p-3 bg-stone-950 border border-stone-800 rounded-lg hover:border-stone-700 transition-colors">
                                <input 
                                    type="checkbox" 
                                    className="accent-emerald-500 w-5 h-5 mt-0.5 cursor-pointer" 
                                    checked={consentGiven}
                                    onChange={(e) => setConsentGiven(e.target.checked)}
                                />
                                <span className="text-xs text-stone-300 leading-relaxed">
                                    I consent to Jeffries Wealth Management storing my inputs and the resulting educational insights for recordkeeping and follow-up.
                                </span>
                            </label>
                            <button 
                                onClick={() => { 
                                    if (inputs.email && inputs.firstName && consentGiven) {
                                        executeAudit(); 
                                    } else if (!inputs.email || !inputs.firstName) {
                                        alert("Please enter at least your Name and Email to proceed.");
                                    } else if (!consentGiven) {
                                        alert("Please provide consent to proceed.");
                                    }
                                }} 
                                disabled={!consentGiven}
                                className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                                    consentGiven 
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 cursor-pointer' 
                                        : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                                }`}
                            >
                                <Lock size={18} /> Unlock Results
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Calculator;
