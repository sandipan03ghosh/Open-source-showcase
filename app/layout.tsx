import type { Metadata } from "next";
import React from "react";
import { Work_Sans } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
});

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
  title: {
    default: "Open Source Showcase",
    template: "%s · Open Source Showcase",
  },
  description:
    "Discover, showcase, analyze, and collaborate on open-source projects. Connect your GitHub account and let repository metadata sync automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={workSans.variable}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
