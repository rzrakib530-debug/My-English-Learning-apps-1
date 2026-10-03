import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "বলোEnglish · ইংরেজি স্পিকিং প্র্যাকটিস + লাইভ ভয়েস কল",
  description:
    "বাংলাদেশীদের জন্য ইংরেজি কথা বলার অ্যাপ — AI কোচ ফিডব্যাক, শ্যাডোয়িং, ফ্ল্যাশকার্ড, রোল-প্লে আর অন্য শিক্ষার্থীর সাথে লাইভ ভয়েস কলে ইংরেজি প্র্যাকটিস।",
};

export const viewport: Viewport = {
  themeColor: "#06110e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
