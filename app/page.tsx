import dynamic from 'next/dynamic';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import CryptoSection from '@/components/CryptoSection';
import SoftwareSection from '@/components/SoftwareSection';
import AboutSection from '@/components/AboutSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';

// Dynamically import Scene3D with no SSR to avoid Three.js issues
const Scene3D = dynamic(() => import('@/components/Scene3D'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="relative min-h-screen animated-gradient">
      {/* 3D Background Scene */}
      <Scene3D />

      {/* Navigation */}
      <Navigation />

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

      {/* Footer */}
      <Footer />
    </main>
  );
}
