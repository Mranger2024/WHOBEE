import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { RealtimeProvider } from "@/context/RealtimeProvider";
import { CentrifugoProvider } from "@/context/CentrifugoProvider";
import { CSPostHogProvider } from '@/context/PostHogProvider';
import AgeVerificationPopup from '@/components/ui/AgeVerificationPopup';
import JsonLd from '@/components/JsonLd';

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
  metadataBase: new URL('https://whobee.live'),
  title: {
    default: "WHOBEE - Anonymous Video Chat & Meet Strangers Online",
    template: "%s | WHOBEE",
  },
  description: "WHOBEE is a free, anonymous video, voice, and text chat platform. Meet strangers online instantly with no sign-up required. Featuring unique blur technology and end-to-end encryption.",
  keywords: ["anonymous video chat", "meet strangers online", "random video chat", "omegle alternative", "video chat no sign up", "anonymous chat", "whobee", "random chat", "webcam chat"],
  authors: [{ name: "WHOBEE Team" }],
  creator: "WHOBEE",
  publisher: "WHOBEE",
  alternates: {
    canonical: 'https://whobee.live',
  },
  icons: {
    icon: "/whobee.png",
    apple: "/whobee.png",
  },
  openGraph: {
    title: "WHOBEE - Meet Strangers, Make Real Connections",
    description: "Start blurred, then slowly reveal. 100% anonymous video, voice & text chat. No account needed. Connect with the world — right now.",
    url: "https://whobee.live",
    siteName: "WHOBEE",
    images: [
      {
        url: "/whobee-og.png",
        width: 1200,
        height: 630,
        alt: "WHOBEE - Anonymous Video Chat Platform",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WHOBEE - Free Anonymous Video Chat",
    description: "Meet strangers online instantly. 100% anonymous, no sign-up, E2E encrypted. WebRTC P2P with blur technology.",
    site: "@whobee",
    creator: "@whobee",
    images: ["/whobee-og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
          <JsonLd />
          <CentrifugoProvider>
            <RealtimeProvider>
              <AgeVerificationPopup />
              {children}
            </RealtimeProvider>
          </CentrifugoProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
