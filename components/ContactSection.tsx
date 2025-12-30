'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState, FormEvent } from 'react';
import { Mail, MapPin, Phone, Send, Loader2 } from 'lucide-react';
import { useToast } from './ui/Toast';

interface FormData {
  name: string;
  email: string;
  service: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  service?: string;
  message?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const { showToast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    service: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.service) {
      newErrors.service = 'Please select a service';
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(data.message || 'Message sent successfully!', 'success');
        setFormData({ name: '', email: '', service: '', message: '' });
        setErrors({});
      } else {
        showToast(data.error || 'Failed to send message', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const inputBaseClass = "w-full px-4 py-3 rounded-xl bg-white/5 border focus:outline-none focus:ring-2 transition-all text-white placeholder-gray-500";
  const inputNormalClass = `${inputBaseClass} border-white/10 focus:border-blue-500 focus:ring-blue-500/20`;
  const inputErrorClass = `${inputBaseClass} border-red-500/50 focus:border-red-500 focus:ring-red-500/20`;

  return (
    <section id="contact" className="min-h-screen py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Get In Touch</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Ready to start your journey with us? Reach out and let&apos;s discuss how we can
            help you achieve your goals.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-6 text-white">Contact Information</h3>
                <p className="text-gray-300 mb-8">
                  We&apos;re here to answer your questions and discuss opportunities.
                  Get in touch with our team today.
                </p>
              </div>

              <motion.div
                whileHover={{ x: 10 }}
                className="flex items-start gap-4 glass p-6 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-white">Email</h4>
                  <a
                    href="mailto:contact@briarebrothers.com"
                    className="text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:underline"
                  >
                    contact@briarebrothers.com
                  </a>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ x: 10 }}
                className="flex items-start gap-4 glass p-6 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-white">Phone</h4>
                  <a
                    href="tel:+18005551234"
                    className="text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:underline"
                  >
                    +1 (800) 555-1234
                  </a>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ x: 10 }}
                className="flex items-start gap-4 glass p-6 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-white">Office</h4>
                  <p className="text-gray-300">
                    One Market Plaza, Suite 3600<br />
                    San Francisco, CA 94105<br />
                    United States
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="glass p-8 rounded-3xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2 text-white">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={errors.name ? inputErrorClass : inputNormalClass}
                  placeholder="John Doe"
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  aria-invalid={errors.name ? 'true' : 'false'}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-400" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-white">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={errors.email ? inputErrorClass : inputNormalClass}
                  placeholder="john@example.com"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-400" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="service" className="block text-sm font-medium mb-2 text-white">
                  Service Interest <span className="text-red-400">*</span>
                </label>
                <select
                  id="service"
                  value={formData.service}
                  onChange={(e) => handleChange('service', e.target.value)}
                  className={errors.service ? inputErrorClass : inputNormalClass}
                  aria-describedby={errors.service ? 'service-error' : undefined}
                  aria-invalid={errors.service ? 'true' : 'false'}
                  disabled={isSubmitting}
                >
                  <option value="">Select a service...</option>
                  <option value="crypto">Crypto Investments</option>
                  <option value="software">Software Development</option>
                  <option value="both">Both Services</option>
                  <option value="other">Other Inquiry</option>
                </select>
                {errors.service && (
                  <p id="service-error" className="mt-1 text-sm text-red-400" role="alert">
                    {errors.service}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2 text-white">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  className={`${errors.message ? inputErrorClass : inputNormalClass} resize-none`}
                  placeholder="Tell us about your project or investment goals..."
                  aria-describedby={errors.message ? 'message-error' : undefined}
                  aria-invalid={errors.message ? 'true' : 'false'}
                  disabled={isSubmitting}
                  maxLength={5000}
                />
                {errors.message && (
                  <p id="message-error" className="mt-1 text-sm text-red-400" role="alert">
                    {errors.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.message.length}/5000 characters
                </p>
              </div>

              <motion.button
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="w-5 h-5" aria-hidden="true" />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
