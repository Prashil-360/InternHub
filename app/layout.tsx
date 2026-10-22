import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: { default: "InternHub", template: "%s · InternHub" },
  description: "The professional intern management & evaluation platform. Track tasks, measure performance, and grow talent — all in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500&family=Geist+Mono:wght@400;500&display=swap" />
        <link id="google-fonts" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" media="print" />
        <script dangerouslySetInnerHTML={{ __html: `
          var fontStylesheet = document.getElementById("google-fonts");
          if (fontStylesheet) {
            fontStylesheet.addEventListener("load", function () {
              fontStylesheet.media = "all";
            });
          }
        ` }} />
        <noscript><link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" /></noscript>
      </head>
      <body suppressHydrationWarning>
        <a href="#main" className="skip-nav">Skip to main content</a>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                fontFamily: "'Geist', system-ui, sans-serif",
                fontSize: "14px",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-lg)",
              },
            }}
            richColors
          />
        </Providers>
      </body>
    </html>
  );
}
