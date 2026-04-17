import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "bangalore.market · Community listings from r/BangaloreMarketplace",
    template: "%s · bangalore.market",
  },
  description:
    "A clean, modern marketplace for Bangalore listings sourced from public Reddit posts. Flats, furniture, gadgets, and gigs from real redditors.",
  metadataBase: new URL("https://reddit-marketplace.vercel.app"),
  openGraph: {
    type: "website",
    siteName: "bangalore.market",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen font-sans`}>
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 animate-fade-in">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
