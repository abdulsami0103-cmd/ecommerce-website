import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { fetchProducts, fetchCategories } from '../../store/slices/productSlice';
import ProductCard from '../../components/product/ProductCard';

// Icons
const ArrowRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const ArrowLeftIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ChevronLeftIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const StarIcon = ({ className, filled }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const HeadphonesIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 18v-6a9 9 0 0118 0v6M3 18a3 3 0 003 3h0a3 3 0 003-3v-3a3 3 0 00-3-3h0a3 3 0 00-3 3v3zm18 0a3 3 0 01-3 3h0a3 3 0 01-3-3v-3a3 3 0 013-3h0a3 3 0 013 3v3z" />
  </svg>
);

const SpeakerIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);

const WatchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PhoneIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const LaptopIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CameraIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TruckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const ShieldIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const SupportIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const RefreshIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// Flash Sale Countdown Component
const FlashSaleCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 48, seconds: 20 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1">
      <span className="bg-emerald-600 text-white px-2 py-1 rounded text-sm font-bold">
        {String(timeLeft.hours).padStart(2, '0')}h
      </span>
      <span className="text-emerald-600">:</span>
      <span className="bg-emerald-600 text-white px-2 py-1 rounded text-sm font-bold">
        {String(timeLeft.minutes).padStart(2, '0')}m
      </span>
      <span className="text-emerald-600">:</span>
      <span className="bg-emerald-600 text-white px-2 py-1 rounded text-sm font-bold">
        {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
    </div>
  );
};

// Product Carousel Component
const ProductCarousel = ({ products, loading }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-64 h-80 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-emerald-50 transition-colors"
      >
        <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product._id} className="flex-shrink-0 w-64">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-emerald-50 transition-colors"
      >
        <ChevronRightIcon className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
};

// Testimonial Card Component
const TestimonialCard = ({ name, image, text }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-emerald-600 font-bold text-lg">{name.charAt(0)}</span>
        )}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{name}</h4>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className="w-4 h-4 text-yellow-400" filled />
          ))}
        </div>
      </div>
    </div>
    <p className="text-gray-600 text-sm leading-relaxed">"{text}"</p>
  </div>
);

