import type { Metadata } from "next";
import { Space_Grotesk, Syne } from "next/font/google";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import "./globals.css";

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Syne({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCDM Commerce Optimizer",
  description:
    "India-first, globally scalable e-commerce optimizer using TOPSIS, experimentation, and AI-assisted decision intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NotificationProvider />
        {children}
      </body>
    </html>
  );
}
