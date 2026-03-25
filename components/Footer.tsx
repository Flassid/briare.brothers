'use client';

import { motion } from 'framer-motion';
import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="glass border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold gradient-text mb-4">Briare Brothers</h3>
            <p className="text-gray-400 mb-6 max-w-md text-sm leading-relaxed">
              Indie dev studio building AI-powered software and games.
              Two brothers, one mission: ship great products.
            </p>
            <motion.a
              href="https://github.com/Flassid"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -3 }}
              whileTap={{ scale: 0.9 }}
              className="inline-flex w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 items-center justify-center transition-colors border border-white/[0.06]"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </motion.a>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Products</h4>
            <ul className="space-y-2">
              {[
                { name: 'ErewhonPOS', href: '#products' },
                { name: 'Nexus Files', href: '#products' },
                { name: 'StussyGauntlet', href: '#products' },
                { name: 'EchoPalace', href: '#products' },
              ].map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-2">
              {[
                { name: 'About', href: '#about' },
                { name: 'Services', href: '#software' },
                { name: 'Contact', href: '#contact' },
                { name: 'Privacy Policy', href: '/privacy-policy' },
              ].map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.06]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Briare Brothers LLC. Wyoming. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              Built with Next.js · Three.js · Framer Motion
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
