"use client";

import { useState } from "react";
import Link from "next/link";

interface AuditResults {
  annualCost: number;
  potentialSavings: number;
  weeklySavings: number;
  hoursSavedPerWeek: number;
}

const PAIN_POINTS = [
  "Manual data entry between tools",
  "Customer support / email overload",
  "Invoice and payment processing",
  "Lead follow-up and nurturing",
  "Report generation",
  "Inventory / order management",
  "Scheduling and calendar management",
  "Social media posting",
  "Employee onboarding",
  "Client onboarding",
];

const TOOLS = [
  "Google Sheets",
  "Excel",
  "Notion",
  "Airtable",
  "Zapier",
  "Slack",
  "Trello",
  "Asana",
  "Monday.com",
  "ClickUp",
  "HubSpot",
  "Salesforce",
  "Stripe",
  "QuickBooks",
  "Mailchimp",
  "Other",
];

export default function AuditPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AuditResults | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    industry: "",
    monthlyRevenue: "",
    hoursOnManualTasks: 10,
    hourlyRate: 50,
    topPainPoints: [] as string[],
    currentTools: [] as string[],
    automationAttempts: "",
  });

  const handlePainPointToggle = (point: string) => {
    setFormData((prev) => ({
      ...prev,
      topPainPoints: prev.topPainPoints.includes(point)
        ? prev.topPainPoints.filter((p) => p !== point)
        : [...prev.topPainPoints, point],
    }));
  };

  const handleToolToggle = (tool: string) => {
    setFormData((prev) => ({
      ...prev,
      currentTools: prev.currentTools.includes(tool)
        ? prev.currentTools.filter((t) => t !== tool)
        : [...prev.currentTools, tool],
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setResults(data.results);
      setStep(5);
    } catch (error) {
      console.error("Error submitting audit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <nav className="border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            AAA Platform
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Progress */}
        {step < 5 && (
          <div className="mb-12">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    s <= step
                      ? "bg-indigo-600 text-white"
                      : "bg-white/10 text-slate-400"
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
            <div className="h-1 bg-white/10 rounded-full">
              <div
                className="h-1 bg-indigo-600 rounded-full transition-all"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Free Automation Audit</h1>
              <p className="text-slate-400">
                Discover how much time and money you&apos;re losing to manual processes.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Industry *</label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                >
                  <option value="">Select your industry</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="saas">SaaS / Tech</option>
                  <option value="consulting">Consulting / Coaching</option>
                  <option value="agency">Marketing Agency</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance / Accounting</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Monthly Revenue</label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  value={formData.monthlyRevenue}
                  onChange={(e) => setFormData({ ...formData, monthlyRevenue: e.target.value })}
                >
                  <option value="">Prefer not to say</option>
                  <option value="0-5k">$0 - $5,000</option>
                  <option value="5k-10k">$5,000 - $10,000</option>
                  <option value="10k-25k">$10,000 - $25,000</option>
                  <option value="25k-50k">$25,000 - $50,000</option>
                  <option value="50k-100k">$50,000 - $100,000</option>
                  <option value="100k+">$100,000+</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.email || !formData.industry}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Time Investment */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Time Investment</h1>
              <p className="text-slate-400">
                How much time do you spend on manual, repetitive tasks?
              </p>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium mb-4">
                  Hours per week on manual tasks: <span className="text-indigo-400">{formData.hoursOnManualTasks}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="40"
                  className="w-full accent-indigo-500"
                  value={formData.hoursOnManualTasks}
                  onChange={(e) => setFormData({ ...formData, hoursOnManualTasks: parseInt(e.target.value) })}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1 hr</span>
                  <span>20 hrs</span>
                  <span>40 hrs</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-4">
                  Your hourly rate (or value of time): <span className="text-indigo-400">${formData.hourlyRate}/hr</span>
                </label>
                <input
                  type="range"
                  min="25"
                  max="500"
                  step="25"
                  className="w-full accent-indigo-500"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) })}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>$25</span>
                  <span>$250</span>
                  <span>$500</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/20">
                <div className="text-sm text-red-400 mb-2">Current Annual Cost</div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(formData.hoursOnManualTasks * formData.hourlyRate * 52)}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  That&apos;s what you&apos;re paying for manual work each year
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pain Points */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Pain Points</h1>
              <p className="text-slate-400">
                Select the manual tasks that consume most of your time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PAIN_POINTS.map((point) => (
                <button
                  key={point}
                  onClick={() => handlePainPointToggle(point)}
                  className={`p-4 rounded-xl text-left text-sm transition-all ${
                    formData.topPainPoints.includes(point)
                      ? "bg-indigo-600 border-indigo-500"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  } border`}
                >
                  {point}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={formData.topPainPoints.length === 0}
                className="flex-1 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Current Tools */}
        {step === 4 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Current Tools</h1>
              <p className="text-slate-400">
                Select the tools you currently use in your business.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TOOLS.map((tool) => (
                <button
                  key={tool}
                  onClick={() => handleToolToggle(tool)}
                  className={`p-3 rounded-xl text-center text-sm transition-all ${
                    formData.currentTools.includes(tool)
                      ? "bg-indigo-600 border-indigo-500"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  } border`}
                >
                  {tool}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Have you tried automating before?
              </label>
              <textarea
                placeholder="Tell us about any previous automation attempts..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                rows={3}
                value={formData.automationAttempts}
                onChange={(e) => setFormData({ ...formData, automationAttempts: e.target.value })}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Get My Results"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && results && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
                ✓ Audit Complete
              </div>
              <h1 className="text-3xl font-bold mb-4">Your Automation Potential</h1>
            </div>

            <div className="grid gap-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/20">
                <div className="text-sm text-red-400 mb-2">Current Annual Cost of Manual Work</div>
                <div className="text-4xl font-bold text-white">{formatCurrency(results.annualCost)}</div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/20">
                <div className="text-sm text-emerald-400 mb-2">Potential Annual Savings</div>
                <div className="text-4xl font-bold text-white">{formatCurrency(results.potentialSavings)}</div>
                <div className="text-sm text-slate-400 mt-2">
                  That&apos;s {formatCurrency(results.weeklySavings)} per week or {results.hoursSavedPerWeek.toFixed(0)} hours saved
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-semibold mb-4">Your Top Automation Opportunities:</h3>
              <ul className="space-y-2">
                {formData.topPainPoints.slice(0, 3).map((point, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-300">
                    <span className="text-indigo-400">→</span> {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <Link
                href="/sign-up"
                className="block w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-center transition-colors"
              >
                Start Automating for Free
              </Link>
              <Link
                href="/book-call"
                className="block w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-center transition-colors border border-white/10"
              >
                Book a Strategy Call
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
