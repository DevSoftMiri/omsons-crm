import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/features/auth/auth-provider";

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
      <body suppressHydrationWarning><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
