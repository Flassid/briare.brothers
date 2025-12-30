'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Smartphone, Palette, Code2, Gamepad2, Crown, Sparkles } from 'lucide-react';

const products = [
  {
    icon: Smartphone,
    title: 'Live Wallpapers',
    description: 'Premium animated wallpapers for Android. Dynamic visuals that bring your home screen to life.',
    features: ['4K Resolution', 'Battery Optimized', 'Customizable'],
    color: 'from-purple-500 to-pink-500',
    badge: 'Popular',
  },
  {
    icon: Palette,
    title: 'Wallpaper Collection',
    description: 'Curated collection of stunning live wallpapers across multiple themes and styles.',
    features: ['50+ Wallpapers', 'Regular Updates', 'Exclusive Designs'],
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Code2,
    title: 'Developer Library',
    description: 'Build your own Android live wallpapers with our comprehensive SDK and documentation.',
    features: ['Full Source Code', 'Documentation', 'Email Support'],
    color: 'from-green-500 to-emerald-500',
    price: '$50',
    badge: 'One-Time',
  },
  {
    icon: Gamepad2,
    title: 'Mobile Games',
    description: 'Engaging mobile games crafted with passion. Fun, addictive, and beautifully designed.',
    features: ['Free to Play', 'No Ads', 'Regular Updates'],
    color: 'from-orange-500 to-red-500',
    badge: 'Coming Soon',
  },
];

const featuredGame = {
  title: 'Kill the King',
  description: 'Strategic puzzle game where you must outsmart the royal guards and capture the king. Plan your moves carefully in this chess-inspired adventure.',
  features: [
    'Strategic Gameplay',
    'Multiple Levels',
    'Leaderboards',
    'Daily Challenges',
  ],
  status: 'In Development',
};

export default function SoftwareSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="products" className="min-h-screen py-20 relative" aria-labelledby="products-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 id="products-heading" className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Products & Apps
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Premium Android live wallpapers, developer tools, and exciting mobile games.
            Download from Google Play or build your own with our SDK.
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20" role="list">
          {products.map((product, index) => (
            <motion.article
              key={product.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="glass p-8 rounded-2xl relative overflow-hidden group border border-white/5 hover:border-purple-500/30 transition-all"
              role="listitem"
            >
              {/* Badge */}
              {product.badge && (
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${
                  product.badge === 'Coming Soon'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : product.badge === 'One-Time'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}>
                  {product.badge}
                </div>
              )}

              {/* Animated background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                aria-hidden="true"
              />

              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center mb-6 relative z-10`}
                aria-hidden="true"
              >
                <product.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-2xl font-bold text-white relative z-10">
                  {product.title}
                </h3>
                {product.price && (
                  <span className="text-2xl font-bold text-green-400">{product.price}</span>
                )}
              </div>
              <p className="text-gray-300 mb-6 relative z-10">
                {product.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 relative z-10">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${product.color}`} aria-hidden="true" />
                    <span className="text-sm text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`mt-6 w-full py-3 rounded-xl font-semibold transition-all ${
                  product.badge === 'Coming Soon'
                    ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed border border-gray-500/30'
                    : `bg-gradient-to-r ${product.color} text-white hover:opacity-90`
                }`}
                disabled={product.badge === 'Coming Soon'}
              >
                {product.badge === 'Coming Soon' ? 'Coming Soon' : product.price ? 'Purchase SDK' : 'Download Now'}
              </motion.button>
            </motion.article>
          ))}
        </div>

        {/* Featured Game Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="glass p-10 rounded-3xl relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-bold text-white">{featuredGame.title}</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {featuredGame.status}
                  </span>
                </div>
                <p className="text-gray-400">Featured Game</p>
              </div>
            </div>

            <p className="text-lg text-gray-300 mb-8 max-w-2xl">
              {featuredGame.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {featuredGame.features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-2 text-gray-300"
                >
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span className="text-sm">{feature}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-400 font-semibold hover:from-orange-500/30 hover:to-red-500/30 transition-all"
              >
                Get Notified on Release
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 rounded-xl glass border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-all"
              >
                View Development Blog
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Google Play Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 mb-4">Available on</p>
          <div className="flex justify-center gap-4">
            <motion.a
              href="#"
              whileHover={{ scale: 1.05 }}
              className="px-6 py-3 rounded-xl bg-black border border-white/20 text-white font-semibold flex items-center gap-2 hover:bg-white/5 transition-all"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
              </svg>
              Google Play
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
