'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { TrendingUp, Shield, Zap, BarChart3, Bitcoin, Wallet } from 'lucide-react';

const cryptoServices = [
  {
    icon: Bitcoin,
    title: 'Crypto Portfolio Management',
    description: 'Expert management of diversified cryptocurrency portfolios with proven strategies.',
    color: 'from-orange-500 to-yellow-500',
  },
  {
    icon: TrendingUp,
    title: 'Trading Strategies',
    description: 'Advanced algorithmic trading and market analysis for maximum returns.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Secure Custody',
    description: 'Military-grade security for your digital assets with multi-signature wallets.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: BarChart3,
    title: 'Market Analysis',
    description: 'Real-time market insights and comprehensive research reports.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Zap,
    title: 'DeFi Solutions',
    description: 'Leverage decentralized finance opportunities with expert guidance.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Wallet,
    title: 'Staking & Yield',
    description: 'Maximize passive income through strategic staking and yield farming.',
    color: 'from-indigo-500 to-purple-500',
  },
];

export default function CryptoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="crypto" className="min-h-screen py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Crypto Investment Solutions</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Navigate the digital asset landscape with confidence. Our expert team delivers
            institutional-grade crypto investment services tailored to your goals.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cryptoServices.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="glass p-8 rounded-2xl relative overflow-hidden group cursor-pointer"
            >
              {/* Gradient overlay on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              />

              {/* Icon */}
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6`}
              >
                <service.icon className="w-8 h-8 text-white" />
              </motion.div>

              {/* Content */}
              <h3 className="text-2xl font-bold mb-4 text-white">
                {service.title}
              </h3>
              <p className="text-gray-400">
                {service.description}
              </p>

              {/* Animated border */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/50 rounded-2xl transition-all duration-300" />
            </motion.div>
          ))}
        </div>

        {/* Performance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 glass p-10 rounded-3xl"
        >
          <h3 className="text-3xl font-bold text-center mb-10 gradient-text">
            Our Track Record
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-400 mb-2">+287%</div>
              <div className="text-gray-400">Average Annual Return</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-400 mb-2">24/7</div>
              <div className="text-gray-400">Market Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-400 mb-2">5000+</div>
              <div className="text-gray-400">Successful Trades</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-pink-400 mb-2">$2B+</div>
              <div className="text-gray-400">Trading Volume</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
