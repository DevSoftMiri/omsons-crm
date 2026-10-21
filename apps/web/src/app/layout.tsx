import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omsons CRM",
  description: "Omsons Glassware customer relationship management",
  icons: {
    icon: "/Omsons Logo.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Browser extensions may add attributes to body before React hydrates. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
