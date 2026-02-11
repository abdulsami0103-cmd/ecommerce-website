import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import orderService from '../../services/orderService';
import { clearCart, updateQuantity, removeFromCart } from '../../store/slices/cartSlice';
import { Input, Button, Price } from '../../components/common';

const Checkout = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, subtotal, shipping, tax, total } = useSelector(
    (state) => state.cart
  );
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [shippingAddress, setShippingAddress] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    phone: '',
  });

  const handleAddressChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    // Map frontend payment methods to backend enum values
    const paymentMethodMap = {
      'cod': 'cod',
      'jazzcash': 'cod',  // Processed as COD until JazzCash integration
      'easypaisa': 'cod', // Processed as COD until EasyPaisa integration
      'card': 'stripe',   // Card payments through Stripe
      'bank_transfer': 'cod' // Bank transfer processed as COD
    };

    try {
      const orderData = {
        items: items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          variant: item.variant,
        })),
        shippingAddress,
        paymentMethod: paymentMethodMap[paymentMethod] || 'cod',
      };

      console.log('Submitting order:', JSON.stringify(orderData, null, 2));
      const order = await orderService.createOrder(orderData);

      // Clear cart after successful order
      dispatch(clearCart());

      toast.success('Order placed successfully!');
      navigate(`/orders/${order._id}`);
    } catch (error) {
      console.error('Order error:', error);
      console.error('Response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to place order';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">{t('checkout.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          {/* Progress Steps */}
          <div className="flex items-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= s
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step > s ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">
                {t('checkout.shipping')}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('auth.firstName')}
                    name="firstName"
                    value={shippingAddress.firstName}
                    onChange={handleAddressChange}
                    required
                  />
                  <Input
                    label={t('auth.lastName')}
                    name="lastName"
                    value={shippingAddress.lastName}
                    onChange={handleAddressChange}
                    required
                  />
                </div>

                <Input
                  label="Street Address"
                  name="street"
                  value={shippingAddress.street}
                  onChange={handleAddressChange}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleAddressChange}
                    required
                  />
                  <Input
                    label="State/Province"
                    name="state"
                    value={shippingAddress.state}
                    onChange={handleAddressChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Country"
                    name="country"
                    value={shippingAddress.country}
                    onChange={handleAddressChange}
                    required
                  />
                  <Input
                    label="Zip/Postal Code"
                    name="zipCode"
                    value={shippingAddress.zipCode}
                    onChange={handleAddressChange}
                    required
                  />
                </div>

                <Input
                  label="Phone"
                  name="phone"
                  value={shippingAddress.phone}
                  onChange={handleAddressChange}
                />

                <Button onClick={() => setStep(2)} className="w-full">
                  Continue to Payment
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">
                {t('checkout.payment')}
              </h2>

              <div className="space-y-4">
                {/* Cash on Delivery */}
                <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-primary-500 bg-primary-50' : 'hover:border-gray-300'}`}
                  onClick={() => setPaymentMethod('cod')}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💵</span>
                      <span className="font-medium">Cash on Delivery (COD)</span>
                    </div>
                  </label>
                  <p className="text-sm text-gray-500 ml-6 mt-1">
                    Pay when you receive your order
                  </p>
                </div>

                {/* JazzCash */}
                <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'jazzcash' ? 'border-primary-500 bg-primary-50' : 'hover:border-gray-300'}`}
                  onClick={() => setPaymentMethod('jazzcash')}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="jazzcash"
                      checked={paymentMethod === 'jazzcash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📱</span>
                      <span className="font-medium">JazzCash</span>
                    </div>
                  </label>
                  <p className="text-sm text-gray-500 ml-6 mt-1">
                    Pay with your JazzCash mobile wallet
                  </p>
                </div>

                {/* EasyPaisa */}
                <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'easypaisa' ? 'border-primary-500 bg-primary-50' : 'hover:border-gray-300'}`}
                  onClick={() => setPaymentMethod('easypaisa')}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="easypaisa"
                      checked={paymentMethod === 'easypaisa'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📱</span>
                      <span className="font-medium">EasyPaisa</span>
                    </div>
                  </label>
                  <p className="text-sm text-gray-500 ml-6 mt-1">
                    Pay with your EasyPaisa mobile wallet
                  </p>
                </div>

                {/* Credit/Debit Card */}
                <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-primary-500 bg-primary-50' : 'hover:border-gray-300'}`}
                  onClick={() => setPaymentMethod('card')}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💳</span>
                      <span className="font-medium">Credit/Debit Card</span>
                    </div>
                  </label>
                  <p className="text-sm text-gray-500 ml-6 mt-1">
                    Pay securely with Visa, Mastercard, etc.
                  </p>
                </div>

                {/* Bank Transfer */}
                <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'bank_transfer' ? 'border-primary-500 bg-primary-50' : 'hover:border-gray-300'}`}
                  onClick={() => setPaymentMethod('bank_transfer')}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏦</span>
                      <span className="font-medium">Bank Transfer</span>
                    </div>
                  </label>
                  <p className="text-sm text-gray-500 ml-6 mt-1">
                    Transfer directly to our bank account
                  </p>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Review Order
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">
                {t('checkout.review')}
              </h2>

              {/* Shipping Address */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Shipping Address</h3>
                <p className="text-gray-600">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                  <br />
                  {shippingAddress.street}
                  <br />
                  {shippingAddress.city}, {shippingAddress.state}{' '}
                  {shippingAddress.zipCode}
                  <br />
                  {shippingAddress.country}
                  {shippingAddress.phone && <><br />Phone: {shippingAddress.phone}</>}
                </p>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Payment Method</h3>
                <p className="text-gray-600 flex items-center gap-2">
                  {paymentMethod === 'cod' && <>💵 Cash on Delivery</>}
                  {paymentMethod === 'jazzcash' && <>📱 JazzCash</>}
                  {paymentMethod === 'easypaisa' && <>📱 EasyPaisa</>}
                  {paymentMethod === 'card' && <>💳 Credit/Debit Card</>}
                  {paymentMethod === 'bank_transfer' && <>🏦 Bank Transfer</>}
                </p>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Order Items</h3>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 py-2 border-b"
                    >
                      <img
                        src={item.image || 'https://placehold.co/60'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <Price amount={item.price * item.quantity} className="font-medium" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  className="flex-1"
                >
                  {t('checkout.placeOrder')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 pb-3 border-b">
                  <img
                    src={item.image || 'https://placehold.co/50'}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <Price amount={item.price * item.quantity} className="text-sm text-primary-600" />
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => {
                          if (item.quantity > 1) {
                            dispatch(updateQuantity({
                              productId: item.product,
                              variant: item.variant,
                              quantity: item.quantity - 1
                            }));
                          }
                        }}
                        className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => {
                          dispatch(updateQuantity({
                            productId: item.product,
                            variant: item.variant,
                            quantity: item.quantity + 1
                          }));
                        }}
                        className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                      >
                        +
                      </button>
                      <button
                        onClick={() => {
                          dispatch(removeFromCart({
                            productId: item.product,
                            variant: item.variant
                          }));
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                        title="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {t('cart.subtotal')} ({items.length} items)
                </span>
                <Price amount={subtotal} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('cart.shipping')}</span>
                {shipping === 0 ? <span>Free</span> : <Price amount={shipping} />}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('cart.tax')}</span>
                <Price amount={tax} />
              </div>
              <div className="flex justify-between font-semibold text-lg pt-3 border-t">
                <span>{t('cart.total')}</span>
                <Price amount={total} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
