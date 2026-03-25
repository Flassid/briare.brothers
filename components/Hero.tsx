'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Gamepad2, Cpu } from 'lucide-react';

export default function Hero() {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Eyebrow label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-gray-400 mb-8 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Indie Dev Studio · Wyoming, USA
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Briare Brothers</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl lg:text-3xl text-gray-300 mb-8"
          >
            Building{' '}
            <span className="text-blue-400">AI-Powered Software</span>
            {' '}&{' '}
            <span className="text-purple-400">Games</span>
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto"
          >
            Two brothers shipping products that actually work — from enterprise kitchen tech
            to browser-based multiplayer games. We move fast and build things that last.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.a
              href="#products"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-semibold flex items-center gap-2 hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
            >
              <Cpu className="w-5 h-5" />
              See Our Products
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.a>

            <motion.a
              href="#about"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group px-8 py-4 glass rounded-full text-white font-semibold flex items-center gap-2 hover:bg-white/10 transition-all duration-300"
            >
              <Gamepad2 className="w-5 h-5" />
              Our Story
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.a>
          </motion.div>

          {/* Stats — real ones only */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20"
          >
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-4xl font-bold gradient-text mb-2">4</h3>
              <p className="text-gray-400">Products Shipped</p>
            </div>
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-4xl font-bold gradient-text mb-2">16,789+</h3>
              <p className="text-gray-400">Orders Processed (ErewhonPOS)</p>
            </div>
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-4xl font-bold gradient-text mb-2">2</h3>
              <p className="text-gray-400">Founders, Zero Fluff</p>
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
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
