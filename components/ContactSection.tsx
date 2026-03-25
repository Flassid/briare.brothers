'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Github, Mail } from 'lucide-react';

export default function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="contact" className="py-32 px-6 border-t border-white/[0.04]">
      <div className="max-w-6xl mx-auto" ref={ref}>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative card p-12 md:p-20 text-center overflow-hidden mb-16"
        >
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] hero-orb opacity-40" />
          </div>

          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 mb-6">Contact</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
              <span className="gradient-text">Let's build</span>
              <br />
              <span className="text-zinc-600">something real.</span>
            </h2>
            <p className="text-zinc-500 max-w-lg mx-auto mb-10 leading-relaxed">
              You'll talk to the people who actually build the product — not an account manager.
              We respond fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:briare.brothers@gmail.com"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-100 transition-colors"
              >
                <Mail className="w-4 h-4" />
                briare.brothers@gmail.com
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href="https://github.com/Flassid"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm hover:bg-white/[0.04] hover:border-white/20 transition-all"
              >
                <Github className="w-4 h-4" />
                github.com/Flassid
              </a>
            </div>
          </div>
        </motion.div>

        {/* Open to grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 mb-6">Open to</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Enterprise KDS', desc: 'Restaurants looking to upgrade their kitchen display system with AI.' },
              { title: 'Custom AI Software', desc: 'Teams that need AI-native products built fast and built right.' },
              { title: 'Game Projects', desc: 'Interesting multiplayer or physics-heavy game concepts.' },
              { title: 'Partnership', desc: "Complementary builders who want to ship something together." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="card p-5"
              >
                <h3 className="font-semibold text-white mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
