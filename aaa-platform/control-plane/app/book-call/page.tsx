"use client";

import { useState } from "react";
import Link from "next/link";

const INDUSTRIES = [
  "E-commerce",
  "SaaS / Tech",
  "Consulting / Coaching",
  "Marketing Agency",
  "Real Estate",
  "Healthcare",
  "Finance / Accounting",
  "Other",
];

const TIMELINES = [
  "Immediately - This is urgent",
  "Within 30 days",
  "1-3 months",
  "Just exploring options",
];

export default function BookCallPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    industry: "",
    revenue: "",
    teamSize: "",
    biggestChallenge: "",
    desiredOutcome: "",
    timeline: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/strategy-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Error booking call:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="max-w-md text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <span className="text-4xl">✓</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Call Booked!</h1>
          <p className="text-slate-400 mb-8">
            We&apos;ve received your request. Our team will reach out within 24 hours to confirm your strategy session.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

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

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left Column - Benefits */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">Book Your Strategy Session</h1>
              <p className="text-slate-400 text-lg">
                Get a personalized automation roadmap in a free 30-minute call with our team.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="font-semibold text-lg">What You&apos;ll Get:</h3>
              {[
                {
                  icon: "🎯",
                  title: "Deep Diagnosis",
                  description: "We'll uncover the exact bottlenecks costing you time and money",
                },
                {
                  icon: "🏗️",
                  title: "Custom Roadmap",
                  description: "A step-by-step plan tailored to your specific business",
                },
                {
                  icon: "💰",
                  title: "ROI Projection",
                  description: "Know exactly what automation will save you",
                },
                {
                  icon: "🚀",
                  title: "Quick Wins",
                  description: "Actionable items you can implement immediately",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-slate-400">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
                <div>
                  <div className="font-semibold">Apex Team</div>
                  <div className="text-sm text-slate-400">Automation Architects</div>
                </div>
              </div>
              <p className="text-sm text-slate-300 italic">
                &ldquo;We&apos;ve helped 100+ businesses save thousands of hours through strategic automation. Let us show you what&apos;s possible.&rdquo;
              </p>
            </div>
          </div>

          {/* Right Column - Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address *</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Industry *</label>
              <select
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">What&apos;s your biggest operational challenge? *</label>
              <textarea
                required
                rows={3}
                placeholder="E.g., I spend 10+ hours per week on manual data entry..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                value={formData.biggestChallenge}
                onChange={(e) => setFormData({ ...formData, biggestChallenge: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">What outcome are you hoping to achieve? *</label>
              <textarea
                required
                rows={3}
                placeholder="E.g., Save 20 hours per week and focus on growth..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                value={formData.desiredOutcome}
                onChange={(e) => setFormData({ ...formData, desiredOutcome: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Timeline</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
              >
                <option value="">When are you looking to start?</option>
                {TIMELINES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                "Request Strategy Call"
              )}
            </button>

            <p className="text-xs text-slate-500 text-center">
              By submitting, you agree to be contacted about our services. No spam, ever.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
