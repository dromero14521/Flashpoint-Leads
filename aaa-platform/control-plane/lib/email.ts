// Email service skeleton - integrate with your preferred provider
// Recommended: Resend, SendGrid, or Postmark

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

class EmailService {
  private from = process.env.EMAIL_FROM || "Apex Automation <hello@apexautomation.io>";

  async send(options: EmailOptions): Promise<boolean> {
    // TODO: Implement with your email provider
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: this.from,
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html,
    // });

    console.log(`[Email] Would send to ${options.to}: ${options.subject}`);
    return true;
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: "Welcome to Apex Automation Architect",
      html: `
        <h1>Welcome${firstName ? `, ${firstName}` : ""}!</h1>
        <p>You've taken the first step toward automating your business.</p>
        <p>Here's what you can do next:</p>
        <ul>
          <li><strong>Generate your first blueprint</strong> - Describe your business and pain points</li>
          <li><strong>Take the automation audit</strong> - Discover how much you're losing to manual work</li>
          <li><strong>Book a strategy call</strong> - Get expert help implementing your automation</li>
        </ul>
        <p>Reply to this email if you have any questions. We're here to help.</p>
        <p>— The Apex Team</p>
      `,
    });
  }

  async sendAuditResults(
    email: string,
    results: { annualCost: number; potentialSavings: number }
  ): Promise<boolean> {
    const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    
    return this.send({
      to: email,
      subject: `Your Automation Audit Results: ${formatter.format(results.potentialSavings)}/year in potential savings`,
      html: `
        <h1>Your Automation Audit Results</h1>
        <p>Based on your responses, here's what we found:</p>
        
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #dc2626; margin: 0;">Current Cost of Manual Work</h2>
          <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">${formatter.format(results.annualCost)}/year</p>
        </div>
        
        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #059669; margin: 0;">Potential Annual Savings</h2>
          <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">${formatter.format(results.potentialSavings)}/year</p>
        </div>
        
        <p>Ready to capture these savings?</p>
        <p><a href="${process.env.NEXT_PUBLIC_URL}/sign-up" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Start Automating for Free</a></p>
        
        <p>Or, book a strategy call to discuss your custom automation plan:</p>
        <p><a href="${process.env.NEXT_PUBLIC_URL}/book-call">Book Strategy Call</a></p>
      `,
    });
  }

  async sendStrategyCallConfirmation(
    email: string,
    firstName: string
  ): Promise<boolean> {
    return this.send({
      to: email,
      subject: "Your Strategy Call is Confirmed",
      html: `
        <h1>Hi ${firstName}, your strategy call is confirmed!</h1>
        <p>We've received your request and will reach out within 24 hours to schedule your call.</p>
        
        <h2>What to Prepare</h2>
        <p>To make the most of our time together, please think about:</p>
        <ul>
          <li>Your top 3 operational bottlenecks</li>
          <li>Tools and systems you currently use</li>
          <li>Your revenue goals for the next 12 months</li>
        </ul>
        
        <p>Questions before the call? Just reply to this email.</p>
        <p>— The Apex Team</p>
      `,
    });
  }

  async sendNurtureEmail(
    email: string,
    emailNumber: number
  ): Promise<boolean> {
    const nurture = NURTURE_SEQUENCE[emailNumber - 1];
    if (!nurture) return false;

    return this.send({
      to: email,
      subject: nurture.subject,
      html: nurture.html,
    });
  }
}

const NURTURE_SEQUENCE = [
  {
    subject: "The biggest mistake I see in automation",
    html: `<p>Most business owners make the same mistake when they try to automate...</p>
           <p>They try to automate everything at once.</p>
           <p>The result? Overwhelm, abandoned projects, and wasted money.</p>
           <p>The secret is to start with ONE workflow. One that's painful, repetitive, and costing you money every day.</p>
           <p>What's yours?</p>
           <p>Hit reply and tell me. I read every response.</p>`,
  },
  {
    subject: "How one agency saved 36 hours/week",
    html: `<p>Case study time.</p>
           <p>Marcus runs a marketing agency. He was drowning in admin work.</p>
           <p>Client onboarding took 3 hours. Reporting took 5 hours every week. Invoice follow-ups ate another 4 hours.</p>
           <p>Today? All automated.</p>
           <p>Result: 36 hours/week back. Took on 4 new clients without adding staff.</p>
           <p>Want the same? <a href="${process.env.NEXT_PUBLIC_URL}/sign-up">Start your free blueprint</a></p>`,
  },
  {
    subject: "The hidden cost of waiting",
    html: `<p>Quick math:</p>
           <p>If you spend 10 hours/week on manual tasks at $100/hour value...</p>
           <p>That's $52,000/year.</p>
           <p>Every month you wait to automate costs you $4,333.</p>
           <p>What could you do with that money? Those hours?</p>
           <p><a href="${process.env.NEXT_PUBLIC_URL}/audit">Take the 2-minute audit</a> to see YOUR numbers.</p>`,
  },
];

export const emailService = new EmailService();
