'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Bot, TrendingUp, Bell, MessageCircle, BarChart3, Shield } from 'lucide-react';

const tradingServices = [
  {
    icon: Bot,
    title: 'Memecoin Trading Bots',
    description: 'Automated bots that trade memecoins 24/7 using proven algorithms and real-time market analysis.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: TrendingUp,
    title: 'Crypto Live Signals',
    description: 'Real-time trading signals delivered to Telegram & WhatsApp with 75%+ accuracy rate.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: BarChart3,
    title: 'Stock Market Signals',
    description: 'Expert analysis and live calls for traditional stock exchanges and forex markets.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: MessageCircle,
    title: 'Telegram/WhatsApp Channels',
    description: 'Join our premium channels for instant notifications on market opportunities.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Bell,
    title: 'Alert System',
    description: 'Never miss a trade. Get instant push notifications for high-confidence setups.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Shield,
    title: 'Risk Management',
    description: 'Built-in stop-loss and take-profit mechanisms to protect your investments.',
    color: 'from-teal-500 to-cyan-500',
  },
];

export default function CryptoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="trading" className="min-h-screen py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Trading & Signals
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Automated memecoin trading bots and real-time signals for crypto and stock markets.
            Join thousands of traders using our proven systems.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tradingServices.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="glass p-8 rounded-2xl relative overflow-hidden group cursor-pointer border border-white/5 hover:border-cyan-500/30 transition-all"
            >
              {/* Gradient overlay on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              />

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6`}>
                <service.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-3 text-white">
                {service.title}
              </h3>
              <p className="text-gray-400">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Pricing Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20"
        >
          <h3 className="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Subscription Plans
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic */}
            <div className="glass p-8 rounded-3xl border border-white/10 hover:border-cyan-500/30 transition-all">
              <h4 className="text-xl font-bold text-white mb-2">Starter</h4>
              <div className="text-4xl font-bold text-cyan-400 mb-4">$29<span className="text-lg text-gray-500">/mo</span></div>
              <ul className="space-y-3 mb-8 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                  Telegram Signal Channel
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                  5-10 Signals/Day
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                  Basic Market Analysis
                </li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 font-semibold hover:from-cyan-500/30 hover:to-blue-500/30 transition-all">
                Get Started
              </button>
            </div>

            {/* Pro */}
            <div className="glass p-8 rounded-3xl border-2 border-purple-500/50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Pro</h4>
              <div className="text-4xl font-bold text-purple-400 mb-4">$79<span className="text-lg text-gray-500">/mo</span></div>
              <ul className="space-y-3 mb-8 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Telegram + WhatsApp
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  20+ Signals/Day
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Crypto + Stock Signals
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Priority Support
                </li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25">
                Subscribe Now
              </button>
            </div>

            {/* Bot Access */}
            <div className="glass p-8 rounded-3xl border border-white/10 hover:border-green-500/30 transition-all">
              <h4 className="text-xl font-bold text-white mb-2">Bot Access</h4>
              <div className="text-4xl font-bold text-green-400 mb-4">$199<span className="text-lg text-gray-500">/mo</span></div>
              <ul className="space-y-3 mb-8 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  All Pro Features
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Automated Trading Bot
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Custom Parameters
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  1-on-1 Setup Call
                </li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 font-semibold hover:from-green-500/30 hover:to-emerald-500/30 transition-all">
                Get Bot Access
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
