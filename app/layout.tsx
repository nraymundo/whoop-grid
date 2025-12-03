import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "WHOOP Daily Grid",
  description: "GitHub-style heatmaps for WHOOP recovery, sleep, and strain.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[linear-gradient(135deg,#283339,#101518)] text-white">
        {children}
      </body>
    </html>
  );
}
