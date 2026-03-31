import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "FeedPulse - AI-Powered Feedback Platform",
  description: "Submit and manage product feedback with AI insights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a href="/" className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                  <span className="h-3 w-3 rounded-full bg-white animate-pulse" />
                </span>
                <span className="font-bold text-gray-900 text-lg">FeedPulse</span>
              </a>
              <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Admin Dashboard
              </a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
