'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', 'all');
    setIsVisible(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('cookie-consent', 'essential');
    setIsVisible(false);
  };

  const dismiss = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-0 left-0 right-0 z-[90] p-4 md:p-6"
          role="dialog"
          aria-label="Cookie consent"
          aria-describedby="cookie-description"
        >
          <div className="max-w-4xl mx-auto glass rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">We value your privacy</h3>
                <p id="cookie-description" className="text-gray-300 text-sm mb-4">
                  We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                  By clicking &quot;Accept All&quot;, you consent to our use of cookies. You can also choose to accept
                  only essential cookies necessary for the site to function.
                </p>
                <div className="flex flex-wrap gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={acceptAll}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    Accept All
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={acceptEssential}
                    className="px-6 py-2 glass rounded-lg text-white text-sm font-medium hover:bg-white/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    Essential Only
                  </motion.button>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="text-gray-400 hover:text-white transition-colors p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                aria-label="Dismiss cookie notice"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
