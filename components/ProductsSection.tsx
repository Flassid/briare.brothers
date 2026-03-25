'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ExternalLink, Github, ArrowUpRight } from 'lucide-react';

const products = [
  {
    id: 'erewhonpos',
    title: 'ErewhonPOS',
    tagline: 'AI Kitchen Display System',
    description:
      'Replaced Erewhon\'s legacy KDS hardware at Beverly Hills with a real-time AI order management system. 16,789+ orders processed without a single failure. Enterprise SaaS deal in motion for all 14 stores.',
    status: 'LIVE',
    statusClass: 'text-green-400',
    dotClass: 'dot-live',
    accent: '#22c55e',
    tags: ['Enterprise SaaS', 'React', 'Supabase', 'Real-time'],
    size: 'large',
    github: null,
    link: null,
    metric: { value: '16,789+', label: 'orders processed' },
  },
  {
    id: 'nexus',
    title: 'Nexus Files',
    tagline: 'AI-Powered File Explorer',
    description:
      'Local-first file manager with AI search, smart tagging, and instant organization. Built with Tauri for native performance. Feature-complete and ready to ship.',
    status: 'BETA',
    statusClass: 'text-blue-400',
    dotClass: 'dot-beta',
    accent: '#3b82f6',
    tags: ['Tauri', 'Rust', 'React', 'Local-First'],
    size: 'small',
    github: 'https://github.com/Flassid/Nexus',
    link: null,
    metric: { value: '5/5', label: 'phases complete' },
  },
  {
    id: 'stussy',
    title: 'StussyGauntlet',
    tagline: 'Browser Multiplayer Hack-n-Slash',
    description:
      'Gauntlet Legends in your browser. Share a link, drop into co-op instantly. No download. WoW-style combat, 3D dungeons, 4-player online.',
    status: 'IN DEV',
    statusClass: 'text-purple-400',
    dotClass: 'dot-dev',
    accent: '#a855f7',
    tags: ['Three.js', 'Colyseus', 'React', 'WebGL'],
    size: 'small',
    github: null,
    link: null,
    metric: { value: '4-player', label: 'online co-op' },
  },
  {
    id: 'echopalace',
    title: 'EchoPalace',
    tagline: 'AI Spatial Memory Palace',
    description:
      'Intent-driven knowledge management as a 3D spatial environment. Autonomous AI agents help you capture, organize, and recall anything. Built for deep knowledge workers.',
    status: 'EARLY ACCESS',
    statusClass: 'text-amber-400',
    dotClass: 'dot-early',
    accent: '#f59e0b',
    tags: ['Tauri', 'Three.js', 'LanceDB', 'Ollama'],
    size: 'large',
    github: null,
    link: null,
    metric: { value: 'Phase 1', label: 'in development' },
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function ProductsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section id="products" className="py-32 px-6 relative">
      <div className="max-w-6xl mx-auto" ref={ref}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 mb-4">Products</p>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
            <span className="gradient-text">What we've built</span>
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              custom={i}
              initial="hidden"
              animate={isInView ? 'show' : 'hidden'}
              variants={fadeUp}
              className="card p-8 relative overflow-hidden group cursor-default"
              style={{ '--accent': p.accent } as React.CSSProperties}
            >
              {/* Accent glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(ellipse at top left, ${p.accent}12 0%, transparent 60%)` }}
              />

              {/* Top row */}
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${p.dotClass}`} />
                  <span className={`text-xs font-semibold tracking-wide ${p.statusClass}`}>{p.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  {p.github && (
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
                    >
                      <Github className="w-3.5 h-3.5 text-zinc-400" />
                    </a>
                  )}
                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    </a>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-2xl font-black tracking-tight text-white mb-1">{p.title}</h3>
                <p className="text-sm font-medium mb-5" style={{ color: p.accent }}>{p.tagline}</p>
                <p className="text-zinc-500 text-sm leading-relaxed mb-8">{p.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs text-zinc-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Metric */}
                <div className="pt-6 border-t border-white/[0.06] flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-black tracking-tight stat-number" style={{ color: p.accent }}>
                      {p.metric.value}
                    </div>
                    <div className="text-xs text-zinc-600 mt-0.5">{p.metric.label}</div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
