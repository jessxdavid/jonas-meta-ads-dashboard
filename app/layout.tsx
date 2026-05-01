import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DateRangeProvider } from "@/components/DateRangeContext";

export const metadata: Metadata = {
  title: "Info Ops · Jonas Meta Ads Dashboard",
  description: "Real-time performance dashboard for Meta Marketing campaigns",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <DateRangeProvider>
          <Sidebar />
          <div className="ml-[220px] min-h-screen">
            <Header />
            <main className="px-6 py-6">{children}</main>
          </div>
        </DateRangeProvider>
      </body>
    </html>
  );
}
