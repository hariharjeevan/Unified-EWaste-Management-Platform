import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://unified-e-waste-management-platform.vercel.app'),
  title: "Unified E-Waste Management Platform (UEMP)",
  description: "Unified E-Waste Management Platform (UEMP) is a comprehensive digital platform that optimizes the entire lifecycle of electronic products— " +
    "from manufacturing to consumer use and responsible recycling. By assigning unique QR codes to each product, " +
    "UEMP enables seamless tracking, secure registration by consumers, and effortless verification by recyclers, " +
    "ensuring the efficient and eco-friendly disposal of e-waste.",

  // Open Graph Metadata
  openGraph: {
    title: "Unified E-Waste Management Platform (UEMP)",
    description:
      "Unified E-Waste Management Platform (UEMP) is a comprehensive digital platform that optimizes the entire lifecycle of electronic products—" +
      "from manufacturing to consumer use and responsible recycling. By assigning unique QR codes to each product, " +
      "UEMP enables seamless tracking, secure registration by consumers, and effortless verification by recyclers, " +
      "ensuring the efficient and eco-friendly disposal of e-waste.",
    url: "https://unified-e-waste-management-platform.vercel.app",
    images: [
      {
        url: 'https://unified-e-waste-management-platform.vercel.app/screenshot.png',
        width: '1920',
        height: '1080',
        alt: 'Preview Image',
      }
    ],
    type: "website",
  },

  // Twitter Card Metadata
  twitter: {
    card: "summary_large_image",
    title: "Unified E-Waste Management Platform (UEMP)",
    description:
      "Unified E-Waste Management Platform (UEMP) is a comprehensive digital platform that optimizes the entire lifecycle of electronic products—" +
      "from manufacturing to consumer use and responsible recycling. By assigning unique QR codes to each product, " +
      "UEMP enables seamless tracking, secure registration by consumers, and effortless verification by recyclers, " +
      "ensuring the efficient and eco-friendly disposal of e-waste.",
    images: [
      {
        url: 'https://unified-e-waste-management-platform.vercel.app/screenshot.png',
        width: '1920',
        height: '1080',
        alt: 'Preview Image',
      }
    ],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
