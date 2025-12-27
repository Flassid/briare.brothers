import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Briare Brothers | Crypto Investments & Software Solutions",
  description: "Leading crypto investment firm and software solutions provider. Empowering the future of finance and technology.",
  keywords: "crypto, investments, software, blockchain, fintech, Briare Brothers",
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
