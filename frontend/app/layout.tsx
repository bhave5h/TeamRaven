import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Odin: The Contract War Room | Autonomous Multi-Agent Intelligence",
  description:
    "Autonomous Multi-Agent Contract Intelligence and Adversarial Arbitration System for Quillhub Inc. Hackathon Submission for RAGNAROK 2026 — Problem Statement 2.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-white text-[#191919] antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://db.onlinewebfonts.com/c/9d4d074c9335825a23cce178ee03b498?family=P22+Mackinac+W01+Book"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-[#191919] font-sans overflow-x-hidden selection:bg-[#191919] selection:text-white">
        {children}
      </body>
    </html>
  );
}
