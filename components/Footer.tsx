'use client';

import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-black text-[9px]">BB</span>
          </div>
          <span className="text-sm font-semibold text-white">Briare Brothers</span>
          <span className="text-zinc-700 text-sm">· Wyoming LLC · 2025</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm text-zinc-600">
          {[
            { name: 'Products', href: '#products' },
            { name: 'Services', href: '#software' },
            { name: 'About', href: '#about' },
            { name: 'Contact', href: '#contact' },
          ].map((link) => (
            <a key={link.name} href={link.href} className="hover:text-white transition-colors">
              {link.name}
            </a>
          ))}
        </div>

        {/* GitHub */}
        <a
          href="https://github.com/Flassid"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-zinc-600 hover:text-white transition-colors text-sm"
        >
          <Github className="w-4 h-4" />
          github.com/Flassid
        </a>
      </div>
    </footer>
  );
}
