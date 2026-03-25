'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ExternalLink, Github, Utensils, FolderOpen, Sword, Brain } from 'lucide-react';

const products = [
  {
    icon: Utensils,
    title: 'ErewhonPOS',
    tagline: 'AI Kitchen Display System',
    description:
      'Live at Erewhon Beverly Hills. Replaced legacy KDS hardware with an AI-powered system that processes orders in real-time. 16,789+ orders without a single failure. Enterprise SaaS deal in progress for all 14 stores.',
    status: 'LIVE',
    statusColor: 'bg-green-500/20 text-green-400 border-green-500/30',
    dotColor: 'bg-green-400',
    color: 'from-green-500 to-teal-500',
    tags: ['Enterprise SaaS', 'React', 'Supabase', 'Real-time'],
    link: null,
    github: null,
  },
  {
    icon: FolderOpen,
    title: 'Nexus Files',
    tagline: 'AI-Powered File Explorer',
    description:
      'Local-first file manager with AI-powered search, smart tagging, and instant organization. Built with Tauri for native performance. All 5 development phases complete — ready to ship.',
    status: 'BETA',
    statusColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    dotColor: 'bg-blue-400',
    color: 'from-blue-500 to-indigo-500',
    tags: ['Tauri', 'Rust', 'React', 'Local-First'],
    link: null,
    github: 'https://github.com/Flassid/Nexus',
  },
  {
    icon: Sword,
    title: 'StussyGauntlet',
    tagline: 'Browser Multiplayer Hack-n-Slash',
    description:
      'Gauntlet Legends-style co-op in the browser — no download, just share a link and go. WoW-style combat, 4-player online, 3D dungeon crawling. "Warrior needs food, badly... and a link to share!"',
    status: 'IN DEV',
    statusColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    dotColor: 'bg-purple-400',
    color: 'from-purple-500 to-pink-500',
    tags: ['Three.js', 'Colyseus', 'React', 'WebGL'],
    link: null,
    github: null,
  },
  {
    icon: Brain,
    title: 'EchoPalace',
    tagline: 'AI Spatial Memory Palace',
    description:
      'Intent-driven knowledge management as a 3D memory palace. Autonomous AI agents help you capture, organize, and recall everything. Desktop app built for deep knowledge workers.',
    status: 'EARLY ACCESS',
    statusColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    dotColor: 'bg-orange-400',
    color: 'from-orange-500 to-amber-500',
    tags: ['Tauri', 'Three.js', 'LanceDB', 'Ollama'],
    link: null,
    github: null,
  },
];

export default function ProductsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section id="products" className="min-h-screen py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-gray-400 mb-6">
            What We've Built
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Our Products</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            From enterprise restaurant tech to multiplayer browser games — we build things that work and ship them.
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.12 }}
              whileHover={{ y: -6 }}
              className="glass p-8 rounded-2xl relative overflow-hidden group border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
            >
              {/* Gradient glow on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 rounded-2xl`} />

              {/* Top row: icon + status */}
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center`}>
                  <product.icon className="w-7 h-7 text-white" />
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide ${product.statusColor}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${product.dotColor}`} />
                  {product.status}
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-1">{product.title}</h3>
                <p className={`text-sm font-medium mb-4 bg-gradient-to-r ${product.color} bg-clip-text text-transparent`}>
                  {product.tagline}
                </p>
                <p className="text-gray-400 leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {product.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="flex gap-3">
                  {product.link && (
                    <motion.a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${product.color} text-white text-sm font-medium`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit
                    </motion.a>
                  )}
                  {product.github && (
                    <motion.a
                      href={product.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-medium transition-colors"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </motion.a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
