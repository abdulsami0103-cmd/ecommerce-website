const mongoose = require('mongoose');
const Language = require('../models/Language');
const Currency = require('../models/Currency');
const UIString = require('../models/UIString');

const languages = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    isDefault: true,
    isActive: true,
    sortOrder: 1,
    flag: '🇺🇸',
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    direction: 'rtl',
    isDefault: false,
    isActive: true,
    sortOrder: 2,
    flag: '🇵🇰',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    isDefault: false,
    isActive: true,
    sortOrder: 3,
    flag: '🇸🇦',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    isDefault: false,
    isActive: true,
    sortOrder: 4,
    flag: '🇪🇸',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    isDefault: false,
    isActive: true,
    sortOrder: 5,
    flag: '🇫🇷',
  },
];

const currencies = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandSeparator: ',',
    exchangeRate: 1,
    isBaseCurrency: true,
    isActive: true,
    rateSource: 'manual',
  },
  {
    code: 'PKR',
    name: 'Pakistani Rupee',
    symbol: 'Rs',
    symbolPosition: 'before',
    decimalPlaces: 0,
    decimalSeparator: '.',
    thousandSeparator: ',',
    exchangeRate: 278.5,
    isBaseCurrency: false,
    isActive: true,
    rateSource: 'api',
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    symbolPosition: 'before',
    decimalPlaces: 2,
    decimalSeparator: ',',
    thousandSeparator: '.',
    exchangeRate: 0.92,
    isBaseCurrency: false,
    isActive: true,
    rateSource: 'api',
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    symbolPosition: 'before',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandSeparator: ',',
    exchangeRate: 0.79,
    isBaseCurrency: false,
    isActive: true,
    rateSource: 'api',
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    symbolPosition: 'after',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandSeparator: ',',
    exchangeRate: 3.67,
    isBaseCurrency: false,
    isActive: true,
    rateSource: 'api',
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    symbolPosition: 'before',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandSeparator: ',',
    exchangeRate: 83.12,
    isBaseCurrency: false,
    isActive: true,
    rateSource: 'api',
  },
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'ر.س',
    symbolPosition: 'after',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandSeparator: ',',
    exchangeRate: 3.75,
    isBaseCurrency: false,
    isActive: true,
    rateSource: 'api',
  },
];

// English UI strings (base)
const englishStrings = {
  // Common
  'common.loading': 'Loading...',
  'common.error': 'An error occurred',
  'common.success': 'Success',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.view': 'View',
  'common.search': 'Search',
  'common.filter': 'Filter',
  'common.sort': 'Sort',
  'common.all': 'All',
  'common.none': 'None',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.confirm': 'Confirm',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.previous': 'Previous',
  'common.submit': 'Submit',
  'common.reset': 'Reset',
  'common.close': 'Close',

  // Navigation
  'nav.home': 'Home',
  'nav.products': 'Products',
  'nav.categories': 'Categories',
  'nav.vendors': 'Vendors',
  'nav.cart': 'Cart',
  'nav.account': 'Account',
  'nav.orders': 'Orders',
  'nav.wishlist': 'Wishlist',
  'nav.login': 'Login',
  'nav.register': 'Register',
  'nav.logout': 'Logout',

  // Product
  'product.addToCart': 'Add to Cart',
  'product.buyNow': 'Buy Now',
  'product.outOfStock': 'Out of Stock',
  'product.inStock': 'In Stock',
  'product.price': 'Price',
  'product.quantity': 'Quantity',
  'product.description': 'Description',
  'product.reviews': 'Reviews',
  'product.specifications': 'Specifications',
  'product.relatedProducts': 'Related Products',
  'product.noReviews': 'No reviews yet',
  'product.writeReview': 'Write a Review',

  // Cart
  'cart.title': 'Shopping Cart',
  'cart.empty': 'Your cart is empty',
  'cart.subtotal': 'Subtotal',
  'cart.shipping': 'Shipping',
  'cart.tax': 'Tax',
  'cart.total': 'Total',
  'cart.checkout': 'Proceed to Checkout',
  'cart.continueShopping': 'Continue Shopping',
  'cart.remove': 'Remove',
  'cart.updateQuantity': 'Update Quantity',

  // Checkout
  'checkout.title': 'Checkout',
  'checkout.shippingAddress': 'Shipping Address',
  'checkout.billingAddress': 'Billing Address',
  'checkout.paymentMethod': 'Payment Method',
  'checkout.orderSummary': 'Order Summary',
  'checkout.placeOrder': 'Place Order',
  'checkout.sameAsShipping': 'Same as shipping address',

  // Orders
  'orders.title': 'My Orders',
  'orders.orderNumber': 'Order #',
  'orders.status': 'Status',
  'orders.date': 'Date',
  'orders.total': 'Total',
  'orders.trackOrder': 'Track Order',
  'orders.viewDetails': 'View Details',
  'orders.noOrders': 'No orders found',

  // Account
  'account.profile': 'Profile',
  'account.settings': 'Settings',
  'account.addresses': 'Addresses',
  'account.paymentMethods': 'Payment Methods',
  'account.notifications': 'Notifications',
  'account.security': 'Security',

  // Auth
  'auth.login': 'Login',
  'auth.register': 'Register',
  'auth.forgotPassword': 'Forgot Password?',
  'auth.resetPassword': 'Reset Password',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm Password',
  'auth.rememberMe': 'Remember Me',
  'auth.noAccount': "Don't have an account?",
  'auth.hasAccount': 'Already have an account?',

  // Vendor
  'vendor.dashboard': 'Vendor Dashboard',
  'vendor.products': 'My Products',
  'vendor.orders': 'My Orders',
  'vendor.analytics': 'Analytics',
  'vendor.earnings': 'Earnings',
  'vendor.payouts': 'Payouts',
  'vendor.settings': 'Store Settings',

  // Admin
  'admin.dashboard': 'Admin Dashboard',
  'admin.users': 'Users',
  'admin.vendors': 'Vendors',
  'admin.products': 'Products',
  'admin.orders': 'Orders',
  'admin.categories': 'Categories',
  'admin.reports': 'Reports',
  'admin.settings': 'Settings',

  // Footer
  'footer.aboutUs': 'About Us',
  'footer.contactUs': 'Contact Us',
  'footer.privacyPolicy': 'Privacy Policy',
  'footer.termsOfService': 'Terms of Service',
  'footer.help': 'Help',
  'footer.faq': 'FAQ',
  'footer.shipping': 'Shipping',
  'footer.returns': 'Returns',
  'footer.copyright': '© 2024 MarketPlace. All rights reserved.',
};

