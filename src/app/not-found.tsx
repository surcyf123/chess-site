import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1b1e] text-white p-4">
      <div className="max-w-md w-full bg-[#2f3136] p-8 rounded-lg shadow-lg border border-[#444] text-center">
        <h2 className="text-2xl font-bold mb-4 text-yellow-500">404 - Page Not Found</h2>
        <p className="mb-6 text-gray-300">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className="gaming-button inline-block">
          Go Home
        </Link>
      </div>
    </div>
  );
} 