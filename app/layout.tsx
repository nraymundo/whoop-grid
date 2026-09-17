import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Signal",
  description: "GitHub-style heatmaps for WHOOP recovery, sleep, and strain.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#fbfaf8] text-[#2c2722] antialiased">
        {children}
      </body>
    </html>
  );
}
