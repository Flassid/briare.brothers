'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  show: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] } }),
};

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex flex-col items-center justify-center px-6 grid-bg overflow-hidden">

      {/* Radial glow behind headline */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] hero-orb pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center pt-20">

        {/* Badge */}
        <motion.div
          initial="hidden"
          animate="show"
          custom={0}
          variants={FADE_UP}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-xs text-zinc-400 mb-10 tracking-wide"
        >
          <span className="w-1.5 h-1.5 rounded-full dot-live" />
          Indie Dev Studio · Wyoming LLC · Est. 2025
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial="hidden"
          animate="show"
          custom={0.1}
          variants={FADE_UP}
          className="text-6xl md:text-8xl lg:text-[100px] font-black tracking-tighter leading-none mb-6"
        >
          <span className="gradient-text">Build</span>
          <br />
          <span className="text-zinc-600">things</span>{' '}
          <span className="gradient-text-color">that</span>
          <br />
          <span className="gradient-text">ship.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial="hidden"
          animate="show"
          custom={0.25}
          variants={FADE_UP}
          className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Two brothers making AI-powered software and games.
          From enterprise kitchen tech to browser multiplayer — we move fast, ship real, and don't stop.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial="hidden"
          animate="show"
          custom={0.4}
          variants={FADE_UP}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <a
            href="#products"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-100 transition-colors duration-200"
          >
            See our products
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm hover:bg-white/[0.04] hover:border-white/20 transition-all duration-200"
          >
            Work with us
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial="hidden"
          animate="show"
          custom={0.55}
          variants={FADE_UP}
          className="mt-24 grid grid-cols-3 gap-px border border-white/[0.06] rounded-2xl overflow-hidden"
        >
          {[
            { value: '4', label: 'Products Shipped' },
            { value: '16,789+', label: 'Orders Processed' },
            { value: '0', label: 'Outside Funding' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors px-6 py-8 text-center">
              <div className="text-3xl md:text-4xl font-black tracking-tight gradient-text-color mb-1 stat-number">
                {stat.value}
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-10 bg-gradient-to-b from-transparent via-zinc-600 to-transparent"
        />
      </motion.div>
    </section>
  );
}
