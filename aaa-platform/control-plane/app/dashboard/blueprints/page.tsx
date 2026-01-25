"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

interface Blueprint {
  id: string;
  industry: string;
  revenueGoal: string;
  proposedArchitecture: string;
  status: string;
  isFavorite: boolean;
  createdAt: string;
}

interface UserData {
  id: string;
  email: string;
  firstName: string;
  tier: string;
  blueprintCount: number;
  blueprintsThisMonth: number;
  referralCode: string;
}

export default function BlueprintsPage() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "favorites">("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/blueprints").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
    ]).then(([blueprintsData, userData]) => {
      setBlueprints(blueprintsData.blueprints || []);
      setUserData(userData.user);
      setIsLoading(false);
    });
  }, []);

  const filteredBlueprints = blueprints.filter((b) =>
    filter === "favorites" ? b.isFavorite : true
  );

  const toggleFavorite = async (id: string, currentValue: boolean) => {
    await fetch(`/api/blueprints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !currentValue }),
    });
    setBlueprints((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isFavorite: !currentValue } : b))
    );
  };

  const deleteBlueprint = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blueprint?")) return;
    await fetch(`/api/blueprints/${id}`, { method: "DELETE" });
    setBlueprints((prev) => prev.filter((b) => b.id !== id));
  };

  const tierLimits: Record<string, number> = { free: 3, architect: -1, apex: -1 };
  const limit = tierLimits[userData?.tier || "free"];
  const remaining = limit === -1 ? "Unlimited" : `${limit - (userData?.blueprintsThisMonth || 0)} remaining`;

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
            <Link href="/dashboard/blueprints" className="text-white transition-colors">Blueprints</Link>
            <Link href="/dashboard/settings" className="hover:text-white transition-colors">Settings</Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Blueprints</h1>
            <p className="text-slate-400">
              {blueprints.length} total • {remaining} this month
            </p>
          </div>
          <Link
            href="/dashboard/new-blueprint"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            + New Blueprint
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("favorites")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "favorites" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            ⭐ Favorites
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredBlueprints.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏗️</div>
            <h3 className="text-xl font-semibold mb-2">No blueprints yet</h3>
            <p className="text-slate-400 mb-6">Create your first automation blueprint to get started.</p>
            <Link
              href="/dashboard/new-blueprint"
              className="inline-block px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            >
              Create Blueprint
            </Link>
          </div>
        )}

        {/* Blueprints Grid */}
        {!isLoading && filteredBlueprints.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlueprints.map((blueprint) => (
              <div
                key={blueprint.id}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-indigo-400 mb-1">{blueprint.industry}</div>
                    <h3 className="font-semibold">{blueprint.proposedArchitecture || "Untitled"}</h3>
                  </div>
                  <button
                    onClick={() => toggleFavorite(blueprint.id, blueprint.isFavorite)}
                    className="text-xl"
                  >
                    {blueprint.isFavorite ? "⭐" : "☆"}
                  </button>
                </div>

                <div className="text-sm text-slate-400 mb-4">
                  Goal: {blueprint.revenueGoal}
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      blueprint.status === "generated"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : blueprint.status === "implemented"
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {blueprint.status}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/dashboard/blueprints/${blueprint.id}`}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => deleteBlueprint(blueprint.id)}
                      className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500 mt-4">
                  {new Date(blueprint.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
