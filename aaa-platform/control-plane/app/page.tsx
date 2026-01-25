import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            AAA Platform
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/sign-in" 
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className="text-sm font-medium px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-6 pt-24 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              Now in Public Beta
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Transform Manual Chaos Into
              <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Automated Profit
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              The Apex Automation Architect uses AI to diagnose your business bottlenecks and generate production-ready automation blueprints in minutes, not months.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
              >
                Start Free Diagnostic
              </Link>
              <Link
                href="#how-it-works"
                className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all border border-white/10"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🎯",
                title: "Diagnostic Engine",
                description: "Input your pain points, industry, and goals. Our AI analyzes and identifies the exact bottlenecks costing you money."
              },
              {
                icon: "🏗️",
                title: "Blueprint Generator",
                description: "Receive a custom automation architecture tailored to your tech stack and revenue targets."
              },
              {
                icon: "🚀",
                title: "One-Click Deploy",
                description: "Export to Zapier, n8n, or get white-glove implementation from our Apex team."
              }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all group">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-400 text-lg">From chaos to clarity in 3 simple steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Complete the Diagnostic",
                description: "Tell us about your business, tech stack, and the operational pain points costing you time and money."
              },
              {
                step: "02",
                title: "Receive Your Blueprint",
                description: "Our AI analyzes your inputs and generates a custom automation architecture tailored to your goals."
              },
              {
                step: "03",
                title: "Implement & Scale",
                description: "Follow the step-by-step guide to build yourself, or let our team handle the full implementation."
              }
            ].map((item, i) => (
              <div key={i} className="relative p-8 rounded-3xl bg-white/5 border border-white/10">
                <div className="text-6xl font-bold text-white/5 absolute top-4 right-6">{item.step}</div>
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Social Proof */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Results That Speak</h2>
            <p className="text-slate-400 text-lg">Real outcomes from real businesses</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "We recovered $4,500 in abandoned cart revenue in the first month. The ROI was immediate.",
                author: "Sarah K.",
                role: "E-commerce Owner",
                result: "$4,500/mo recovered"
              },
              {
                quote: "90% of our admin work is now automated. I finally have time to focus on client delivery.",
                author: "Marcus T.",
                role: "Agency Founder",
                result: "36 hrs/week saved"
              },
              {
                quote: "The blueprint identified bottlenecks I didn&apos;t even know existed. Game changer.",
                author: "Jessica R.",
                role: "SaaS Founder",
                result: "3x faster onboarding"
              }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10">
                <div className="text-indigo-400 text-sm font-medium mb-4">{item.result}</div>
                <p className="text-slate-300 leading-relaxed mb-6">&ldquo;{item.quote}&rdquo;</p>
                <div>
                  <div className="font-semibold">{item.author}</div>
                  <div className="text-sm text-slate-400">{item.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Lead Magnets CTA */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-8">
            <Link 
              href="/audit"
              className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 hover:border-indigo-500/40 transition-all group"
            >
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">Free Automation Audit</h3>
              <p className="text-slate-400 mb-4">Discover how much time and money you&apos;re losing to manual processes. Takes 2 minutes.</p>
              <span className="text-indigo-400 font-medium">Take the audit →</span>
            </Link>
            
            <Link 
              href="/book-call"
              className="p-8 rounded-3xl bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
            >
              <div className="text-4xl mb-4">📞</div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">Book a Strategy Call</h3>
              <p className="text-slate-400 mb-4">Get a personalized automation roadmap from our team. Free 30-minute consultation.</p>
              <span className="text-emerald-400 font-medium">Book your call →</span>
            </Link>
          </div>
        </section>

        {/* Pricing Preview */}
        <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 text-lg">Start free. Scale when you&apos;re ready.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                tier: "Tier 1",
                name: "Explorer",
                price: "Free",
                description: "Perfect for testing the waters",
                features: ["3 Blueprint generations/mo", "Basic integrations", "Community support"],
                cta: "Get Started Free",
                href: "/sign-up"
              },
              {
                tier: "Tier 2",
                name: "Architect",
                price: "$99",
                period: "/month",
                description: "For growing businesses",
                features: ["Unlimited blueprints", "All integrations", "Priority support", "Custom templates", "Advanced AI models"],
                highlighted: true,
                cta: "Start 14-Day Trial",
                href: "/sign-up"
              },
              {
                tier: "Tier 3",
                name: "Apex",
                price: "$2,500",
                period: " one-time",
                description: "White-glove implementation",
                features: ["Everything in Architect", "1:1 Strategy Session", "Done-for-you setup", "90-day support", "Custom integrations"],
                cta: "Book Strategy Call",
                href: "/book-call"
              }
            ].map((plan, i) => (
              <div 
                key={i} 
                className={`p-8 rounded-3xl border transition-all ${
                  plan.highlighted 
                    ? "bg-gradient-to-b from-indigo-900/40 to-purple-900/40 border-indigo-500/50 scale-105" 
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="text-sm text-indigo-400 font-medium mb-2">{plan.tier}</div>
                <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-slate-400">{plan.period}</span>}
                </div>
                <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-400">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full py-3 rounded-xl font-medium text-center transition-all ${
                    plan.highlighted
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-6 py-20">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Automate?</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              Stop trading hours for dollars. Start building systems that scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-500/25"
              >
                Start Free Today
              </Link>
              <Link
                href="/audit"
                className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all border border-white/10"
              >
                Take the Free Audit
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 mt-20">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                  AAA Platform
                </div>
                <p className="text-sm text-slate-400">
                  Transform manual chaos into automated profit with AI-powered automation blueprints.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                  <li><Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link href="/audit" className="hover:text-white transition-colors">Free Audit</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/book-call" className="hover:text-white transition-colors">Contact</Link></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Connect</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-white/10 text-center text-sm text-slate-500">
              © 2026 Apex Automation Architect. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
