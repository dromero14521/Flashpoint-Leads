"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { use } from "react";

interface Blueprint {
  id: string;
  industry: string;
  revenueGoal: string;
  techStack: string;
  painPoints: string;
  strategicDiagnosis: string;
  proposedArchitecture: string;
  components: string;
  automationSteps: string;
  estimatedImpact: string;
  status: string;
  createdAt: string;
}

export default function BlueprintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/blueprints/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setBlueprint(data.blueprint);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blueprint not found</h1>
          <Link href="/dashboard/blueprints" className="text-indigo-400 hover:text-indigo-300">
            ← Back to blueprints
          </Link>
        </div>
      </div>
    );
  }

  const components = blueprint.components ? JSON.parse(blueprint.components) : [];
  const automationSteps = blueprint.automationSteps ? JSON.parse(blueprint.automationSteps) : [];
  const techStack = blueprint.techStack ? JSON.parse(blueprint.techStack) : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            AAA Platform
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/dashboard/blueprints" className="hover:text-white transition-colors">Blueprints</Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/blueprints" className="text-sm text-slate-400 hover:text-white mb-4 inline-block">
            ← Back to blueprints
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-indigo-400 mb-1">{blueprint.industry}</div>
              <h1 className="text-3xl font-bold">{blueprint.proposedArchitecture}</h1>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                blueprint.status === "generated"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : blueprint.status === "implemented"
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "bg-slate-500/20 text-slate-400"
              }`}
            >
              {blueprint.status}
            </span>
          </div>
          <div className="text-sm text-slate-500 mt-2">
            Created {new Date(blueprint.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Input Summary */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-sm text-slate-400 mb-1">Revenue Goal</div>
            <div className="font-medium">{blueprint.revenueGoal}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-sm text-slate-400 mb-1">Tech Stack</div>
            <div className="font-medium">{techStack.join(", ")}</div>
          </div>
        </div>

        {/* Pain Points */}
        <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-sm text-slate-400 mb-2">Original Pain Points</div>
          <div className="text-slate-300">{blueprint.painPoints}</div>
        </div>

        <div className="space-y-8">
          {/* Strategic Diagnosis */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/20">
            <h3 className="text-lg font-semibold text-red-400 mb-3">Strategic Diagnosis</h3>
            <p className="text-slate-300 leading-relaxed">{blueprint.strategicDiagnosis}</p>
          </div>

          {/* Components */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold text-purple-400 mb-4">System Components</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {components.map((comp: { name: string; tool: string }, i: number) => (
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
              {automationSteps.map((step: string, i: number) => (
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
            <p className="text-slate-300 leading-relaxed">{blueprint.estimatedImpact}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <button className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors">
            Export Blueprint
          </button>
          <Link
            href="/book-call"
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-center transition-colors border border-white/10"
          >
            Get Implementation Help
          </Link>
        </div>
      </main>
    </div>
  );
}