// Urdu UI strings
const urduStrings = {
  // Common
  'common.loading': 'لوڈ ہو رہا ہے...',
  'common.error': 'ایک خرابی پیش آگئی',
  'common.success': 'کامیابی',
  'common.save': 'محفوظ کریں',
  'common.cancel': 'منسوخ کریں',
  'common.delete': 'حذف کریں',
  'common.edit': 'ترمیم کریں',
  'common.view': 'دیکھیں',
  'common.search': 'تلاش کریں',
  'common.filter': 'فلٹر',
  'common.sort': 'ترتیب',
  'common.all': 'سب',
  'common.none': 'کوئی نہیں',
  'common.yes': 'ہاں',
  'common.no': 'نہیں',
  'common.confirm': 'تصدیق کریں',
  'common.back': 'واپس',
  'common.next': 'اگلا',
  'common.previous': 'پچھلا',
  'common.submit': 'جمع کرائیں',
  'common.reset': 'ری سیٹ',
  'common.close': 'بند کریں',

  // Navigation
  'nav.home': 'ہوم',
  'nav.products': 'مصنوعات',
  'nav.categories': 'زمرے',
  'nav.vendors': 'دکاندار',
  'nav.cart': 'کارٹ',
  'nav.account': 'اکاؤنٹ',
  'nav.orders': 'آرڈرز',
  'nav.wishlist': 'پسندیدہ',
  'nav.login': 'لاگ ان',
  'nav.register': 'رجسٹر',
  'nav.logout': 'لاگ آؤٹ',

  // Product
  'product.addToCart': 'کارٹ میں شامل کریں',
  'product.buyNow': 'ابھی خریدیں',
  'product.outOfStock': 'اسٹاک میں نہیں',
  'product.inStock': 'اسٹاک میں دستیاب',
  'product.price': 'قیمت',
  'product.quantity': 'مقدار',
  'product.description': 'تفصیل',
  'product.reviews': 'جائزے',
  'product.specifications': 'تفصیلات',
  'product.relatedProducts': 'متعلقہ مصنوعات',
  'product.noReviews': 'ابھی تک کوئی جائزہ نہیں',
  'product.writeReview': 'جائزہ لکھیں',

  // Cart
  'cart.title': 'شاپنگ کارٹ',
  'cart.empty': 'آپ کا کارٹ خالی ہے',
  'cart.subtotal': 'ذیلی کل',
  'cart.shipping': 'شپنگ',
  'cart.tax': 'ٹیکس',
  'cart.total': 'کل',
  'cart.checkout': 'چیک آؤٹ کریں',
  'cart.continueShopping': 'خریداری جاری رکھیں',
  'cart.remove': 'ہٹائیں',
  'cart.updateQuantity': 'مقدار تبدیل کریں',
};

