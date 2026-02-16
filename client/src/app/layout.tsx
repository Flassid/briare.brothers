import type { Metadata } from "next";
import "./globals.css";
import { SocketProvider } from "@/components/providers/SocketProvider";

export const metadata: Metadata = {
  title: "Dungeon.AI - AI-Powered D&D",
  description: "An AI Dungeon Master guides your adventure through procedurally generated quests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  );
}
