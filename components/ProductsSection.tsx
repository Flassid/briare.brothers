'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ExternalLink, Github, ArrowUpRight, Layers, Smartphone } from 'lucide-react';

const products = [
  {
    id: 'aboyeur',
    title: 'Aboyeur',
    tagline: 'AI Kitchen Display System',
    description:
      'Replaced the legacy KDS hardware at a major high-end grocery chain with a real-time AI order management system. 32,497+ orders processed across 67 days without a single failure. Enterprise SaaS deal in motion for all 14 stores.',
    status: 'LIVE',
    statusClass: 'text-green-400',
    dotClass: 'dot-live',
    accent: '#22c55e',
    tags: ['Enterprise SaaS', 'React', 'Supabase', 'Real-time'],
    size: 'large',
    github: null,
    link: null,
    metric: { value: '32,497+', label: 'orders processed' },
  },
  {
    id: 'resurface',
    title: 'Resurface',
    tagline: 'Spaced Repetition Reminder App',
    description:
      'See it. Snap it. Forget it. We\'ll remind you. Capture a photo or note in under 2 seconds — Resurface sends automatic reminders at Day 1, 3, and 7 so nothing slips through the cracks. 100% offline, no account needed.',
    status: 'IN DEV',
    statusClass: 'text-purple-400',
    dotClass: 'dot-dev',
    accent: '#a855f7',
    tags: ['Expo', 'React Native', 'TypeScript', 'iOS', 'Android'],
    size: 'small',
    github: null,
    link: null,
    metric: { value: '$4.99', label: 'one-time unlock' },
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
    id: 'livewallpaper',
    title: 'Live Wallpaper SDK',
    tagline: 'Android SDK · Unity Asset Store',
    description:
      'Published Unity plugin that lets developers turn any Unity scene into an Android live wallpaper. Available on the Unity Asset Store — drop-in integration with full render pipeline support.',
    status: 'LIVE',
    statusClass: 'text-green-400',
    dotClass: 'dot-live',
    accent: '#22c55e',
    tags: ['Unity', 'Android', 'SDK', 'Asset Store'],
    size: 'small',
    github: null,
    link: 'https://assetstore.unity.com/packages/tools/integration/live-wallpaper-sdk-for-android-353384',
    metric: { value: 'Published', label: 'Unity Asset Store' },
  },
  {
    id: 'mtgdb',
    title: 'MTGDB',
    tagline: 'Magic: The Gathering Card Database',
    description:
      'Cross-platform MTG companion app with 80,000+ cards available offline. Collection tracking, deck building, life tracker, dice roller, cloud sync, and TCGPlayer price tracking. 10K+ downloads.',
    status: 'LIVE',
    statusClass: 'text-green-400',
    dotClass: 'dot-live',
    accent: '#22c55e',
    tags: ['Flutter', 'Firebase', 'SQLite', 'iOS', 'Android'],
    size: 'small',
    github: null,
    link: 'https://apps.apple.com/us/app/mtgdb-mtg-card-database/id1515425814',
    linkAndroid: 'https://play.google.com/store/apps/details?id=com.space.mtgdb',
    metric: { value: '10K+', label: 'downloads' },
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
                    <a href={p.github} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors" title="GitHub">
                      <Github className="w-3.5 h-3.5 text-zinc-400" />
                    </a>
                  )}
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors" title="App Store">
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    </a>
                  )}
                  {(p as any).linkAndroid && (
                    <a href={(p as any).linkAndroid} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors" title="Google Play">
                      <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
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
