import type { Metadata } from "next";

import { Header } from "@/components/header";

import "./globals.css";

export const metadata: Metadata = {
  title: "TSLO • Tally Shall Live On",
  description: "Open-source governance continuity for OZ Governor DAOs."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="page">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
