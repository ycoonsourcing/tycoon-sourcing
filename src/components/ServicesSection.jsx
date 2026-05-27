import React from 'react';
import { motion } from 'framer-motion';
import { Package, ShieldCheck, Truck, Users, DollarSign } from 'lucide-react';

function ServicesSection() {
  const services = [
    {
      icon: Package,
      title: 'Product Sourcing',
      description: 'Access thousands of verified suppliers and manufacturers worldwide. We help you find the perfect products for your business needs.',
    },
    {
      icon: ShieldCheck,
      title: 'Quality Control',
      description: 'Rigorous inspection processes ensure every product meets international quality standards before shipment.',
    },
    {
      icon: Truck,
      title: 'Logistics & Shipping',
      description: 'Streamlined shipping solutions with tracking, customs clearance, and delivery to your doorstep.',
    },
    {
      icon: Users,
      title: 'Supplier Verification',
      description: 'Thoroughly vetted suppliers with verified credentials, certifications, and proven track records.',
    },
    {
      icon: DollarSign,
      title: 'Competitive Pricing',
      description: 'Leverage our global network to secure the best prices and negotiate favorable terms for your business.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section id="services" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive sourcing solutions tailored to your business needs
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl p-8 transition-all duration-300 hover:scale-105 border border-gray-100"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center mb-6">
                  <Icon className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default ServicesSection;