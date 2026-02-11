const ReturnsRefunds = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Returns & Refunds Policy</h1>
      <p className="text-gray-500 mb-8">Last updated: February 2026</p>

      {/* Return Policy Overview */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-primary-600">Return Policy Overview</h2>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary-600">7</span>
              </div>
              <h3 className="font-semibold">Days Return Window</h3>
              <p className="text-sm text-gray-500">From delivery date</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold">Easy Returns</h3>
              <p className="text-sm text-gray-500">Simple online process</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold">Quick Refunds</h3>
              <p className="text-sm text-gray-500">5-7 business days</p>
            </div>
          </div>
        </div>
      </section>

      {/* Eligible for Return */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-primary-600">Items Eligible for Return</h2>
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <ul className="space-y-2 text-green-800">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Unused items in original packaging with all tags attached</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Defective or damaged products</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Wrong item received</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Items significantly different from product description</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Non-Returnable Items */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-primary-600">Non-Returnable Items</h2>
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <ul className="space-y-2 text-red-800">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Innerwear, lingerie, and swimwear</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Personalized or customized products</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Beauty products and cosmetics (if opened)</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Digital products and software licenses</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Perishable goods and food items</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Items marked as "Final Sale" or "Non-Returnable"</span>
            </li>
          </ul>
        </div>
      </section>

      {/* How to Return */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-primary-600">How to Initiate a Return</h2>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold">Go to My Orders</h3>
                <p className="text-gray-600">Log in to your account and navigate to the "My Orders" section</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <h3 className="font-semibold">Select the Order</h3>
                <p className="text-gray-600">Find the order containing the item you want to return</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <h3 className="font-semibold">Click "Request Return"</h3>
                <p className="text-gray-600">Select the items and reason for return</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0">4</div>
              <div>
                <h3 className="font-semibold">Schedule Pickup or Ship</h3>
                <p className="text-gray-600">Choose pickup from your address or drop off at a nearby location</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0">5</div>
              <div>
                <h3 className="font-semibold">Receive Refund</h3>
                <p className="text-gray-600">Once verified, refund will be processed within 5-7 business days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Refund Information */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-primary-600">Refund Information</h2>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Payment Method</th>
                <th className="text-left py-2">Refund Method</th>
                <th className="text-left py-2">Timeline</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <tr className="border-b">
                <td className="py-3">Credit/Debit Card</td>
                <td className="py-3">Original Card</td>
                <td className="py-3">5-7 business days</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">JazzCash/Easypaisa</td>
                <td className="py-3">Same Wallet</td>
                <td className="py-3">2-3 business days</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">Bank Transfer</td>
                <td className="py-3">Same Bank Account</td>
                <td className="py-3">5-7 business days</td>
              </tr>
              <tr>
                <td className="py-3">Cash on Delivery</td>
                <td className="py-3">Bank Transfer/Store Credit</td>
                <td className="py-3">7-10 business days</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Contact */}
      <section>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Need Help with a Return?</h3>
          <p className="text-gray-600 mb-4">Our support team is available to assist you</p>
          <div className="flex justify-center gap-4">
            <a
              href="/contact"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="/faq"
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              View FAQ
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReturnsRefunds;
