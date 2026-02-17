import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kostenlose Website-Analyse für Kosmetikstudios | arsenio.at",
  description:
    "Erfahren Sie in 3 Minuten, was Ihre Website davon abhält, mehr Kundinnen zu gewinnen. Unsere KI analysiert über 50 Faktoren und gibt konkrete Verbesserungsvorschläge.",
  keywords: [
    "Website Analyse",
    "Kosmetikstudio",
    "SEO",
    "Performance",
    "Beauty",
    "Wellness",
  ],
  authors: [{ name: "arsenio.at" }],
  creator: "arsenio.at",
  openGraph: {
    type: "website",
    locale: "de_AT",
    url: "https://analyse.arsenio.at",
    siteName: "arsenio.at Website-Analyse",
    title: "Kostenlose Website-Analyse für Kosmetikstudios",
    description:
      "Erfahren Sie in 3 Minuten, was Ihre Website davon abhält, mehr Kundinnen zu gewinnen.",
    images: [
      {
        url: "https://arsenio.at/wp-content/uploads/2025/03/og-image.png",
        width: 1200,
        height: 630,
        alt: "arsenio.at Website-Analyse",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kostenlose Website-Analyse für Kosmetikstudios",
    description:
      "Erfahren Sie in 3 Minuten, was Ihre Website davon abhält, mehr Kundinnen zu gewinnen.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
