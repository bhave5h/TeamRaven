import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Odin Force: Autonomous Multi-Agent Contract Intelligence",
  description:
    "Odin Force — Autonomous Multi-Agent Contract Intelligence & Adversarial Arbitration System. Four specialized AI agents defend enterprise portfolios against hidden traps, liabilities, and revenue leakage.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Odin Force: Autonomous Multi-Agent Contract Intelligence",
    description: "AI agents that defend all your enterprise contracts in real time.",
    siteName: "Odin Force",
    images: [
      {
        url: "/bg1.png",
        width: 1200,
        height: 630,
        alt: "Odin Force Classical Tapestry Landscape",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Odin Force: Autonomous Multi-Agent Contract Intelligence",
    description: "AI agents that defend all your enterprise contracts in real time.",
    images: ["/bg1.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
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
      <body className="min-h-full flex flex-col font-sans overflow-x-clip bg-[#f8faf9] text-[#14211a] selection:bg-[#14211a] selection:text-white">
        {children}
      </body>
    </html>
  );
}
