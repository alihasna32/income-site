import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/shared/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "CoinQuest — Play Games, Complete Challenges, Earn Rewards",
    template: "%s | CoinQuest",
  },
  description:
    "CoinQuest is a fun, free rewards platform. Play mini-games, solve math challenges, scratch cards, complete daily missions and build streaks to earn virtual coins and XP.",
  keywords: [
    "play games",
    "earn rewards",
    "daily challenges",
    "scratch cards",
    "mini games",
    "online rewards",
    "streaks",
    "free coins",
  ],
  openGraph: {
    type: "website",
    siteName: "CoinQuest",
    title: "CoinQuest — Play. Challenge Yourself. Earn Rewards.",
    description:
      "Have fun, complete challenges, play games, earn rewards, and come back every day.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CoinQuest — Play. Challenge Yourself. Earn Rewards.",
    description:
      "Have fun, complete challenges, play games, earn rewards, and come back every day.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#46334F",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="coinquest" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}