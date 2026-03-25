'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { BrainCircuit, Gamepad2, Globe, Monitor, Server, Code2 } from 'lucide-react';

const services = [
  { icon: BrainCircuit, title: 'AI Integration', desc: 'LLM pipelines, agent workflows, vector search. AI-native, not AI-bolted-on.', color: '#3b82f6' },
  { icon: Gamepad2, title: 'Game Dev', desc: 'Browser and desktop games with real physics, multiplayer, and great feel.', color: '#a855f7' },
  { icon: Globe, title: 'Web Platforms', desc: 'Fast, modern web apps with pixel-perfect UI and production-grade architecture.', color: '#06b6d4' },
  { icon: Monitor, title: 'Desktop Apps', desc: 'Cross-platform native desktop apps. Fast, offline-first, built with Tauri + Rust.', color: '#f59e0b' },
  { icon: Server, title: 'Backend Systems', desc: 'Scalable APIs, real-time infra, and data pipelines built to handle production load.', color: '#22c55e' },
  { icon: Code2, title: 'Custom Builds', desc: "Scope it, build it, ship it. No account managers, no hand-holding.", color: '#ec4899' },
];

const stack = ['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Rust', 'Tauri', 'Three.js', 'Supabase', 'PostgreSQL', 'AWS', 'Docker'];

export default function SoftwareSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section id="software" className="py-32 px-6 relative border-t border-white/[0.04]">
      <div className="max-w-6xl mx-auto" ref={ref}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 mb-4">Services</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
              <span className="gradient-text">What we do</span>
            </h2>
            <p className="text-zinc-500 max-w-sm text-sm leading-relaxed">
              We build across the full stack — AI, web, games, and native desktop. If it needs to be built well, we can build it.
            </p>
          </div>
        </motion.div>

        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="card p-6 group hover:border-white/[0.14] transition-all"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}
              >
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <h3 className="font-bold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="card p-8"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 mb-6">Our stack</p>
          <div className="flex flex-wrap gap-3">
            {stack.map((tech, i) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.5 + i * 0.04 }}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-zinc-400 hover:text-white hover:border-white/[0.12] transition-colors cursor-default"
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
