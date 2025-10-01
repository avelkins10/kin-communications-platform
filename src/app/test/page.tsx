'use client';

import React, { useState } from 'react';

export default function TestPage() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('React is working!');

  console.log('TestPage: Component mounted successfully');
  console.log('TestPage: React version:', React.version || 'Unknown');
  console.log('TestPage: useState hook working:', count);

  const handleIncrement = () => {
    setCount(prev => {
      const newCount = prev + 1;
      console.log('TestPage: Counter updated to:', newCount);
      return newCount;
    });
  };

  const handleMessageChange = () => {
    setMessage(prev => {
      const newMessage = prev === 'React is working!' ? 'State updates work!' : 'React is working!';
      console.log('TestPage: Message updated to:', newMessage);
      return newMessage;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          React Compatibility Test
        </h1>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-4">{message}</p>
            <button
              onClick={handleMessageChange}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Toggle Message
            </button>
          </div>

          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900 mb-4">
              Counter: {count}
            </p>
            <button
              onClick={handleIncrement}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Increment Counter
            </button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>If you can see this page and interact with the buttons,</p>
            <p>React is working correctly!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

