'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="about" className="py-32 px-6 border-t border-white/[0.04]">
      <div className="max-w-6xl mx-auto" ref={ref}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 mb-4">About</p>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
            <span className="gradient-text">Two brothers,</span>
            <br />
            <span className="text-zinc-600">one mission.</span>
          </h2>
        </motion.div>

        {/* Two column story */}
        <div className="grid md:grid-cols-2 gap-16 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <p className="text-zinc-400 leading-relaxed mb-6">
              Briare Brothers was founded in 2025 with a simple bet: two focused people
              with the right tools can outship a 10-person team. So far, that bet's paying off.
            </p>
            <p className="text-zinc-400 leading-relaxed mb-6">
              <strong className="text-white">Ty</strong> handles product and vision — finding real problems worth solving and defining exactly what to build.
              He's a chef trainer at a major high-end grocery chain by day, which is how Aboyeur was born.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              <strong className="text-white">Andrew</strong> handles engineering — turning ideas into production systems.
              The kind of programmer who thinks about architecture before writing a single line.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-4"
          >
            {[
              { label: 'Founded', value: '2025' },
              { label: 'Structure', value: 'Wyoming LLC' },
              { label: 'Team', value: '2 founders' },
              { label: 'Funding', value: 'Bootstrapped' },
              { label: 'Products', value: '4 shipped' },
              { label: 'North Star', value: '$1M revenue' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.07 }}
                className="flex items-center justify-between py-4 border-b border-white/[0.06]"
              >
                <span className="text-sm text-zinc-600 uppercase tracking-wider">{item.label}</span>
                <span className="text-sm font-semibold text-white">{item.value}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Principles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="card p-8"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 mb-8">How we operate</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Ship fast', desc: 'Working software beats perfect software. We bias toward action and iterate in public.' },
              { num: '02', title: 'Real problems', desc: "We only build things people actually need. Aboyeur exists because Ty watched the old system fail every shift." },
              { num: '03', title: 'AI-native', desc: "Every product is designed around AI from day one. Not bolted on — baked in." },
              { num: '04', title: 'No fluff', desc: "No investors. No bloat. No account managers. Just two people and the tools we need." },
            ].map((p) => (
              <div key={p.num}>
                <div className="text-xs text-zinc-700 font-mono mb-3">{p.num}</div>
                <h3 className="font-bold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
