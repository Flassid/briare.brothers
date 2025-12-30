import dynamic from 'next/dynamic';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import CryptoSection from '@/components/CryptoSection';
import SoftwareSection from '@/components/SoftwareSection';
import AboutSection from '@/components/AboutSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import BackToTop from '@/components/ui/BackToTop';
import CookieConsent from '@/components/ui/CookieConsent';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// Dynamically import Scene3D with no SSR to avoid Three.js issues
const Scene3D = dynamic(() => import('@/components/Scene3D'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
  ),
});

export default function Home() {
  return (
    <>
      {/* 3D Background Scene with Error Boundary */}
      <ErrorBoundary
        fallback={
          <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
        }
      >
        <Scene3D />
      </ErrorBoundary>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main id="main-content" className="relative min-h-screen">
        {/* Hero Section */}
        <Hero />

        {/* Crypto Investments Section */}
        <CryptoSection />

        {/* Software Solutions Section */}
        <SoftwareSection />

        {/* About Section */}
        <AboutSection />

        {/* Contact Section */}
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* UI Enhancements */}
      <BackToTop />
      <CookieConsent />
    </>
  );
}
