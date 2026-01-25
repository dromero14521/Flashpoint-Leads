"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

interface UserData {
  firstName: string;
  tier: string;
  blueprintCount: number;
  blueprintsThisMonth: number;
  referralCode: string;
  referralCount: number;
}

interface Blueprint {
  id: string;
  industry: string;
  proposedArchitecture: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [recentBlueprints, setRecentBlueprints] = useState<Blueprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/blueprints").then((r) => r.json()),
    ]).then(([userData, blueprintsData]) => {
      setUserData(userData.user);
      setRecentBlueprints((blueprintsData.blueprints || []).slice(0, 3));
      setIsLoading(false);
    });
  }, []);

  const tierLimits: Record<string, number> = { free: 3, architect: -1, apex: -1 };
  const limit = tierLimits[userData?.tier || "free"];
  const used = userData?.blueprintsThisMonth || 0;
  const remaining = limit === -1 ? "∞" : limit - used;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            AAA Platform
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
            <Link href="/dashboard" className="text-white transition-colors">Dashboard</Link>
            <Link href="/dashboard/blueprints" className="hover:text-white transition-colors">Blueprints</Link>
            <Link href="/dashboard/settings" className="hover:text-white transition-colors">Settings</Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 max-w-7xl mx-auto px-6">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Welcome back, {userData?.firstName || "Architect"}
          </h1>
          <p className="text-slate-400 max-w-2xl">
            Manage your automation blueprints, track your progress, and scale your operations.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors">
            <div className="text-sm text-slate-400 mb-2">Total Blueprints</div>
            <div className="text-3xl font-bold text-white mb-2">{userData?.blueprintCount || 0}</div>
            <div className="text-xs text-emerald-400">All time</div>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors">
            <div className="text-sm text-slate-400 mb-2">This Month</div>
            <div className="text-3xl font-bold text-white mb-2">{used}</div>
            <div className="text-xs text-blue-400">{remaining} remaining</div>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors">
            <div className="text-sm text-slate-400 mb-2">Current Plan</div>
            <div className="text-3xl font-bold text-white mb-2 capitalize">{userData?.tier || "Free"}</div>
            {userData?.tier === "free" && (
              <Link href="/#pricing" className="text-xs text-indigo-400 hover:text-indigo-300">Upgrade →</Link>
            )}
          </div>
          
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors">
            <div className="text-sm text-slate-400 mb-2">Referrals</div>
            <div className="text-3xl font-bold text-white mb-2">{userData?.referralCount || 0}</div>
            <div className="text-xs text-purple-400">People referred</div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Quick Actions */}
          <div className="lg:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-white/10">
            <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/dashboard/new-blueprint"
                className="p-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-3"
              >
                <span className="text-2xl">+</span>
                <div>
                  <div>New Blueprint</div>
                  <div className="text-sm text-indigo-200">Generate automation architecture</div>
                </div>
              </Link>
              
              <Link
                href="/dashboard/blueprints"
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all border border-white/10 flex items-center gap-3"
              >
                <span className="text-2xl">📋</span>
                <div>
                  <div>View Blueprints</div>
                  <div className="text-sm text-slate-400">Browse all {userData?.blueprintCount || 0} blueprints</div>
                </div>
              </Link>
              
              <Link
                href="/dashboard/settings"
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all border border-white/10 flex items-center gap-3"
              >
                <span className="text-2xl">⚙️</span>
                <div>
                  <div>Settings</div>
                  <div className="text-sm text-slate-400">Manage your account</div>
                </div>
              </Link>
              
              <Link
                href="/book-call"
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all border border-white/10 flex items-center gap-3"
              >
                <span className="text-2xl">📞</span>
                <div>
                  <div>Book Strategy Call</div>
                  <div className="text-sm text-slate-400">Get expert help</div>
                </div>
              </Link>
            </div>
          </div>

          {/* System Status */}
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-white/10 flex flex-col">
            <h3 className="text-xl font-semibold mb-6">System Status</h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
              <h4 className="text-lg font-semibold mb-2">All Systems Operational</h4>
              <p className="text-slate-400 text-sm">GenAI Core: Online<br/>Control Plane: Online</p>
            </div>
          </div>
        </div>

        {/* Recent Blueprints */}
        {recentBlueprints.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Recent Blueprints</h3>
              <Link href="/dashboard/blueprints" className="text-sm text-indigo-400 hover:text-indigo-300">
                View all →
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {recentBlueprints.map((blueprint) => (
                <Link
                  key={blueprint.id}
                  href={`/dashboard/blueprints/${blueprint.id}`}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors group"
                >
                  <div className="text-sm text-indigo-400 mb-1">{blueprint.industry}</div>
                  <h4 className="font-semibold mb-2 group-hover:text-indigo-400 transition-colors">
                    {blueprint.proposedArchitecture || "Untitled Blueprint"}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        blueprint.status === "generated"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-500/20 text-slate-400"
                      }`}
                    >
                      {blueprint.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(blueprint.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {recentBlueprints.length === 0 && (
          <div className="text-center py-12 px-6 rounded-3xl bg-white/5 border border-white/10">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Ready to automate?</h3>
            <p className="text-slate-400 mb-6">Create your first blueprint to get started.</p>
            <Link
              href="/dashboard/new-blueprint"
              className="inline-block px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            >
              Create Your First Blueprint
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
