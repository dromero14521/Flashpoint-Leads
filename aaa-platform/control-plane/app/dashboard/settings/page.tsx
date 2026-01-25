"use client";

import { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: string;
  stripeCustomerId: string | null;
  stripeCurrentPeriodEnd: string | null;
  referralCode: string;
  referralCount: number;
  settings: {
    emailNotifications: boolean;
    marketingEmails: boolean;
    weeklyDigest: boolean;
    defaultModel: string;
    timezone: string;
  } | null;
}

const MODELS = [
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (Recommended)" },
  { id: "anthropic/claude-3-opus", name: "Claude 3 Opus" },
  { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo" },
  { id: "openai/gpt-4o", name: "GPT-4o" },
  { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5" },
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function SettingsPage() {
  const { user: clerkUser } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    emailNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
    defaultModel: "anthropic/claude-3.5-sonnet",
    timezone: "America/New_York",
  });

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((data) => {
        setUserData(data.user);
        if (data.user?.settings) {
          setFormData({
            emailNotifications: data.user.settings.emailNotifications,
            marketingEmails: data.user.settings.marketingEmails,
            weeklyDigest: data.user.settings.weeklyDigest,
            defaultModel: data.user.settings.defaultModel,
            timezone: data.user.settings.timezone,
          });
        }
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: formData }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to save settings." });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManageBilling = async () => {
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const copyReferralLink = () => {
    if (userData?.referralCode) {
      navigator.clipboard.writeText(`${window.location.origin}?ref=${userData.referralCode}`);
      setMessage({ type: "success", text: "Referral link copied!" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const tierInfo = {
    free: { name: "Free", color: "text-slate-400" },
    architect: { name: "Architect", color: "text-indigo-400" },
    apex: { name: "Apex", color: "text-purple-400" },
  };

  const currentTier = tierInfo[userData?.tier as keyof typeof tierInfo] || tierInfo.free;

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
            <Link href="/dashboard/settings" className="text-white transition-colors">Settings</Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              message.type === "success"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/20 text-red-400 border border-red-500/20"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-8">
          {/* Profile Section */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold mb-6">Profile</h2>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
                {clerkUser?.firstName?.[0] || "U"}
              </div>
              <div>
                <div className="font-semibold text-lg">
                  {clerkUser?.firstName} {clerkUser?.lastName}
                </div>
                <div className="text-slate-400">{userData?.email}</div>
                <div className={`text-sm ${currentTier.color}`}>{currentTier.name} Plan</div>
              </div>
            </div>
          </section>

          {/* Subscription Section */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold mb-6">Subscription</h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium">Current Plan</div>
                <div className={`text-lg ${currentTier.color}`}>{currentTier.name}</div>
              </div>
              {userData?.stripeCurrentPeriodEnd && (
                <div className="text-sm text-slate-400">
                  Renews {new Date(userData.stripeCurrentPeriodEnd).toLocaleDateString()}
                </div>
              )}
            </div>
            <div className="flex gap-4">
              {userData?.tier === "free" ? (
                <Link
                  href="/#pricing"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                >
                  Upgrade Plan
                </Link>
              ) : (
                <button
                  onClick={handleManageBilling}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10"
                >
                  Manage Billing
                </button>
              )}
            </div>
          </section>

          {/* Notifications Section */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold mb-6">Notifications</h2>
            <div className="space-y-4">
              {[
                { key: "emailNotifications", label: "Email Notifications", description: "Receive updates about your blueprints" },
                { key: "weeklyDigest", label: "Weekly Digest", description: "Summary of your automation metrics" },
                { key: "marketingEmails", label: "Marketing Emails", description: "Tips, tutorials, and product updates" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-slate-400">{item.description}</div>
                  </div>
                  <button
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key as keyof typeof prev],
                      }))
                    }
                    className={`w-12 h-6 rounded-full transition-colors ${
                      formData[item.key as keyof typeof formData]
                        ? "bg-indigo-600"
                        : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transform transition-transform ${
                        formData[item.key as keyof typeof formData]
                          ? "translate-x-6"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Preferences Section */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold mb-6">Preferences</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Default AI Model</label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  value={formData.defaultModel}
                  onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                >
                  {MODELS.map((model) => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Referral Section */}
          <section className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20">
            <h2 className="text-xl font-semibold mb-4">Refer & Earn</h2>
            <p className="text-slate-400 mb-4">
              Share your referral link and earn rewards when friends sign up.
            </p>
            <div className="flex gap-4 items-center mb-4">
              <code className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm">
                {typeof window !== "undefined" && `${window.location.origin}?ref=${userData?.referralCode}`}
              </code>
              <button
                onClick={copyReferralLink}
                className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="text-sm text-slate-400">
              You&apos;ve referred <span className="text-indigo-400 font-medium">{userData?.referralCount || 0}</span> people
            </div>
          </section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
