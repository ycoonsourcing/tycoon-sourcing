import React from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle2, Clock, TrendingUp, Globe } from 'lucide-react';

function WhyChooseUs() {
  const benefits = [
    {
      icon: Award,
      title: 'Industry Expertise',
      description: 'Over 10 years of experience in global sourcing across multiple industries and product categories.',
    },
    {
      icon: CheckCircle2,
      title: 'Verified Suppliers',
      description: 'All suppliers undergo strict verification processes including background checks and quality audits.',
    },
    {
      icon: Globe,
      title: 'Quality Assurance',
      description: 'Multi-stage inspection systems ensure products meet international quality and safety standards.',
    },
    {
      icon: TrendingUp,
      title: 'Competitive Pricing',
      description: 'Leverage our bulk purchasing power and supplier relationships to get the best prices available.',
    },
    {
      icon: Clock,
      title: 'Fast Turnaround',
      description: 'Efficient processes and established logistics networks ensure quick delivery times worldwide.',
    },
  ];

  return (
    <section id="about" className="py-16 md:py-24 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why Choose Tycoon Sourcing?
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Partner with a team that puts your success first
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Benefits List */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-start gap-4 bg-white/5 backdrop-blur-sm p-6 rounded-lg hover:bg-white/10 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1684400661290-50c3f2600cf0"
                alt="Modern warehouse with organized inventory showcasing efficient logistics and quality control processes"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent"></div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-30"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-30"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;