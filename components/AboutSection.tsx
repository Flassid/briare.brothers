'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Target, Users, Zap, Shield } from 'lucide-react';

const values = [
  {
    icon: Zap,
    title: 'Innovation',
    description: 'Constantly pushing boundaries with cutting-edge trading algorithms and creative app designs.',
  },
  {
    icon: Shield,
    title: 'Reliability',
    description: 'Our bots run 24/7 with proven systems. Our signals maintain 75%+ accuracy.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Building a thriving community of traders and developers who support each other.',
  },
  {
    icon: Target,
    title: 'Results',
    description: 'We focus on delivering real value - profitable trades and beautiful apps.',
  },
];

const milestones = [
  { value: '2023', label: 'Founded' },
  { value: '75%+', label: 'Signal Accuracy' },
  { value: '10K+', label: 'Downloads' },
  { value: '24/7', label: 'Bot Uptime' },
];

export default function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="about" className="min-h-screen py-20 relative" aria-labelledby="about-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 id="about-heading" className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              About Briare Brothers
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Two brothers united by a passion for technology, trading, and creative software.
            We build tools that help traders succeed and apps that delight users.
          </p>
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass p-10 rounded-3xl mb-16 border border-white/5"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Our Story</h3>
              <p className="text-gray-200 mb-4 leading-relaxed">
                What started as late-night coding sessions and crypto trading experiments has grown
                into a multi-faceted tech venture. We saw opportunities in the memecoin market that
                others missed and built automated systems to capitalize on them.
              </p>
              <p className="text-gray-200 mb-4 leading-relaxed">
                Along the way, our passion for mobile development led us to create stunning live
                wallpapers that have been downloaded thousands of times. We&apos;re now sharing our
                knowledge through our developer SDK and expanding into mobile gaming.
              </p>
              <p className="text-gray-200 leading-relaxed">
                Today, we run automated trading bots, deliver high-accuracy signals via Telegram
                and WhatsApp, and continue to innovate in the Android app space. Our mission is
                simple: leverage technology to create value for our community.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4" role="list" aria-label="Company milestones">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="glass p-6 rounded-2xl text-center border border-white/5 hover:border-cyan-500/30 transition-all"
                  role="listitem"
                >
                  <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
                    {milestone.value}
                  </div>
                  <div className="text-gray-300">{milestone.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" role="list" aria-label="Our values">
          {values.map((value, index) => (
            <motion.article
              key={value.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -10 }}
              className="glass p-8 rounded-2xl text-center group border border-white/5 hover:border-purple-500/30 transition-all"
              role="listitem"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center"
                aria-hidden="true"
              >
                <value.icon className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-white">{value.title}</h3>
              <p className="text-gray-300">{value.description}</p>
            </motion.article>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-gray-400 mb-6">Ready to join our community?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="#trading"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25"
            >
              Start Trading
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-full glass border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
            >
              Get In Touch
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
