import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gen Thought Processor",
  description: "A focused workflow for capturing and refining thoughts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(() => {
            const key = "gen-thought-processor-theme";
            try {
              const saved = window.localStorage.getItem(key);
              const preference = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
              document.documentElement.dataset.themePreference = preference;
              const dark = preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
              document.documentElement.classList.toggle("dark", dark);
            } catch {
              const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              document.documentElement.dataset.themePreference = "system";
              document.documentElement.classList.toggle("dark", dark);
            }
          })();`}
        </Script>
      </body>
    </html>
  );
}
