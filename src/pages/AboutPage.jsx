// src/pages/AboutPage.jsx
import React from 'react';
import WarehouseLocations from '../components/WarehouseLocations';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="hero-content">
          <h1>About Tycoon Sourcing</h1>
          <p className="hero-subtitle">
            Australia's trusted wholesale trading platform connecting retailers, 
            resellers, and businesses with quality suppliers and products.
          </p>
        </div>
      </section>

      <section className="about-mission">
        <div className="section-container">
          <h2>Our Mission</h2>
          <p>
            To simplify wholesale trading by providing a transparent, efficient, and reliable 
            platform where businesses can source products directly from trusted suppliers. 
            We empower retailers and resellers to grow by offering competitive pricing, 
            fast logistics, and exceptional customer service.
          </p>
        </div>
      </section>

      <section className="about-values">
        <div className="section-container">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>Trust</h3>
              <p>
                We believe in building long-term relationships based on transparency, 
                integrity, and reliability in every transaction.
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">⚡</div>
              <h3>Efficiency</h3>
              <p>
                From sourcing to delivery, we streamline the wholesale process to save 
                you time and reduce operational costs.
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">📈</div>
              <h3>Growth</h3>
              <p>
                Your success is our success. We provide the tools and support needed 
                for your business to scale and thrive.
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">🌍</div>
              <h3>Reach</h3>
              <p>
                With warehouses across Australia, we ensure fast, reliable delivery 
                to retailers and businesses nationwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-timeline">
        <div className="section-container">
          <h2>Our Journey</h2>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-marker">
                <span className="timeline-year">2020</span>
              </div>
              <div className="timeline-content">
                <h4>Founded</h4>
                <p>Tycoon Sourcing launches as a digital wholesale trading platform in Brisbane.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-marker">
                <span className="timeline-year">2021</span>
              </div>
              <div className="timeline-content">
                <h4>Expansion Begins</h4>
                <p>Opened first regional warehouses in Sydney and Melbourne.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-marker">
                <span className="timeline-year">2022</span>
              </div>
              <div className="timeline-content">
                <h4>National Coverage</h4>
                <p>Expanded to 7 strategic locations across Australia for faster delivery.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-marker">
                <span className="timeline-year">2024</span>
              </div>
              <div className="timeline-content">
                <h4>Technology Upgrade</h4>
                <p>Launched new portal with real-time inventory, advanced analytics, and improved user experience.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-warehouses">
        <div className="section-container">
          <WarehouseLocations variant="grid" />
        </div>
      </section>

      <section className="about-team">
        <div className="section-container">
          <h2>Why Choose Us</h2>
          <div className="why-grid">
            <div className="why-item">
              <span className="why-icon">✓</span>
              <h4>Competitive Pricing</h4>
              <p>Direct supplier relationships mean better wholesale rates for your business.</p>
            </div>
            <div className="why-item">
              <span className="why-icon">✓</span>
              <h4>Fast Delivery</h4>
              <p>7 warehouse locations ensure your orders arrive quickly across Australia.</p>
            </div>
            <div className="why-item">
              <span className="why-icon">✓</span>
              <h4>Easy Platform</h4>
              <p>User-friendly interface with real-time inventory, order tracking, and support.</p>
            </div>
            <div className="why-item">
              <span className="why-icon">✓</span>
              <h4>Flexible Terms</h4>
              <p>Various payment and pickup options to suit your business needs.</p>
            </div>
            <div className="why-item">
              <span className="why-icon">✓</span>
              <h4>Professional Support</h4>
              <p>Dedicated customer service team ready to assist with any questions.</p>
            </div>
            <div className="why-item">
              <span className="why-icon">✓</span>
              <h4>Secure Transactions</h4>
              <p>Advanced security and compliance to protect your business and data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-contact">
        <div className="section-container contact-cta">
          <h2>Get in Touch</h2>
          <p>Have questions? Our team is here to help.</p>
          <div className="contact-links">
            <a href="mailto:support@tycoonsourcing.com" className="btn btn-primary">
              📧 Email Us
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
