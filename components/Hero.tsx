'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Bot, Smartphone, TrendingUp } from 'lucide-react';

export default function Hero() {
  const handleNavClick = (href: string) => {
    const element = document.getElementById(href.slice(1));
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-500/30 mb-8"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">Trading Bots Active 24/7</span>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Briare Brothers
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl lg:text-3xl text-gray-100 mb-4"
          >
            Automated Trading &bull; Live Wallpapers &bull; Gaming
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto"
          >
            Memecoin trading bots with proven algorithms. Premium Android live wallpapers.
            Real-time crypto signals on Telegram &amp; WhatsApp with 75%+ accuracy.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.a
              href="#trading"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('#trading');
              }}
              className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-white font-semibold flex items-center gap-2 hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-cyan-500/25"
            >
              <Bot className="w-5 h-5" aria-hidden="true" />
              Explore Trading Bots
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </motion.a>

            <motion.a
              href="#products"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('#products');
              }}
              className="group px-8 py-4 glass rounded-full text-white font-semibold flex items-center gap-2 hover:bg-white/10 transition-all duration-300 border border-white/10"
            >
              <Smartphone className="w-5 h-5" aria-hidden="true" />
              View Products
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </motion.a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-20"
          >
            <div className="glass p-6 rounded-2xl border border-cyan-500/20">
              <h3 className="text-4xl font-bold text-cyan-400 mb-2">75%+</h3>
              <p className="text-gray-400">Signal Accuracy</p>
            </div>
            <div className="glass p-6 rounded-2xl border border-purple-500/20">
              <h3 className="text-4xl font-bold text-purple-400 mb-2">24/7</h3>
              <p className="text-gray-400">Bot Trading</p>
            </div>
            <div className="glass p-6 rounded-2xl border border-pink-500/20">
              <h3 className="text-4xl font-bold text-pink-400 mb-2">10K+</h3>
              <p className="text-gray-400">Wallpaper Downloads</p>
            </div>
            <div className="glass p-6 rounded-2xl border border-green-500/20">
              <h3 className="text-4xl font-bold text-green-400 mb-2">$50</h3>
              <p className="text-gray-400">Dev Library</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        aria-hidden="true"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-cyan-500/30 rounded-full flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-cyan-500/50 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
