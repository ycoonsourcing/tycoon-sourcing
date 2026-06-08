// src/pages/FAQPage.jsx
import React, { useState } from 'react';
import FAQSection, { FAQ_DATA } from '../components/FAQSection';
import './FAQPage.css';

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [...new Set(FAQ_DATA.map(item => item.category))];

  const filteredFAQ = FAQ_DATA.filter(item => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="faq-page">
      <section className="faq-hero">
        <div className="hero-content">
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about Tycoon Sourcing</p>
        </div>
      </section>

      <div className="faq-container">
        <div className="faq-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="category-filters">
            <button
              className={`filter-btn ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category}
                className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {filteredFAQ.length > 0 ? (
          <div className="faq-results">
            <p className="results-count">
              Showing {filteredFAQ.length} of {FAQ_DATA.length} questions
            </p>
            <FAQSection category={selectedCategory} />
          </div>
        ) : (
          <div className="no-results">
            <h3>No results found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      <section className="faq-cta">
        <div className="cta-content">
          <h2>Didn't find what you're looking for?</h2>
          <p>Our customer support team is here to help</p>
          <div className="cta-buttons">
            <a href="mailto:support@tycoonsourcing.com" className="btn btn-primary">
              📧 Email Support
            </a>
            <a href="tel:1300TYCOON" className="btn btn-secondary">
              📞 Call Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
