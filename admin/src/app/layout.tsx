import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { brand } from "@brand";
import { BrandTheme } from "@/components/brand-theme";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

// The guest app's font, so both apps read as one brand.
const sans = Plus_Jakarta_Sans({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${brand.name} Admin`, template: `%s · ${brand.name} Admin` },
  description: `Manage ${brand.name} listings, users, bookings and reports.`,
  robots: { index: false, follow: false },
};

const clerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const page = (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <head>
        <BrandTheme />
      </head>
      <body className="min-h-full bg-muted/40 font-sans">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
  return clerk ? <ClerkProvider>{page}</ClerkProvider> : page;
}
