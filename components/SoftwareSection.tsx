'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Code2, Cpu, Globe, Smartphone, Gamepad2, BrainCircuit } from 'lucide-react';

const services = [
  {
    icon: BrainCircuit,
    title: 'AI Integration',
    description: 'We build AI-native products — not features slapped on top of existing software.',
    features: ['LLM Pipelines', 'Vector Search', 'Agent Workflows'],
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Gamepad2,
    title: 'Game Development',
    description: 'Browser-based and desktop games with real physics, multiplayer, and great feel.',
    features: ['Three.js / WebGL', 'Colyseus Multiplayer', 'Unity'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Globe,
    title: 'Web Platforms',
    description: 'Modern, fast web apps with pixel-perfect UI and production-grade architecture.',
    features: ['Next.js', 'React', 'TypeScript'],
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Smartphone,
    title: 'Desktop Apps',
    description: 'Cross-platform native desktop apps that are fast, offline-first, and ship fast.',
    features: ['Tauri', 'Rust', 'React'],
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: Cpu,
    title: 'Backend Systems',
    description: 'Scalable APIs, real-time systems, and data pipelines built to handle production load.',
    features: ['Node.js', 'Supabase', 'PostgreSQL'],
    color: 'from-green-500 to-teal-500',
  },
  {
    icon: Code2,
    title: 'Custom Software',
    description: 'Got a unique problem? We scope it, build it, and ship it. No bloat, no hand-holding.',
    features: ['Rapid Prototyping', 'Full Stack', 'API Integration'],
    color: 'from-violet-500 to-purple-500',
  },
];

export default function SoftwareSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="software" className="min-h-screen py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-gray-400 mb-6">
            What We Do
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Services</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            We build across the stack — AI, web, games, and desktop. If it needs to be built well, we can build it.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="glass p-8 rounded-2xl relative overflow-hidden group border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
            >
              {/* Animated background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-500 rounded-2xl`}
              />

              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 relative z-10`}
              >
                <service.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-3 text-white relative z-10">
                {service.title}
              </h3>
              <p className="text-gray-400 mb-6 relative z-10 text-sm leading-relaxed">
                {service.description}
              </p>

              {/* Features */}
              <div className="space-y-2 relative z-10">
                {service.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.color}`} />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20"
        >
          <h3 className="text-3xl font-bold text-center mb-10 gradient-text">
            Our Stack
          </h3>
          <div className="glass p-10 rounded-3xl border border-white/[0.06]">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Rust', 'Tauri', 'Three.js', 'Supabase', 'PostgreSQL', 'AWS', 'Docker'].map((tech, index) => (
                <motion.div
                  key={tech}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ scale: 1.15 }}
                  className="flex items-center justify-center p-4 rounded-xl glass hover:bg-white/10 transition-all duration-300 cursor-default border border-white/[0.04] hover:border-white/10"
                >
                  <span className="font-medium text-gray-300 text-sm">{tech}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
