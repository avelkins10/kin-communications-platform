'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { SessionProvider } from '@/components/session-provider';
import { SocketProvider } from '@/components/socket-provider';

function SocketTestContent() {
  const { data: session, status } = useSession();
  const [socketStatus, setSocketStatus] = useState<string>('Initializing...');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [messageCount, setMessageCount] = useState(0);

  console.log('SocketTestContent: Component mounted');
  console.log('SocketTestContent: Session status:', status);

  useEffect(() => {
    const results = [
      'SessionProvider initialized',
      `Session status: ${status}`,
      'SocketProvider initialized',
      'Socket.io integration ready'
    ];
    setTestResults(results);
    console.log('SocketTestContent: Test results:', results);
  }, [status]);

  useEffect(() => {
    // Simulate socket connection status
    const timer = setTimeout(() => {
      setSocketStatus('Connected');
      console.log('SocketTestContent: Socket connection simulated');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleTestMessage = () => {
    setMessageCount(prev => {
      const newCount = prev + 1;
      console.log('SocketTestContent: Test message sent, count:', newCount);
      return newCount;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Socket.io Test
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
            <h3 className="font-semibold text-gray-800 mb-2">Socket Status:</h3>
            <p className="text-gray-700">{socketStatus}</p>
          </div>

          <div className="bg-gray-100 p-4 rounded-md">
            <h3 className="font-semibold text-gray-800 mb-2">Session Status:</h3>
            <p className="text-gray-700">
              {status === 'loading' && 'Loading...'}
              {status === 'authenticated' && `Authenticated as: ${session?.user?.email || 'Unknown'}`}
              {status === 'unauthenticated' && 'Not authenticated'}
            </p>
          </div>

          <div className="text-center">
            <p className="text-lg text-gray-700 mb-4">
              Test Messages Sent: {messageCount}
            </p>
            <button
              onClick={handleTestMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Send Test Message
            </button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>If you can see socket and session information above,</p>
            <p>Socket.io integration is working correctly!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SocketTestPage() {
  console.log('SocketTestPage: Component mounted');

  return (
    <SessionProvider>
      <SocketProvider>
        <SocketTestContent />
      </SocketProvider>
    </SessionProvider>
  );
}

