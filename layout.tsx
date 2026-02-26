import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CA Data Centers — Embodied Carbon Compliance',
  description: 'California data center locations, CCA jurisdictions, and AB 2446 embodied carbon EPD data',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
