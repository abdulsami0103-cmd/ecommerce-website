import { useState } from 'react';

const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border-b border-gray-200">
    <button
      className="w-full py-4 flex justify-between items-center text-left hover:text-primary-600 transition-colors"
      onClick={onClick}
    >
      <span className="font-medium pr-4">{question}</span>
      <svg
        className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {isOpen && (
      <div className="pb-4 text-gray-600">
        {answer}
      </div>
    )}
  </div>
);

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = {
    'Orders & Shipping': [
      {
        question: 'How can I track my order?',
        answer: 'You can track your order by visiting the "Track Order" page and entering your order number. You will also receive tracking updates via email and SMS once your order is shipped.'
      },
      {
        question: 'What are the shipping charges?',
        answer: 'Standard shipping costs Rs 150 (5-7 days), Express shipping costs Rs 350 (2-3 days), and Same Day delivery costs Rs 500 (metro cities only). Free shipping is available on orders above Rs 2,000.'
      },
      {
        question: 'How long does delivery take?',
        answer: 'Standard delivery takes 5-7 business days, Express delivery takes 2-3 business days, and Same Day delivery is available for metro cities. Delivery times may vary during peak seasons or for remote areas.'
      },
      {
        question: 'Can I change my delivery address after placing an order?',
        answer: 'You can change your delivery address within 2 hours of placing your order by contacting our customer support. Once the order is shipped, address changes are not possible.'
      }
    ],
    'Payments': [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept Credit/Debit Cards (Visa, MasterCard), JazzCash, Easypaisa, Bank Transfer, and Cash on Delivery (COD) for orders under Rs 10,000.'
      },
      {
        question: 'Is Cash on Delivery (COD) available?',
        answer: 'Yes, COD is available for orders under Rs 10,000. A small COD fee of Rs 50 may apply depending on your location.'
      },
      {
        question: 'Is my payment information secure?',
        answer: 'Yes, we use industry-standard SSL encryption and secure payment gateways. We never store your complete card details on our servers.'
      },
      {
        question: 'When will I be charged for my order?',
        answer: 'For card payments, you will be charged immediately when you place your order. For COD orders, you pay when the order is delivered to you.'
      }
    ],
    'Returns & Refunds': [
      {
        question: 'What is your return policy?',
        answer: 'We offer a 7-day return policy for most products. Items must be unused, in original packaging, and with all tags attached. Some items like undergarments and personalized products are non-returnable.'
      },
      {
        question: 'How do I initiate a return?',
        answer: 'Go to "My Orders" section, select the order you want to return, click "Request Return", and follow the instructions. Our team will review your request within 24 hours.'
      },
      {
        question: 'How long does it take to get a refund?',
        answer: 'Once we receive and inspect the returned item, refunds are processed within 5-7 business days. The amount will be credited to your original payment method or as store credit.'
      },
      {
        question: 'Who pays for return shipping?',
        answer: 'If the return is due to a defective product or our error, we cover the return shipping cost. For other returns, the customer is responsible for return shipping.'
      }
    ],
    'Account & Orders': [
      {
        question: 'How do I create an account?',
        answer: 'Click on "Register" in the top menu, enter your name, email, and create a password. You can also sign up using your Google or Facebook account.'
      },
      {
        question: 'I forgot my password. How can I reset it?',
        answer: 'Click on "Login", then "Forgot Password". Enter your registered email address and we will send you a password reset link.'
      },
      {
        question: 'How can I cancel my order?',
        answer: 'You can cancel your order within 2 hours of placing it by going to "My Orders" and clicking "Cancel Order". Once the order is shipped, cancellation is not possible.'
      },
      {
        question: 'Can I modify my order after placing it?',
        answer: 'Order modifications are possible within 1 hour of placing the order. Contact our customer support team immediately if you need to make changes.'
      }
    ],
    'Vendors & Selling': [
      {
        question: 'How can I become a vendor?',
        answer: 'Click on "Become a Vendor" in the footer, fill out the application form with your business details, and submit required documents. Our team will review your application within 3-5 business days.'
      },
      {
        question: 'What are the fees for selling on MarketPlace?',
        answer: 'We charge a commission of 5-15% depending on the product category. There are no listing fees or monthly subscription charges for basic accounts.'
      },
      {
        question: 'How do vendors get paid?',
        answer: 'Vendor earnings are credited to their wallet after order completion. Payouts can be requested anytime and are processed within 3-5 business days to your registered bank account.'
      }
    ]
  };

  const handleToggle = (category, index) => {
    const key = `${category}-${index}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-500 mb-8">Find answers to common questions about MarketPlace</p>

      {Object.entries(faqData).map(([category, questions]) => (
        <section key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-primary-600">{category}</h2>
          <div className="bg-white rounded-lg shadow-sm border">
            {questions.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
                isOpen={openIndex === `${category}-${index}`}
                onClick={() => handleToggle(category, index)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Contact Section */}
      <div className="bg-gray-50 rounded-lg p-6 mt-8 text-center">
        <h3 className="text-lg font-semibold mb-2">Still have questions?</h3>
        <p className="text-gray-600 mb-4">Our support team is here to help</p>
        <a
          href="/contact"
          className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default FAQ;
