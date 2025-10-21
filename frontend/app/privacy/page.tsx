export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FDF4E3]">
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg border-2 border-primary">
          <h1 className="text-4xl font-bold text-primary mb-6">Privacy Policy</h1>
          <p className="text-sm text-primary/60 mb-8">Last Updated: October 20, 2025</p>

          <div className="space-y-8 text-primary">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="mb-4">
                Vittas ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains 
                how we collect, use, disclose, and safeguard your information when you use our web scraping and 
                AI chatbot service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Personal Information</h3>
              <p className="mb-4">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                <li>Name and email address</li>
                <li>Username and password</li>
                <li>Company information (optional)</li>
                <li>Phone number (optional)</li>
                <li>Payment information (processed by third-party payment processors)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Scraped Content</h3>
              <p className="mb-4">
                We store the content you scrape from websites, including URLs, text content, and associated metadata. 
                This data is stored to power your AI chatbots and enable our services.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">2.3 Usage Information</h3>
              <p className="mb-4">We automatically collect certain information, including:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>IP addresses and device information</li>
                <li>Browser type and version</li>
                <li>Pages visited and features used</li>
                <li>Date and time of access</li>
                <li>Chatbot interaction logs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">We use the collected information for:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Providing and maintaining our Service</li>
                <li>Processing your scraping jobs and generating chatbots</li>
                <li>Authenticating your account and managing subscriptions</li>
                <li>Sending service-related notifications and updates</li>
                <li>Analyzing usage patterns to improve our Service</li>
                <li>Detecting and preventing fraud or abuse</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Data Storage and Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your data, including:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure password hashing using industry-standard algorithms</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Encrypted storage of authentication credentials</li>
              </ul>
              <p className="mb-4">
                Your scraped content and embeddings are stored in secure databases with limited access. We retain 
                your data for as long as your account is active or as needed to provide services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Data Sharing and Disclosure</h2>
              <p className="mb-4">We do not sell your personal information. We may share your information with:</p>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">5.1 Service Providers</h3>
              <p className="mb-4">
                We work with third-party service providers who help us operate our Service, including:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Cloud hosting providers (database and storage)</li>
                <li>Payment processors</li>
                <li>AI model providers (e.g., Google Gemini)</li>
                <li>Email service providers</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">5.2 Legal Requirements</h3>
              <p className="mb-4">
                We may disclose your information if required by law, court order, or government regulation, or if 
                we believe disclosure is necessary to protect our rights or prevent illegal activity.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Your Rights and Choices</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Delete your account and associated data</li>
                <li>Export your scraped data</li>
                <li>Opt-out of marketing communications</li>
                <li>Object to certain data processing activities</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us through your account settings or our support channels.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Cookies and Tracking</h2>
              <p className="mb-4">
                We use cookies and similar tracking technologies to maintain your session, remember your preferences, 
                and analyze usage patterns. You can control cookie settings through your browser, but disabling 
                cookies may affect Service functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Third-Party Links</h2>
              <p className="mb-4">
                Our Service may contain links to third-party websites. We are not responsible for the privacy 
                practices of these external sites. We encourage you to review their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
              <p className="mb-4">
                Our Service is not intended for users under the age of 13. We do not knowingly collect personal 
                information from children. If we learn we have collected information from a child under 13, we 
                will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. International Data Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure 
                appropriate safeguards are in place to protect your data in compliance with applicable data 
                protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Data Retention</h2>
              <p className="mb-4">
                We retain your personal information for as long as necessary to provide our services and comply 
                with legal obligations. When you delete your account, we will delete or anonymize your data within 
                a reasonable timeframe, except where retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of material changes by 
                posting the new policy on this page and updating the "Last Updated" date. We encourage you to 
                review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Contact Us</h2>
              <p className="mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact 
                us through our support channels or account settings.
              </p>
            </section>

            <section className="border-t-2 border-primary/20 pt-6 mt-8">
              <h2 className="text-2xl font-bold mb-4">GDPR Compliance</h2>
              <p className="mb-4">
                For users in the European Economic Area (EEA), we comply with the General Data Protection Regulation 
                (GDPR). You have additional rights under GDPR, including the right to data portability and the right 
                to lodge a complaint with a supervisory authority.
              </p>
            </section>

            <section className="border-t-2 border-primary/20 pt-6 mt-8">
              <h2 className="text-2xl font-bold mb-4">CCPA Compliance</h2>
              <p className="mb-4">
                For California residents, we comply with the California Consumer Privacy Act (CCPA). You have the 
                right to know what personal information we collect, delete your personal information, and opt-out 
                of the sale of personal information (which we do not engage in).
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

