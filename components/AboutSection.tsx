'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Rocket, Users, Zap, Target } from 'lucide-react';

const values = [
  {
    icon: Rocket,
    title: 'Ship Fast',
    description: 'Ideas become products. We bias toward execution — working software over endless planning.',
  },
  {
    icon: Target,
    title: 'Real Problems',
    description: "We build for real users with real pain. ErewhonPOS wasn't a side project — it replaced a broken system live.",
  },
  {
    icon: Zap,
    title: 'AI-Native',
    description: 'Every product we build is designed around AI from day one — not bolted on after.',
  },
  {
    icon: Users,
    title: 'Two Brothers',
    description: "Small team, huge output. Ty handles product and vision. Andrew handles engineering. No bloat, no BS.",
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-gray-400 mb-6">
            Who We Are
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">About Briare Brothers</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A two-person dev studio building AI-powered software and games from the ground up.
          </p>
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass p-10 rounded-3xl mb-16 border border-white/[0.06]"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6 gradient-text">Our Story</h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Briare Brothers was born in 2025 with a simple thesis: two people with the right skills
                can outship a 10-person team if they stay focused and use the right tools.
              </p>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Ty brings product instinct and vision — identifying real problems worth solving, from
                Erewhon's broken kitchen display system to the gap in AI-powered file management.
                Andrew brings the engineering muscle to make it real.
              </p>
              <p className="text-gray-300 leading-relaxed">
                We're a Wyoming LLC, fully bootstrapped, and on a mission to build a million-dollar
                dev studio — one product at a time.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="glass p-6 rounded-2xl border border-white/[0.06]"
              >
                <div className="text-4xl font-bold gradient-text mb-2">2025</div>
                <div className="text-gray-400">Founded</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="glass p-6 rounded-2xl border border-white/[0.06]"
              >
                <div className="text-4xl font-bold gradient-text mb-2">2</div>
                <div className="text-gray-400">Founders</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="glass p-6 rounded-2xl border border-white/[0.06]"
              >
                <div className="text-4xl font-bold gradient-text mb-2">4</div>
                <div className="text-gray-400">Products Shipped</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="glass p-6 rounded-2xl border border-white/[0.06]"
              >
                <div className="text-4xl font-bold gradient-text mb-2">WY</div>
                <div className="text-gray-400">Wyoming LLC</div>
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
              whileHover={{ y: -8 }}
              className="glass p-8 rounded-2xl text-center group border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-14 h-14 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
              >
                <value.icon className="w-7 h-7 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold mb-3">{value.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
