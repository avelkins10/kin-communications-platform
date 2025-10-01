'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { SessionProvider } from '@/components/session-provider';

function SessionTestContent() {
  const { data: session, status } = useSession();
  const [testResults, setTestResults] = useState<string[]>([]);

  console.log('SessionTestContent: Component mounted');
  console.log('SessionTestContent: Session status:', status);
  console.log('SessionTestContent: Session data:', session);

  useEffect(() => {
    const results = [
      'SessionProvider initialized',
      `Session status: ${status}`,
      session ? 'User authenticated' : 'User not authenticated',
      'NextAuth integration working'
    ];
    setTestResults(results);
    console.log('SessionTestContent: Test results:', results);
  }, [session, status]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          SessionProvider Test
        </h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Results:</h2>
            <ul className="space-y-2">
              {testResults.map((result, index) => (
                <li key={index} className="flex items-center text-gray-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  {result}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-100 p-4 rounded-md">
            <h3 className="font-semibold text-gray-800 mb-2">Session Status:</h3>
            <p className="text-gray-700">
              {status === 'loading' && 'Loading...'}
              {status === 'authenticated' && `Authenticated as: ${session?.user?.email || 'Unknown'}`}
              {status === 'unauthenticated' && 'Not authenticated'}
            </p>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>If you can see session information above,</p>
            <p>SessionProvider is working correctly!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProvidersTestPage() {
  console.log('ProvidersTestPage: Component mounted');

  return (
    <SessionProvider>
      <SessionTestContent />
    </SessionProvider>
  );
}

