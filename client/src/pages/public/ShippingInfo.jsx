import { useTranslation } from 'react-i18next';

const ShippingInfo = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Shipping Information</h1>

      {/* Shipping Methods */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-primary-600">Shipping Methods</h2>
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b">
            <div>
              <h3 className="font-medium">Standard Shipping</h3>
              <p className="text-sm text-gray-500">5-7 business days</p>
            </div>
            <span className="text-green-600 font-semibold">Rs 150</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b">
            <div>
              <h3 className="font-medium">Express Shipping</h3>
              <p className="text-sm text-gray-500">2-3 business days</p>
            </div>
            <span className="text-green-600 font-semibold">Rs 350</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Same Day Delivery</h3>
              <p className="text-sm text-gray-500">Within 24 hours (Metro cities only)</p>
            </div>
            <span className="text-green-600 font-semibold">Rs 500</span>
          </div>
        </div>
      </section>

      {/* Free Shipping */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-primary-600">Free Shipping</h2>
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <p className="text-green-800">
            Enjoy <strong>FREE standard shipping</strong> on all orders above <strong>Rs 2,000</strong>!
          </p>
        </div>
      </section>

      {/* Delivery Areas */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-primary-600">Delivery Areas</h2>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="mb-4">We currently deliver to all major cities in Pakistan including:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'].map((city) => (
              <span key={city} className="bg-gray-100 px-3 py-1 rounded text-sm text-center">
                {city}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            For remote areas, delivery may take an additional 2-3 business days.
          </p>
        </div>
      </section>

      {/* Order Tracking */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-primary-600">Order Tracking</h2>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="mb-4">Once your order is shipped, you will receive:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Email notification with tracking number</li>
            <li>SMS updates on delivery status</li>
            <li>Real-time tracking on our website</li>
          </ul>
          <a
            href="/track"
            className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            Track your order →
          </a>
        </div>
      </section>

      {/* Important Notes */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-primary-600">Important Notes</h2>
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <ul className="space-y-2 text-yellow-800">
            <li>• Delivery times are estimates and may vary during peak seasons</li>
            <li>• Please ensure someone is available to receive the package</li>
            <li>• For any delivery issues, contact our support team</li>
            <li>• Cash on Delivery (COD) available for orders under Rs 10,000</li>
          </ul>
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-primary-600">Need Help?</h2>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="mb-2">For shipping related queries, contact us:</p>
          <p className="text-gray-700">
            Email: <a href="mailto:shipping@marketplace.com" className="text-primary-600">shipping@marketplace.com</a>
          </p>
          <p className="text-gray-700">
            Phone: <a href="tel:+921234567890" className="text-primary-600">+92 123 456 7890</a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default ShippingInfo;
