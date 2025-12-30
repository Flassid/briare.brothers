import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import SkipToContent from "@/components/ui/SkipToContent";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0f",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://briarebrothers.com"),
  title: {
    default: "Briare Brothers | Automated Trading Bots & Live Wallpapers",
    template: "%s | Briare Brothers",
  },
  description:
    "Automated memecoin trading bots with proven algorithms. Premium Android live wallpapers. Real-time crypto & stock signals via Telegram/WhatsApp with 75%+ accuracy. Developer SDK available.",
  keywords: [
    "memecoin trading bot",
    "automated trading",
    "crypto signals",
    "telegram signals",
    "whatsapp crypto calls",
    "android live wallpaper",
    "live wallpaper SDK",
    "stock market signals",
    "trading algorithms",
    "Briare Brothers",
    "mobile games",
  ],
  authors: [{ name: "Briare Brothers" }],
  creator: "Briare Brothers",
  publisher: "Briare Brothers",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://briarebrothers.com",
    siteName: "Briare Brothers",
    title: "Briare Brothers | Automated Trading & Live Wallpapers",
    description:
      "Automated memecoin trading bots. Premium Android live wallpapers. Real-time crypto signals with 75%+ accuracy. Developer SDK & mobile games.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Briare Brothers - Automated Trading & Live Wallpapers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Briare Brothers | Automated Trading & Live Wallpapers",
    description:
      "Automated memecoin trading bots. Premium Android live wallpapers. Real-time crypto signals with 75%+ accuracy.",
    images: ["/og-image.jpg"],
    creator: "@briarebrothers",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://briarebrothers.com",
  },
};

// JSON-LD structured data for better SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Briare Brothers",
  url: "https://briarebrothers.com",
  logo: "https://briarebrothers.com/logo.png",
  description:
    "Automated memecoin trading bots, premium Android live wallpapers, and real-time crypto/stock signals.",
  foundingDate: "2023",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "contact@briarebrothers.com",
    availableLanguage: "English",
  },
  sameAs: [
    "https://twitter.com/briarebrothers",
    "https://t.me/briarebrothers",
    "https://github.com/briarebrothers",
    "https://youtube.com/@briarebrothers",
  ],
  offers: [
    {
      "@type": "Offer",
      name: "Trading Bot Access",
      description: "Automated memecoin trading bots with proven algorithms",
      price: "199",
      priceCurrency: "USD",
    },
    {
      "@type": "Offer",
      name: "Signal Subscription",
      description: "Real-time crypto and stock signals via Telegram/WhatsApp",
      price: "29",
      priceCurrency: "USD",
    },
    {
      "@type": "Offer",
      name: "Live Wallpaper Developer SDK",
      description: "Build your own Android live wallpapers with our comprehensive SDK",
      price: "50",
      priceCurrency: "USD",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <ToastProvider>
          <SkipToContent />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
