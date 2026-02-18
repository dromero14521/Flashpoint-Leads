"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BlueprintResult {
  strategic_diagnosis: string;
  proposed_architecture: string;
  components: Array<{ name: string; tool: string }>;
  automation_steps: string[];
  estimated_impact: string;
}

export default function NewBlueprintPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BlueprintResult | null>(null);
  const [blueprintId, setBlueprintId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    industry: "",
    revenueGoal: "",
    techStack: "",
    painPoints: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/blueprints/generate-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          techStack: formData.techStack.split(",").map((s) => s.trim()),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate blueprint");
      }

      setResult(data.raw);
      setBlueprintId(data.blueprint.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            AAA Platform
          </div>
          <a href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </a>
        </div>
      </nav>

      <main className="pt-24 pb-12 max-w-4xl mx-auto px-6">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Create New Blueprint</h1>
          <p className="text-slate-400">
            Tell us about your business and we&apos;ll generate a custom automation architecture.
          </p>
        </header>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/20 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Industry */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Industry / Niche *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., E-commerce, SaaS, Consulting, Real Estate"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            </div>

            {/* Revenue Goal */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Revenue Goal (12 months) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., $50,000/month, $500,000/year"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                value={formData.revenueGoal}
                onChange={(e) => setFormData({ ...formData, revenueGoal: e.target.value })}
              />
            </div>

            {/* Tech Stack */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Current Tech Stack *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Notion, Stripe, Zapier, Google Sheets (comma-separated)"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                value={formData.techStack}
                onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
              />
            </div>

            {/* Pain Points */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Core Pain Points *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe your biggest operational bottlenecks. What manual tasks are costing you the most time and money?"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                value={formData.painPoints}
                onChange={(e) => setFormData({ ...formData, painPoints: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating Blueprint...
                </>
              ) : (
                "Generate Automation Blueprint"
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-8">
            {/* Strategic Diagnosis */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/20">
              <h3 className="text-lg font-semibold text-red-400 mb-3">Strategic Diagnosis</h3>
              <p className="text-slate-300 leading-relaxed">{result.strategic_diagnosis}</p>
            </div>

            {/* Proposed Architecture */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-indigo-400 mb-3">Proposed Architecture</h3>
              <p className="text-2xl font-bold text-white">{result.proposed_architecture}</p>
            </div>

            {/* Components */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-purple-400 mb-4">System Components</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {result.components.map((comp, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="font-medium text-white">{comp.name}</div>
                    <div className="text-sm text-slate-400">{comp.tool}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Automation Steps */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">Implementation Steps</h3>
              <ol className="space-y-3">
                {result.automation_steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-slate-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-sm flex items-center justify-center">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Estimated Impact */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/20">
              <h3 className="text-lg font-semibold text-emerald-400 mb-3">Estimated Impact</h3>
              <p className="text-slate-300 leading-relaxed">{result.estimated_impact}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setBlueprintId(null);
                  setFormData({ industry: "", revenueGoal: "", techStack: "", painPoints: "" });
                }}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all border border-white/10"
              >
                Generate Another
              </button>
              <button
                onClick={() => router.push(`/dashboard/blueprints/${blueprintId}`)}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all"
              >
                View Full Blueprint
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
