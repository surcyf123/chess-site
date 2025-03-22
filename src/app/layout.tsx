import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chess Game',
  description: 'Real-time multiplayer chess game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
