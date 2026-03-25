'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Mail, Github, Send } from 'lucide-react';

export default function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="contact" className="min-h-screen py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-gray-400 mb-6">
            Let's Talk
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Get In Touch</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Building something interesting? Have a problem that needs solving?
            We're direct — reach out and we'll respond fast.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-4">Contact</h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  We're a small team, so you'll talk to the people who actually build the products.
                  No account managers, no runaround.
                </p>
              </div>

              <motion.a
                href="mailto:briare.brothers@gmail.com"
                whileHover={{ x: 8 }}
                className="flex items-start gap-4 glass p-6 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Email</h4>
                  <span className="text-gray-400 group-hover:text-white transition-colors">
                    briare.brothers@gmail.com
                  </span>
                </div>
              </motion.a>

              <motion.a
                href="https://github.com/Flassid"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ x: 8 }}
                className="flex items-start gap-4 glass p-6 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center flex-shrink-0">
                  <Github className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">GitHub</h4>
                  <span className="text-gray-400 group-hover:text-white transition-colors">
                    github.com/Flassid
                  </span>
                </div>
              </motion.a>

              {/* What we're open to */}
              <div className="glass p-6 rounded-2xl border border-white/[0.06] mt-8">
                <h4 className="font-semibold mb-4 text-white">Open To</h4>
                <ul className="space-y-3">
                  {[
                    'Enterprise software contracts',
                    'AI integration consulting',
                    'Game development projects',
                    'Investment inquiries (ErewhonPOS)',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-400 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="glass p-8 rounded-3xl border border-white/[0.06]"
          >
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-white placeholder-gray-600"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-white placeholder-gray-600"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2 text-gray-300">
                  What's this about?
                </label>
                <select
                  id="subject"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                >
                  <option value="" className="bg-gray-900">Select a topic</option>
                  <option value="erewhonpos" className="bg-gray-900">ErewhonPOS / Enterprise KDS</option>
                  <option value="software" className="bg-gray-900">Custom Software Development</option>
                  <option value="consulting" className="bg-gray-900">AI Consulting</option>
                  <option value="games" className="bg-gray-900">Game Development</option>
                  <option value="other" className="bg-gray-900">Something Else</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-300">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none text-white placeholder-gray-600"
                  placeholder="Tell us about your project..."
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
              >
                Send Message
                <Send className="w-5 h-5" />
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
