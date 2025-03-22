'use client';

import React, { useEffect } from 'react';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1b1e] text-white p-4">
      <div className="max-w-md w-full bg-[#2f3136] p-8 rounded-lg shadow-lg border border-[#444] text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-500">Something went wrong</h2>
        <p className="mb-6 text-gray-300">
          We encountered an error while rendering this page. Please try again later.
        </p>
        <button
          onClick={reset}
          className="gaming-button"
        >
          Try Again
        </button>
      </div>
    </div>
  );
} 