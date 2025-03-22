'use client';

import React from 'react';

interface GlobalErrorProps {
  error: Error;
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-[#1a1b1e] text-white p-4">
          <div className="max-w-md w-full bg-[#2f3136] p-8 rounded-lg shadow-lg border border-[#444] text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-500">Something went wrong</h2>
            <p className="mb-6 text-gray-300">
              We encountered a critical error. Please try again later.
            </p>
            <button
              onClick={reset}
              className="gaming-button"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
} 