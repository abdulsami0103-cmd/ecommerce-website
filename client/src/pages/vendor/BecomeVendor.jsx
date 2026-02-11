import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import vendorService from '../../services/vendorService';
import { Input, Button } from '../../components/common';

// Inline SVG Icons
const GlobeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CurrencyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TruckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BecomeVendor = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    address: { street: '', city: '', state: '', country: '', zipCode: '' },
  });

  const features = [
    { icon: GlobeIcon, title: 'Global Reach', description: 'Sell to customers worldwide with our international marketplace' },
    { icon: CurrencyIcon, title: 'Instant Payouts', description: 'Get paid instantly via Stripe Connect - no waiting for payments' },
    { icon: TruckIcon, title: 'Easy Shipping', description: 'Integrated shipping solutions for physical products' },
    { icon: CheckCircleIcon, title: 'Simple Management', description: 'Easy-to-use dashboard to manage products and orders' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({ ...formData, address: { ...formData.address, [addressField]: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to become a vendor');
      navigate('/login', { state: { from: { pathname: '/become-vendor' } } });
      return;
    }
    if (user?.role === 'vendor') {
      toast.error('You are already a vendor');
      navigate('/vendor/dashboard');
      return;
    }
    setLoading(true);
    try {
      await vendorService.registerVendor(formData);
      toast.success('Vendor registration submitted! Please wait for approval.');
      navigate('/vendor/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Become a Vendor</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Join thousands of successful sellers on our marketplace. Start selling today and reach millions of customers.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Why Sell With Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-6 text-center">
                <feature.icon className="w-12 h-12 mx-auto text-primary-600 mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Register Your Store</h2>
            <div className="card p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input label="Store Name *" name="storeName" value={formData.storeName} onChange={handleChange} placeholder="Enter your store name" required />
                <div>
                  <label className="label">Store Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="input" placeholder="Tell customers about your store" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Contact Email" type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} placeholder="store@example.com" />
                  <Input label="Contact Phone" name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="+1 234 567 8900" />
                </div>
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Business Address</h3>
                  <Input label="Street Address" name="address.street" value={formData.address.street} onChange={handleChange} className="mb-4" />
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Input label="City" name="address.city" value={formData.address.city} onChange={handleChange} />
                    <Input label="State/Province" name="address.state" value={formData.address.state} onChange={handleChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Country" name="address.country" value={formData.address.country} onChange={handleChange} />
                    <Input label="Zip/Postal Code" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} />
                  </div>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  By registering, you agree to our <a href="/terms" className="text-primary-600 hover:underline">Vendor Terms</a> and <a href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</a>. A 10% platform commission applies to all sales.
                </div>
                <Button type="submit" className="w-full" loading={loading}>Submit Registration</Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BecomeVendor;
