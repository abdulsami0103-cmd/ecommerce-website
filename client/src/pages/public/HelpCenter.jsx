import { Link } from 'react-router-dom';

const helpCategories = [
  {
    title: 'Getting Started',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    items: [
      { label: 'How to create an account', link: '/faq' },
      { label: 'How to place an order', link: '/faq' },
      { label: 'Payment methods', link: '/faq' },
      { label: 'Setting up your profile', link: '/faq' },
    ],
  },
  {
    title: 'Orders & Shipping',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    items: [
      { label: 'Track your order', link: '/track-order' },
      { label: 'Shipping information', link: '/shipping' },
      { label: 'Returns & refunds', link: '/returns-refunds' },
      { label: 'Cancel an order', link: '/faq' },
    ],
  },
  {
    title: 'Account & Security',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    items: [
      { label: 'Change your password', link: '/profile' },
      { label: 'Update profile information', link: '/profile' },
      { label: 'Privacy & data', link: '/privacy' },
      { label: 'Delete your account', link: '/contact' },
    ],
  },
  {
    title: 'Selling on MarketPlace',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
    items: [
      { label: 'Become a vendor', link: '/become-vendor' },
      { label: 'Vendor fees & commission', link: '/faq' },
      { label: 'Manage your store', link: '/faq' },
      { label: 'Vendor payouts', link: '/faq' },
    ],
  },
];

const HelpCenter = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Help Center</h1>
        <p className="text-gray-500 text-lg">How can we help you today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {helpCategories.map((cat) => (
          <div key={cat.title} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4 text-primary-600">
              {cat.icon}
              <h2 className="text-xl font-semibold">{cat.title}</h2>
            </div>
            <ul className="space-y-2">
              {cat.items.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.link}
                    className="text-gray-600 hover:text-primary-600 hover:underline flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">Can't find what you're looking for?</h3>
        <p className="text-gray-600 mb-4">Browse our FAQ or contact our support team</p>
        <div className="flex justify-center gap-4">
          <Link
            to="/faq"
            className="inline-block border border-primary-600 text-primary-600 px-6 py-2 rounded-lg hover:bg-primary-50 transition-colors"
          >
            View FAQ
          </Link>
          <Link
            to="/contact"
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
