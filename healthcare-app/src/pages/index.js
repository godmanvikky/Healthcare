import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Healthcare Application</h1>
      <div className="space-x-4">
        <Link href="/auth/login">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">Login</button>
        </Link>
        <Link href="/auth/register">
          <button className="bg-green-500 text-white px-4 py-2 rounded">Register</button>
        </Link>
      </div>
    </div>
  );
}
