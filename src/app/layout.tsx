import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { RealtimeProvider } from "@/context/RealtimeProvider";
import { CentrifugoProvider } from "@/context/CentrifugoProvider";
import { CSPostHogProvider } from '@/context/PostHogProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "WHOBEE - Connect With Anyone",
  description: "WHOBEE's unique phased-blur technology lets you connect with your personality first. Instant matching, anonymous video and text chat.",
  icons: {
    icon: "/whobee.png",
    apple: "/whobee.png",
  },
  openGraph: {
    title: "WHOBEE - Meet Strangers, Make Real Connections",
    description: "Start blurred, then slowly reveal. Join thousands online right now for instant matching and 100% anonymous video chat.",
    url: "https://whobee.vercel.app",
    siteName: "WHOBEE",
    images: [
      {
        url: "/whobee-og.png",
        width: 1200,
        height: 630,
        alt: "WHOBEE Video Chat Preview",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WHOBEE - Connect With Anyone",
    description: "Instant matching and 100% anonymous video chat with phased-blur technology.",
    images: ["/whobee-og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased relative`}
      >
        <div className="fixed inset-0 bg-yellow-50 -z-10"></div>
        <div
          className="fixed inset-0 -z-10"
          style={{
            backgroundImage: `
              radial-gradient(circle at 100px 100px, rgba(249, 115, 22, 0.1) 2%, transparent 2%),
              radial-gradient(circle at 200px 200px, rgba(249, 115, 22, 0.1) 2%, transparent 2%),
              radial-gradient(circle at 300px 100px, rgba(249, 115, 22, 0.1) 2%, transparent 2%),
              radial-gradient(circle at 400px 200px, rgba(249, 115, 22, 0.1) 2%, transparent 2%),
              radial-gradient(circle at 500px 100px, rgba(249, 115, 22, 0.1) 2%, transparent 2%)
            `,
            backgroundSize: '100px 100px',
            backgroundPosition: '0 0, 50px 50px, 50px 0, 0 50px, 25px 25px',
            backgroundRepeat: 'repeat',
            opacity: 0.6
          }}
        ></div>
        <CSPostHogProvider>
          <CentrifugoProvider>
            <RealtimeProvider>
              {children}
            </RealtimeProvider>
          </CentrifugoProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
