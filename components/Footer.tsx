'use client';

import { motion } from 'framer-motion';
import { Twitter, Github, Youtube, MessageCircle, Send } from 'lucide-react';

const socialLinks = [
  {
    icon: Send,
    href: 'https://t.me/briarebrothers',
    label: 'Join our Telegram'
  },
  {
    icon: MessageCircle,
    href: 'https://wa.me/message/briarebrothers',
    label: 'Message on WhatsApp'
  },
  {
    icon: Twitter,
    href: 'https://twitter.com/briarebrothers',
    label: 'Follow us on Twitter'
  },
  {
    icon: Github,
    href: 'https://github.com/briarebrothers',
    label: 'View our GitHub'
  },
  {
    icon: Youtube,
    href: 'https://youtube.com/@briarebrothers',
    label: 'Subscribe on YouTube'
  },
];

const serviceLinks = [
  { name: 'Trading Bots', href: '#trading' },
  { name: 'Signal Channels', href: '#trading' },
  { name: 'Live Wallpapers', href: '#products' },
  { name: 'Developer SDK', href: '#products' },
];

const companyLinks = [
  { name: 'About Us', href: '#about' },
  { name: 'Contact', href: '#contact' },
];

const legalLinks = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Risk Disclaimer', href: '/disclaimer' },
];

export default function Footer() {
  const handleNavClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.getElementById(href.slice(1));
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="glass border-t border-white/10" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
              Briare Brothers
            </h2>
            <p className="text-gray-300 mb-6 max-w-md">
              Automated trading bots, premium live wallpapers, and real-time crypto signals.
              Building the future of trading and mobile apps.
            </p>
            <div className="flex gap-3" role="list" aria-label="Social media links">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white border border-white/5 hover:border-cyan-500/30"
                  aria-label={social.label}
                  role="listitem"
                >
                  <social.icon className="w-5 h-5" aria-hidden="true" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Services */}
          <nav aria-label="Services navigation">
            <h3 className="font-semibold mb-4 text-white">Services</h3>
            <ul className="space-y-2" role="list">
              {serviceLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      if (link.href.startsWith('#')) {
                        e.preventDefault();
                        handleNavClick(link.href);
                      }
                    }}
                    className="text-gray-300 hover:text-cyan-400 transition-colors focus:outline-none focus-visible:underline"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company navigation">
            <h3 className="font-semibold mb-4 text-white">Company</h3>
            <ul className="space-y-2" role="list">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      if (link.href.startsWith('#')) {
                        e.preventDefault();
                        handleNavClick(link.href);
                      }
                    }}
                    className="text-gray-300 hover:text-cyan-400 transition-colors focus:outline-none focus-visible:underline"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal navigation">
            <h3 className="font-semibold mb-4 text-white">Legal</h3>
            <ul className="space-y-2" role="list">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-cyan-400 transition-colors focus:outline-none focus-visible:underline"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Risk Disclaimer */}
        <div className="py-6 border-t border-white/10 mb-6">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-400">Risk Disclaimer:</strong> Trading cryptocurrencies and memecoins involves substantial risk of loss.
            Past performance is not indicative of future results. Our trading signals and bots are tools to assist your trading decisions,
            not financial advice. Only trade with capital you can afford to lose. Always do your own research (DYOR).
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Briare Brothers. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              Built with Next.js, Three.js &amp; Framer Motion
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
