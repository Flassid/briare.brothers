'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Code2, Cpu, Database, Globe, Lock, Smartphone } from 'lucide-react';

const softwareProducts = [
  {
    icon: Code2,
    title: 'Custom Software Development',
    description: 'Bespoke enterprise solutions built with cutting-edge technologies.',
    features: ['Scalable Architecture', 'Cloud-Native', 'API Integration'],
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Smartphone,
    title: 'Mobile Applications',
    description: 'Native and cross-platform mobile apps that users love.',
    features: ['iOS & Android', 'React Native', 'Flutter'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Globe,
    title: 'Web Platforms',
    description: 'Modern, responsive web applications with stunning UI/UX.',
    features: ['Next.js', 'React', 'TypeScript'],
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Database,
    title: 'Blockchain Solutions',
    description: 'Smart contracts, DApps, and blockchain infrastructure.',
    features: ['Ethereum', 'Solana', 'Web3'],
    color: 'from-green-500 to-teal-500',
  },
  {
    icon: Lock,
    title: 'Security Solutions',
    description: 'Advanced cybersecurity tools and penetration testing.',
    features: ['Encryption', 'Auditing', 'Compliance'],
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: Cpu,
    title: 'AI & Machine Learning',
    description: 'Intelligent automation and predictive analytics.',
    features: ['Deep Learning', 'NLP', 'Computer Vision'],
    color: 'from-violet-500 to-purple-500',
  },
];

export default function SoftwareSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="software" className="min-h-screen py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Software Solutions</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Transform your business with our innovative software products and services.
            From concept to deployment, we build technology that drives results.
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {softwareProducts.map((product, index) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="glass p-8 rounded-2xl relative overflow-hidden group"
            >
              {/* Animated background gradient */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Icon with animation */}
              <motion.div
                whileHover={{ scale: 1.2, rotate: 5 }}
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center mb-6 relative z-10`}
              >
                <product.icon className="w-8 h-8 text-white" />
              </motion.div>

              {/* Content */}
              <h3 className="text-2xl font-bold mb-3 text-white relative z-10">
                {product.title}
              </h3>
              <p className="text-gray-400 mb-6 relative z-10">
                {product.description}
              </p>

              {/* Features */}
              <div className="space-y-2 relative z-10">
                {product.features.map((feature, idx) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: index * 0.1 + idx * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${product.color}`} />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </motion.div>
                ))}
              </div>

              {/* Hover effect border */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-500/30 rounded-2xl transition-all duration-300" />
            </motion.div>
          ))}
        </div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20"
        >
          <h3 className="text-3xl font-bold text-center mb-10 gradient-text">
            Our Technology Stack
          </h3>
          <div className="glass p-10 rounded-3xl">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
              {['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Go', 'Rust', 'Solidity', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL'].map((tech, index) => (
                <motion.div
                  key={tech}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.2 }}
                  className="flex items-center justify-center p-4 rounded-xl glass hover:bg-white/10 transition-all duration-300 cursor-pointer"
                >
                  <span className="font-semibold text-gray-300">{tech}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
