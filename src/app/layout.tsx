import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chess Arena',
  description: 'Play chess online with friends',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
        <meta httpEquiv="Cross-Origin-Resource-Policy" content="cross-origin" />
      </head>
      <body>
        <ErrorBoundaryProvider>
          {children}
        </ErrorBoundaryProvider>
      </body>
    </html>
  )
}

function ErrorBoundaryProvider({ children }: { children: React.ReactNode }) {
  return (
    <div id="error-boundary-root">
      {children}
      <script dangerouslySetInnerHTML={{
        __html: `
          window.addEventListener('error', function(event) {
            console.error('Global error caught:', event.error);
            // You could log to a service here
          });
          
          window.addEventListener('unhandledrejection', function(event) {
            console.error('Unhandled promise rejection:', event.reason);
            // You could log to a service here
          });
        `
      }} />
    </div>
  );
}
