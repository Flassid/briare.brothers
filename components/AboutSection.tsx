'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Target, Users, Award, Lightbulb } from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Mission-Driven',
    description: 'Empowering clients through innovative technology and strategic investments.',
  },
  {
    icon: Users,
    title: 'Client-Focused',
    description: 'Your success is our success. We prioritize long-term relationships.',
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'Committed to delivering exceptional quality in everything we do.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'Constantly pushing boundaries and exploring new opportunities.',
  },
];

export default function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="about" className="min-h-screen py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">About Briare Brothers</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Founded with a vision to bridge traditional finance and cutting-edge technology,
            Briare Brothers has become a trusted name in crypto investments and software development.
          </p>
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass p-10 rounded-3xl mb-16"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6 gradient-text">Our Story</h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                What started as two brothers' passion for blockchain technology and software engineering
                has evolved into a full-service firm serving clients worldwide.
              </p>
              <p className="text-gray-300 mb-4 leading-relaxed">
                We combine deep technical expertise with financial acumen to deliver solutions
                that not only meet but exceed expectations. Our team of experts works tirelessly
                to stay ahead of market trends and technological innovations.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Today, we manage hundreds of millions in crypto assets and have delivered
                countless software solutions that power businesses across industries.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="glass p-6 rounded-2xl"
              >
                <div className="text-4xl font-bold gradient-text mb-2">2018</div>
                <div className="text-gray-400">Founded</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="glass p-6 rounded-2xl"
              >
                <div className="text-4xl font-bold gradient-text mb-2">50+</div>
                <div className="text-gray-400">Team Members</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="glass p-6 rounded-2xl"
              >
                <div className="text-4xl font-bold gradient-text mb-2">40+</div>
                <div className="text-gray-400">Countries</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="glass p-6 rounded-2xl"
              >
                <div className="text-4xl font-bold gradient-text mb-2">1000+</div>
                <div className="text-gray-400">Clients</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="glass p-8 rounded-2xl text-center group"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
              >
                <value.icon className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold mb-3">{value.title}</h3>
              <p className="text-gray-400">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
