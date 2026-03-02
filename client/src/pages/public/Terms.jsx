const Terms = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-gray-500 mb-8">Last updated: March 2026</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing and using MarketPlace, you accept and agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our platform. These terms apply to all users,
            including buyers, vendors, and visitors.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. User Accounts</h2>
          <p className="text-gray-600 leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials. You must provide
            accurate and complete information when creating an account. You are responsible for all activities
            that occur under your account. You must notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Buying on MarketPlace</h2>
          <p className="text-gray-600 leading-relaxed">
            When you place an order, you agree to pay the listed price plus any applicable taxes and shipping fees.
            All prices are displayed in the currency selected on the platform. We reserve the right to cancel orders
            in cases of pricing errors, fraud, or product unavailability. Refunds will be processed according to our
            Returns & Refunds policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Selling on MarketPlace</h2>
          <p className="text-gray-600 leading-relaxed">
            Vendors must provide accurate product descriptions, images, and pricing. Vendors are responsible for
            fulfilling orders in a timely manner and maintaining product quality. MarketPlace charges a commission
            on each sale as outlined in the vendor agreement. We reserve the right to remove listings that violate
            our policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Prohibited Activities</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Selling counterfeit, illegal, or prohibited items</li>
            <li>Manipulating reviews or ratings</li>
            <li>Creating multiple accounts to circumvent restrictions</li>
            <li>Using the platform for any fraudulent or unlawful purpose</li>
            <li>Interfering with the platform's security or functionality</li>
            <li>Harvesting user data without consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
          <p className="text-gray-600 leading-relaxed">
            All content on MarketPlace, including logos, designs, and software, is owned by MarketPlace or its
            licensors. Vendors retain ownership of their product content but grant MarketPlace a license to display
            it on the platform. Users may not copy, modify, or distribute platform content without permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            MarketPlace acts as a platform connecting buyers and vendors. We are not responsible for the quality,
            safety, or legality of items listed by vendors. Our liability is limited to the amount you paid for the
            specific transaction in question. We are not liable for indirect, incidental, or consequential damages.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Dispute Resolution</h2>
          <p className="text-gray-600 leading-relaxed">
            In case of disputes between buyers and vendors, MarketPlace will attempt to mediate a fair resolution.
            If mediation fails, disputes shall be resolved through binding arbitration. These terms are governed by
            the applicable laws of the jurisdiction where MarketPlace operates.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Changes to Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update these Terms of Service from time to time. We will notify users of significant changes
            via email or platform notification. Continued use of the platform after changes constitutes acceptance
            of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have any questions about these Terms of Service, please contact us through our{' '}
            <a href="/contact" className="text-primary-600 hover:underline">Contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
