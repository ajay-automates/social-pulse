import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Social Pulse — Your Social Command Center',
  description: 'Track all your social media analytics in one place. YouTube, Twitter, LinkedIn, Instagram, Substack.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="noise-bg">{children}</body>
    </html>
  );
}
