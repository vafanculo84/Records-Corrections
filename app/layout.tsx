import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Flight School Records Correction",
    template: "%s | Flight School Records",
  },
  description:
    "Submit, approve, and process flight record correction requests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-100">
      <body className="min-h-full text-slate-950 antialiased">{children}</body>
    </html>
  );
}
