import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Briare Brothers | AI-Powered Software & Games",
  description: "Indie dev studio building AI-powered software and games. ErewhonPOS, Nexus Files, StussyGauntlet, EchoPalace.",
  keywords: "AI, software, games, indie dev, Briare Brothers, ErewhonPOS, Three.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
