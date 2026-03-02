const Privacy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-500 mb-8">Last updated: March 2026</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="text-gray-600 leading-relaxed mb-3">We collect information that you provide directly to us:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, phone number, and password when you register</li>
            <li><strong>Profile Information:</strong> Avatar, preferred language, and currency settings</li>
            <li><strong>Order Information:</strong> Shipping addresses, payment details, and order history</li>
            <li><strong>Communication Data:</strong> Messages between buyers and vendors, support tickets</li>
            <li><strong>Vendor Information:</strong> Store details, bank account information for payouts, business documents</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Process and fulfill your orders</li>
            <li>Communicate with you about orders, products, and services</li>
            <li>Provide customer support</li>
            <li>Process vendor payments and payouts</li>
            <li>Improve our platform and user experience</li>
            <li>Send promotional emails and notifications (with your consent)</li>
            <li>Detect and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
          <p className="text-gray-600 leading-relaxed mb-3">We may share your information with:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li><strong>Vendors:</strong> Your name and shipping address to fulfill orders</li>
            <li><strong>Payment Processors:</strong> To process transactions securely</li>
            <li><strong>Shipping Partners:</strong> To deliver your orders</li>
            <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            We do not sell your personal information to third parties for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We implement industry-standard security measures to protect your personal information. This includes
            SSL encryption, secure password hashing, and regular security audits. However, no method of transmission
            over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            We use cookies and similar technologies to enhance your browsing experience, remember your preferences,
            and analyze site traffic. You can control cookie settings through your browser. Disabling cookies may
            affect some functionality of the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
          <p className="text-gray-600 leading-relaxed mb-3">You have the right to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your account and data</li>
            <li>Opt out of marketing communications</li>
            <li>Export your data in a portable format</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
          <p className="text-gray-600 leading-relaxed">
            We retain your personal information for as long as your account is active or as needed to provide
            services. Order and transaction records may be retained for legal and accounting purposes even after
            account deletion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
          <p className="text-gray-600 leading-relaxed">
            MarketPlace is not intended for children under 13 years of age. We do not knowingly collect personal
            information from children. If we discover that a child has provided us with personal information, we
            will delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by
            email or through a notice on the platform. We encourage you to review this policy periodically.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have questions about this Privacy Policy or your personal data, please contact us through our{' '}
            <a href="/contact" className="text-primary-600 hover:underline">Contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