// Arabic UI strings
const arabicStrings = {
  // Common
  'common.loading': 'جار التحميل...',
  'common.error': 'حدث خطأ',
  'common.success': 'نجاح',
  'common.save': 'حفظ',
  'common.cancel': 'إلغاء',
  'common.delete': 'حذف',
  'common.edit': 'تعديل',
  'common.view': 'عرض',
  'common.search': 'بحث',
  'common.filter': 'تصفية',
  'common.sort': 'ترتيب',
  'common.all': 'الكل',
  'common.none': 'لا شيء',
  'common.yes': 'نعم',
  'common.no': 'لا',
  'common.confirm': 'تأكيد',
  'common.back': 'رجوع',
  'common.next': 'التالي',
  'common.previous': 'السابق',
  'common.submit': 'إرسال',
  'common.reset': 'إعادة تعيين',
  'common.close': 'إغلاق',

  // Navigation
  'nav.home': 'الرئيسية',
  'nav.products': 'المنتجات',
  'nav.categories': 'الفئات',
  'nav.vendors': 'البائعون',
  'nav.cart': 'السلة',
  'nav.account': 'الحساب',
  'nav.orders': 'الطلبات',
  'nav.wishlist': 'المفضلة',
  'nav.login': 'تسجيل الدخول',
  'nav.register': 'تسجيل',
  'nav.logout': 'تسجيل الخروج',

  // Product
  'product.addToCart': 'أضف إلى السلة',
  'product.buyNow': 'اشتر الآن',
  'product.outOfStock': 'غير متوفر',
  'product.inStock': 'متوفر',
  'product.price': 'السعر',
  'product.quantity': 'الكمية',
  'product.description': 'الوصف',
  'product.reviews': 'التقييمات',
  'product.specifications': 'المواصفات',
  'product.relatedProducts': 'منتجات ذات صلة',
  'product.noReviews': 'لا توجد تقييمات بعد',
  'product.writeReview': 'اكتب تقييم',
};

const seedLocalization = async () => {
  try {
    console.log('Starting localization seeding...');

    // Clear existing data
    await Language.deleteMany({});
    await Currency.deleteMany({});
    await UIString.deleteMany({});

    console.log('Cleared existing localization data');

    // Insert languages
    await Language.insertMany(languages);
    console.log(`Inserted ${languages.length} languages`);

    // Insert currencies
    await Currency.insertMany(currencies);
    console.log(`Inserted ${currencies.length} currencies`);

    // Insert English UI strings
    const englishUIStrings = Object.entries(englishStrings).map(([key, value]) => ({
      key,
      languageCode: 'en',
      value,
      namespace: key.split('.')[0],
    }));
    await UIString.insertMany(englishUIStrings);
    console.log(`Inserted ${englishUIStrings.length} English UI strings`);

    // Insert Urdu UI strings
    const urduUIStrings = Object.entries(urduStrings).map(([key, value]) => ({
      key,
      languageCode: 'ur',
      value,
      namespace: key.split('.')[0],
    }));
    await UIString.insertMany(urduUIStrings);
    console.log(`Inserted ${urduUIStrings.length} Urdu UI strings`);

    // Insert Arabic UI strings
    const arabicUIStrings = Object.entries(arabicStrings).map(([key, value]) => ({
      key,
      languageCode: 'ar',
      value,
      namespace: key.split('.')[0],
    }));
    await UIString.insertMany(arabicUIStrings);
    console.log(`Inserted ${arabicUIStrings.length} Arabic UI strings`);

    // Update language translation progress
    for (const lang of languages) {
      await Language.updateTranslationProgress(lang.code);
    }
    console.log('Updated language translation progress');

    console.log('Localization seeding completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Localization seeding error:', error);
    throw error;
  }
};

// Run seeder if executed directly
if (require.main === module) {
  const dotenv = require('dotenv');
  dotenv.config({ path: '../.env' });

  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      await seedLocalization();
      process.exit(0);
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    });
}

module.exports = seedLocalization;
