export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <p className="mb-6 text-slate-400">Last updated: February 28, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
          <p className="mb-4">
            ClawdSocial ("we", "our", or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our social media management platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
          
          <h3 className="text-lg font-medium text-white mb-2 mt-6">2.1 Personal Information</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Name and email address</li>
            <li>Account credentials (encrypted)</li>
            <li>Billing information</li>
            <li>Profile information</li>
          </ul>

          <h3 className="text-lg font-medium text-white mb-2 mt-6">2.2 Social Media Data</h3>
          <p className="mb-4">When you connect social media accounts, we collect:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Social media profile information (username, profile picture)</li>
            <li>Access tokens (encrypted) for posting on your behalf</li>
            <li>Content you create and schedule through our platform</li>
            <li>Analytics data (engagement, follower counts)</li>
          </ul>

          <h3 className="text-lg font-medium text-white mb-2 mt-6">2.3 Usage Data</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>IP address and browser information</li>
            <li>Device information</li>
            <li>Log data and analytics</li>
            <li>Feature usage patterns</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Provide and maintain our services</li>
            <li>Process and schedule your social media posts</li>
            <li>Generate analytics and performance reports</li>
            <li>Improve our AI content generation features</li>
            <li>Send service notifications and updates</li>
            <li>Provide customer support</li>
            <li>Prevent fraud and abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">4. Data Storage and Security</h2>
          <p className="mb-4">We implement industry-standard security measures:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>AES-256 encryption for data at rest</li>
            <li>TLS 1.3 for data in transit</li>
            <li>OAuth 2.0 for third-party authentication</li>
            <li>Regular security audits and penetration testing</li>
            <li>SOC 2 Type II compliant infrastructure</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">5. Third-Party Services</h2>
          <p className="mb-4">We integrate with the following third-party services:</p>
          
          <h3 className="text-lg font-medium text-white mb-2 mt-4">5.1 Social Media Platforms</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>X (Twitter) — subject to X's Privacy Policy</li>
            <li>Instagram — subject to Meta's Privacy Policy</li>
            <li>LinkedIn — subject to LinkedIn's Privacy Policy</li>
            <li>TikTok — subject to TikTok's Privacy Policy</li>
          </ul>

          <h3 className="text-lg font-medium text-white mb-2 mt-4">5.2 Infrastructure Providers</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Vercel — hosting and edge functions</li>
            <li>Neon — database hosting</li>
            <li>Clerk — authentication services</li>
            <li>Stripe — payment processing</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">6. Data Sharing and Disclosure</h2>
          <p className="mb-4">We do not sell your personal information. We may share data:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and safety</li>
            <li>In connection with a business transfer</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">7. Your Rights</h2>
          <p className="mb-4">Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your data</li>
            <li>Export your data</li>
            <li>Object to processing</li>
            <li>Withdraw consent</li>
          </ul>
          <p className="mb-4">To exercise these rights, email privacy@clawdcorp.com</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">8. Data Retention</h2>
          <p className="mb-4">We retain your data:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Account data: Until account deletion</li>
            <li>Post content: 30 days after account deletion</li>
            <li>Analytics: Aggregated and anonymized after 1 year</li>
            <li>Logs: 90 days</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">9. Children's Privacy</h2>
          <p className="mb-4">
            Our service is not intended for users under 16 years of age. 
            We do not knowingly collect data from children under 16.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">10. International Data Transfers</h2>
          <p className="mb-4">
            Your data may be transferred to and processed in countries other than your own. 
            We ensure appropriate safeguards are in place for such transfers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy periodically. We will notify you of significant 
            changes via email or through the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">12. Contact Us</h2>
          <p className="mb-4">For privacy-related questions:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Email: privacy@clawdcorp.com</li>
            <li>Address: ClawdCorp, 123 Tech Street, San Francisco, CA 94102</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">13. California Privacy Rights (CCPA)</h2>
          <p className="mb-4">California residents have additional rights under the CCPA:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Right to know what personal information is collected</li>
            <li>Right to know if personal information is sold or disclosed</li>
            <li>Right to say no to the sale of personal information</li>
            <li>Right to equal service and price</li>
          </ul>
          <p className="mb-4">We do not sell personal information.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">14. GDPR Compliance</h2>
          <p className="mb-4">For users in the European Economic Area:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Legal basis: Contract performance and legitimate interests</li>
            <li>Data Protection Officer: dpo@clawdcorp.com</li>
            <li>Right to lodge a complaint with a supervisory authority</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
