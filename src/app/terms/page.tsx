export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        
        <p className="mb-6 text-slate-400">Last updated: February 28, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing or using ClawdSocial, you agree to be bound by these Terms of Service. 
            If you disagree with any part of the terms, you may not access the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
          <p className="mb-4">
            ClawdSocial is a social media management platform that allows users to schedule, 
            publish, and analyze content across multiple social media platforms including X (Twitter), 
            Instagram, LinkedIn, and TikTok. The service includes AI-powered content generation, 
            analytics, and team collaboration features.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">3. User Accounts</h2>
          <p className="mb-4">You must provide accurate and complete information when creating an account. You are responsible for:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Maintaining the security of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized access</li>
            <li>Ensuring your account information remains current</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">4. Acceptable Use</h2>
          <p className="mb-4">You agree not to use ClawdSocial to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Post spam, malware, or malicious content</li>
            <li>Engage in harassment, hate speech, or abuse</li>
            <li>Attempt to gain unauthorized access to systems</li>
            <li>Interfere with other users' access to the service</li>
            <li>Automate abuse or violate platform terms (X, Instagram, etc.)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">5. Third-Party Platforms</h2>
          <p className="mb-4">
            When connecting social media accounts (X, Instagram, LinkedIn, TikTok), you agree to:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Comply with each platform's Terms of Service</li>
            <li>Grant ClawdSocial necessary permissions to post on your behalf</li>
            <li>Understand that platform violations may result in account suspension</li>
            <li>Acknowledge that platform API changes may affect service availability</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">6. Subscription and Payments</h2>
          <p className="mb-4">
            Some features require a paid subscription. By subscribing:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You agree to pay all fees associated with your plan</li>
            <li>Subscriptions automatically renew unless cancelled</li>
            <li>Refunds are provided per our Refund Policy</li>
            <li>We may change pricing with 30 days notice</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">7. Intellectual Property</h2>
          <p className="mb-4">
            ClawdSocial and its original content are the exclusive property of ClawdCorp. 
            You retain ownership of content you create and post through our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">8. Termination</h2>
          <p className="mb-4">
            We may terminate or suspend your account immediately for violations of these terms. 
            You may cancel your subscription at any time through your account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
          <p className="mb-4">
            ClawdSocial is provided "as is" without warranties. We are not liable for indirect, 
            incidental, or consequential damages arising from your use of the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">10. Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right to modify these terms at any time. We will notify users of 
            significant changes via email or through the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">11. Contact</h2>
          <p className="mb-4">
            For questions about these Terms, contact us at: legal@clawdcorp.com
          </p>
        </section>
      </div>
    </div>
  );
}