const Home = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [currentSlide, setCurrentSlide] = useState(0);

  const { products, categories, loading } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchProducts({ limit: 12 }));
    dispatch(fetchCategories());
  }, [dispatch]);

  // Auto slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const categoryIcons = [
    { icon: HeadphonesIcon, name: 'Headphones', color: 'bg-emerald-100 text-emerald-600' },
    { icon: SpeakerIcon, name: 'Speakers', color: 'bg-teal-100 text-teal-600' },
    { icon: WatchIcon, name: 'Watches', color: 'bg-cyan-100 text-cyan-600' },
    { icon: PhoneIcon, name: 'Phones', color: 'bg-green-100 text-green-600' },
    { icon: LaptopIcon, name: 'Laptops', color: 'bg-emerald-100 text-emerald-600' },
    { icon: CameraIcon, name: 'Cameras', color: 'bg-teal-100 text-teal-600' },
  ];

  const testimonials = [
    { name: 'Ralph Edwards', text: 'Superb quality among delivery. We delivery best is very good!' },
    { name: 'Darrell Steward', text: 'Superb quality among delivery. We delivery best is very good!' },
    { name: 'Jerome Bell', text: 'Superb quality among delivery. We delivery best is very good!' },
    { name: 'Jenny Wilson', text: 'Superb quality among delivery. We delivery best is very good!' },
  ];

  const features = [
    { icon: TruckIcon, title: 'Free Shipping', desc: 'On orders over Rs. 5000' },
    { icon: RefreshIcon, title: 'Easy Returns', desc: '30 day return policy' },
    { icon: ShieldIcon, title: 'Secure Checkout', desc: '100% protected payments' },
    { icon: SupportIcon, title: '24/7 Support', desc: 'Dedicated support team' },
  ];

  const slides = [
    {
      title: 'Grab at 30% off',
      subtitle: 'Bassheads 900',
      description: 'Wired Earphones with 40mm Drivers, Compact & Foldable, In-line microphone, Super Bass',
      bg: 'from-emerald-500 to-teal-600',
      image: '/images/headphones-hero.png'
    },
    {
      title: 'New Arrivals',
      subtitle: 'Smart Watches',
      description: 'Latest smartwatches with health monitoring, GPS tracking, and premium design',
      bg: 'from-teal-500 to-cyan-600',
      image: '/images/watch-hero.png'
    },
    {
      title: 'Special Offer',
      subtitle: 'Wireless Speakers',
      description: 'Premium sound quality with deep bass, 20 hours battery life',
      bg: 'from-green-500 to-emerald-600',
      image: '/images/speaker-hero.png'
    },
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero Banner Slider */}
      <section className="relative overflow-hidden">
        <div className={`bg-gradient-to-r ${slides[currentSlide].bg} transition-all duration-500`}>
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center min-h-[400px] md:min-h-[500px] py-8">
              <div className="flex-1 text-white z-10">
                <span className="inline-block bg-white/20 backdrop-blur px-4 py-1 rounded-full text-sm mb-4">
                  {slides[currentSlide].title}
                </span>
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  {slides[currentSlide].subtitle}
                </h1>
                <p className="text-white/80 text-lg mb-6 max-w-md">
                  {slides[currentSlide].description}
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Shop Now
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </div>
              <div className="flex-1 flex justify-center items-center">
                <div className="relative">
                  {/* Decorative elements */}
                  <div className="absolute -top-10 -left-10 w-20 h-20 border-2 border-white/30 rounded-lg rotate-12" />
                  <div className="absolute -bottom-10 -right-10 w-16 h-16 border-2 border-white/30 rounded-lg -rotate-12" />
                  <div className="w-64 h-64 md:w-80 md:h-80 bg-white/10 rounded-full flex items-center justify-center">
                    <HeadphonesIcon className="w-32 h-32 md:w-40 md:h-40 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentSlide === index ? 'bg-white w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Category Icons */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {categories.length > 0 ? (
              categories.slice(0, 6).map((category, index) => (
                <Link
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  className="flex flex-col items-center group"
                >
                  <div className={`w-16 h-16 rounded-full ${categoryIcons[index % categoryIcons.length].color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    {React.createElement(categoryIcons[index % categoryIcons.length].icon, { className: 'w-8 h-8' })}
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">
                    {category.name}
                  </span>
                </Link>
              ))
            ) : (
              categoryIcons.map((cat, index) => (
                <Link
                  key={index}
                  to="/products"
                  className="flex flex-col items-center group"
                >
                  <div className={`w-16 h-16 rounded-full ${cat.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <cat.icon className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Hot Selling Products */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Hot Selling Products</h2>
            <Link
              to="/products"
              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
            >
              View All
              <ArrowRightIcon className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <ProductCarousel products={products.slice(0, 8)} loading={loading} />
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row items-center p-8 md:p-12">
              <div className="flex-1 text-white mb-6 md:mb-0">
                <h3 className="text-3xl md:text-4xl font-bold mb-2">Save Up to 40% Off</h3>
                <p className="text-white/80 mb-4">on all best products</p>
                <Link
                  to="/products"
                  className="inline-flex items-center bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Shop Now
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center">
                  <SpeakerIcon className="w-24 h-24 text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flash Sale */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Flash Sale</h2>
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
                <span className="text-emerald-600 text-sm font-medium">Ending in</span>
                <FlashSaleCountdown />
              </div>
            </div>
            <Link
              to="/products"
              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
            >
              View All
              <ArrowRightIcon className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <ProductCarousel products={products.slice(4, 12)} loading={loading} />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Some Testimonials From our Customers</h2>
            <Link
              to="/reviews"
              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
            >
              View All
              <ArrowRightIcon className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Partners */}
      <section className="py-8 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            <span className="text-2xl font-bold text-gray-400">ONEPLUS</span>
            <span className="text-2xl font-bold text-gray-400">XIAOMI</span>
            <span className="text-2xl font-bold text-gray-400">Lenovo</span>
            <span className="text-2xl font-bold text-gray-400">HUAWEI</span>
            <span className="text-2xl font-bold text-gray-400">Samsung</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Selling?
          </h2>
          <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join thousands of vendors and start selling your products to millions
            of customers. Easy setup, powerful tools, instant payouts.
          </p>
          <Link
            to="/become-vendor"
            className="inline-flex items-center bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Become a Vendor Today
            <ArrowRightIcon className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
