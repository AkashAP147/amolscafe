import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Amol's Cafe | Good Food. Great Coffee.",
  description: "Premium cafe ordering system for Amol's Cafe. Order your favorite pizza, burgers, sandwiches and coffee online.",
  manifest: "/manifest.json",
  themeColor: "#F58A1F",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Amols Cafe",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

import PWAInitializer from "@/components/PWAInitializer";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F58A1F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <PWAInitializer />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
