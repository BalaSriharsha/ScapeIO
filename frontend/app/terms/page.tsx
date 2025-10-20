export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FDF4E3]">
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg border-2 border-primary">
          <h1 className="text-4xl font-bold text-primary mb-6">Terms of Service</h1>
          <p className="text-sm text-primary/60 mb-8">Last Updated: October 20, 2025</p>

          <div className="space-y-8 text-primary">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using Vittas ("Service"), you accept and agree to be bound by the terms and 
                provision of this agreement. If you do not agree to these Terms of Service, please do not use 
                our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
              <p className="mb-4">
                Vittas provides AI-powered web scraping and RAG (Retrieval-Augmented Generation) chatbot creation 
                services. Our Service allows you to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Scrape publicly accessible websites</li>
                <li>Create AI chatbots based on scraped content</li>
                <li>Embed chatbots on your websites</li>
                <li>Export scraped data in various formats</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. User Responsibilities</h2>
              <p className="mb-4">You agree to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Only scrape websites you have permission to scrape</li>
                <li>Respect robots.txt files and website terms of service</li>
                <li>Not use the Service for illegal or unauthorized purposes</li>
                <li>Not scrape websites containing sensitive personal information without proper authorization</li>
                <li>Not overload target websites with excessive requests</li>
                <li>Comply with all applicable copyright and intellectual property laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Prohibited Activities</h2>
              <p className="mb-4">You may not:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Scrape websites that explicitly prohibit automated access</li>
                <li>Use the Service to collect personal data without consent</li>
                <li>Attempt to circumvent authentication or security measures</li>
                <li>Resell or redistribute scraped data without proper rights</li>
                <li>Use the Service for spam, phishing, or malicious purposes</li>
                <li>Interfere with or disrupt the Service or servers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Account Security</h2>
              <p className="mb-4">
                You are responsible for maintaining the confidentiality of your account credentials and for all 
                activities that occur under your account. You agree to notify us immediately of any unauthorized 
                use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
              <p className="mb-4">
                The Service and its original content, features, and functionality are owned by Vittas and are 
                protected by international copyright, trademark, and other intellectual property laws. You retain 
                ownership of any content you scrape using our Service, subject to the rights of the original 
                content owners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Subscription and Payment</h2>
              <p className="mb-4">
                Some features of the Service require a paid subscription. By subscribing, you agree to pay all 
                fees associated with your chosen plan. Fees are non-refundable except as required by law or as 
                explicitly stated in our refund policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Service Limitations</h2>
              <p className="mb-4">
                We reserve the right to limit the number of pages, storage, and other resources available to users 
                based on their subscription plan. We may also impose rate limits to ensure fair usage of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Termination</h2>
              <p className="mb-4">
                We reserve the right to suspend or terminate your account if you violate these Terms of Service. 
                Upon termination, your right to use the Service will immediately cease, and we may delete your data 
                after a reasonable grace period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Disclaimer of Warranties</h2>
              <p className="mb-4">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT 
                WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE FROM HARMFUL COMPONENTS.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Limitation of Liability</h2>
              <p className="mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, VITTAS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED 
                DIRECTLY OR INDIRECTLY.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of material changes 
                via email or through the Service. Your continued use of the Service after such modifications 
                constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Governing Law</h2>
              <p className="mb-4">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard 
                to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us through our support channels.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

