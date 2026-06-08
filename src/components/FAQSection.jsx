// src/components/FAQSection.jsx
import React, { useState } from 'react';
import './FAQSection.css';

const FAQ_DATA = [
  {
    id: 1,
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'Visit our sign-up page and provide your business details. Verify your email, complete your business profile, and you\'ll be ready to start sourcing. KYC verification may be required for larger orders.'
  },
  {
    id: 2,
    category: 'Getting Started',
    question: 'What documents do I need to get verified?',
    answer: 'Generally, we require business registration documents, ABN (Australian Business Number), and a valid form of ID. The specific requirements depend on your business type and order volume.'
  },
  {
    id: 3,
    category: 'Products & Ordering',
    question: 'How often is inventory updated?',
    answer: 'Our inventory is updated in real-time as stock moves. Product availability is reflected instantly on the platform, and you\'ll receive alerts if items go out of stock.'
  },
  {
    id: 4,
    category: 'Products & Ordering',
    question: 'What is the minimum order quantity?',
    answer: 'Minimum order quantities vary by product and supplier. Check each product listing for MOQ details. We work with many suppliers to accommodate businesses of all sizes.'
  },
  {
    id: 5,
    category: 'Products & Ordering',
    question: 'Can I request custom or bulk orders?',
    answer: 'Yes! Contact our sales team for custom requests, bulk pricing, or special sourcing requirements. We\'ll connect you with the right supplier to meet your needs.'
  },
  {
    id: 6,
    category: 'Pricing & Payment',
    question: 'How is pricing determined?',
    answer: 'Pricing is wholesale-based and depends on order quantity, product category, and supplier terms. Larger orders typically receive better rates. Use our calculator to estimate costs.'
  },
  {
    id: 7,
    category: 'Pricing & Payment',
    question: 'What payment methods do you accept?',
    answer: 'We accept credit cards, bank transfers, and secure online payments via multiple payment gateways. Payment terms vary based on your account status and order history.'
  },
  {
    id: 8,
    category: 'Pricing & Payment',
    question: 'Do you offer payment plans or credit terms?',
    answer: 'For verified businesses with established accounts, we may offer flexible payment terms. Contact us to discuss options based on your business needs.'
  },
  {
    id: 9,
    category: 'Shipping & Delivery',
    question: 'How long does delivery take?',
    answer: 'Delivery times vary based on your location and the warehouse nearest to you. Most orders within Australia arrive within 3-10 business days. Check the product page for specific estimates.'
  },
  {
    id: 10,
    category: 'Shipping & Delivery',
    question: 'What are your shipping costs?',
    answer: 'Shipping is calculated based on weight, destination, and delivery method. You\'ll see the exact cost before confirming your order. Free shipping may apply to eligible orders.'
  },
  {
    id: 11,
    category: 'Shipping & Delivery',
    question: 'Can I pick up orders from a warehouse?',
    answer: 'Yes! Many customers prefer warehouse pickup to save on shipping costs. Select "Warehouse Pickup" at checkout and choose your nearest location.'
  },
  {
    id: 12,
    category: 'Orders & Returns',
    question: 'How do I track my order?',
    answer: 'Once your order is processed, you\'ll receive tracking details via email. Log into your account to view real-time status updates and estimated delivery dates.'
  },
  {
    id: 13,
    category: 'Orders & Returns',
    question: 'What is your return policy?',
    answer: 'We offer a 14-day return period for unused, unopened items. Some clearance items are final sale. Review the return policy for each product before purchasing.'
  },
  {
    id: 14,
    category: 'Orders & Returns',
    question: 'What if my order arrives damaged?',
    answer: 'Contact us immediately with photos of the damage. We\'ll arrange a replacement or refund at no cost to you. This is covered under our quality guarantee.'
  },
  {
    id: 15,
    category: 'Account & Support',
    question: 'How do I update my business profile?',
    answer: 'Go to Account Settings and select "Business Profile." Update your information and save. Changes take effect immediately.'
  },
  {
    id: 16,
    category: 'Account & Support',
    question: 'How can I contact customer support?',
    answer: 'Email us at support@tycoonsourcing.com, call 1300-TYCOON, or use the live chat feature on our website. We\'re typically available Mon-Fri 8AM-5PM AEST.'
  },
  {
    id: 17,
    category: 'Account & Support',
    question: 'Is my data secure?',
    answer: 'Yes, we use enterprise-grade security with SSL encryption, secure payment processing, and strict privacy policies. Your data is protected under Australian privacy laws.'
  }
];

export default function FAQSection({ category = null, limit = null }) {
  const [expandedId, setExpandedId] = useState(null);
  
  const filteredFAQ = category 
    ? FAQ_DATA.filter(item => item.category === category)
    : FAQ_DATA;

  const displayedFAQ = limit ? filteredFAQ.slice(0, limit) : filteredFAQ;
  const categories = [...new Set(FAQ_DATA.map(item => item.category))];

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="faq-section">
      {!category && (
        <div className="faq-categories">
          <button 
            className={`category-btn ${!category ? 'active' : ''}`}
            onClick={() => window.location.hash = '#faq'}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              className="category-btn"
              onClick={() => {
                const encoded = encodeURIComponent(cat);
                window.location.href = `#faq?category=${encoded}`;
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="faq-list">
        {displayedFAQ.map(item => (
          <div key={item.id} className="faq-item">
            <button
              className={`faq-question ${expandedId === item.id ? 'expanded' : ''}`}
              onClick={() => toggleExpand(item.id)}
            >
              <span className="question-text">{item.question}</span>
              <span className="question-icon">
                {expandedId === item.id ? '−' : '+'}
              </span>
            </button>
            {expandedId === item.id && (
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {limit && limit < filteredFAQ.length && (
        <div className="faq-footer">
          <a href="/faq" className="btn-view-all">View All FAQs →</a>
        </div>
      )}
    </div>
  );
}

// Export FAQ data for use in FAQPage
export { FAQ_DATA };
