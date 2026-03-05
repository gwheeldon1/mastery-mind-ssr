import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import { Providers } from "@/components/providers";
import { GoogleAnalytics } from "@/components/google-analytics";
import "@/lib/env"; // fail fast if required env vars are missing
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MasteryMind – AI-Powered Revision for GCSE & A-Level",
    template: "%s | MasteryMind",
  },
  description:
    "Master KS3, GCSE, iGCSE & A-Level subjects with adaptive AI quizzes and spaced repetition. Aligned to AQA, Edexcel, OCR & Cambridge. Free to start.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  other: {
    "theme-color": "#4f46e5",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "MasteryMind",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${nunito.variable} antialiased`}>
        <GoogleAnalytics />
        <Providers><main id="main-content">{children}</main></Providers>
      </body>
    </html>
  );
}
