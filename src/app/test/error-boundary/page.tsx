'use client';

import { useState } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

function ErrorTrigger({ shouldError }: { shouldError: boolean }) {
  console.log('ErrorTrigger: Component rendered, shouldError:', shouldError);

  if (shouldError) {
    console.log('ErrorTrigger: Throwing error for testing');
    throw new Error('Test error triggered for ErrorBoundary testing');
  }

  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
      <p>✅ Component is working correctly - no errors!</p>
    </div>
  );
}

function ErrorBoundaryTestContent() {
  const [shouldError, setShouldError] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  console.log('ErrorBoundaryTestContent: Component mounted');

  const handleTriggerError = () => {
    console.log('ErrorBoundaryTestContent: Triggering error');
    setShouldError(true);
  };

  const handleReset = () => {
    console.log('ErrorBoundaryTestContent: Resetting error state');
    setShouldError(false);
    setTestResults([
      'ErrorBoundary initialized',
      'Error handling ready',
      'Component state management working'
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          ErrorBoundary Test
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

          <div className="text-center space-y-4">
            <button
              onClick={handleTriggerError}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors mr-4"
            >
              Trigger Error
            </button>
            <button
              onClick={handleReset}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Reset Test
            </button>
          </div>

          <div className="bg-gray-100 p-4 rounded-md">
            <h3 className="font-semibold text-gray-800 mb-2">Error Boundary Test Area:</h3>
            <ErrorBoundary>
              <ErrorTrigger shouldError={shouldError} />
            </ErrorBoundary>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Click "Trigger Error" to test error boundary functionality.</p>
            <p>If errors are caught and displayed properly, ErrorBoundary is working!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ErrorBoundaryTestPage() {
  console.log('ErrorBoundaryTestPage: Component mounted');

  return <ErrorBoundaryTestContent />;
}

