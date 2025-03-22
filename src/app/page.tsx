'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [timeControl, setTimeControl] = useState(300); // 5 minutes
  const [increment, setIncrement] = useState(2); // 2 seconds per move
  const [timeInputValue, setTimeInputValue] = useState('5'); // Track the raw input for time
  const [incrementInputValue, setIncrementInputValue] = useState('2'); // Track the raw input for increment

  const createGame = async () => {
    try {
      // Validate values before submitting
      const validTimeControl = Math.max(1, parseInt(timeInputValue) || 5) * 60;
      const validIncrement = Math.max(0, parseInt(incrementInputValue) || 0);
      
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeControl: validTimeControl,
          incrementPerMove: validIncrement,
        }),
      });

      const data = await response.json();
      router.push(`/game/${data.id}`);
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#1a1b1e]">
      <div className="bg-[#2f3136] p-8 rounded-lg shadow-lg max-w-md w-full border border-[#444]">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Chess Game Setup</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Time Control (minutes)
            </label>
            <input
              type="number"
              value={timeInputValue}
              onChange={(e) => {
                setTimeInputValue(e.target.value);
                const parsed = parseInt(e.target.value);
                if (!isNaN(parsed)) {
                  setTimeControl(parsed * 60);
                }
              }}
              className="w-full px-3 py-2 bg-[#202225] border border-gray-700 rounded-md text-white"
              min="1"
              placeholder="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Increment per move (seconds)
            </label>
            <input
              type="number"
              value={incrementInputValue}
              onChange={(e) => {
                setIncrementInputValue(e.target.value);
                const parsed = parseInt(e.target.value);
                if (!isNaN(parsed)) {
                  setIncrement(parsed);
                }
              }}
              className="w-full px-3 py-2 bg-[#202225] border border-gray-700 rounded-md text-white"
              min="0"
              placeholder="2"
            />
          </div>

          <div className="text-gray-400 text-sm">
            <p>Game will be created with {timeInputValue || '5'} minute{parseInt(timeInputValue) !== 1 ? 's' : ''} per player</p>
            <p>Increment: {incrementInputValue || '0'} second{parseInt(incrementInputValue) !== 1 ? 's' : ''} per move</p>
          </div>

          <button
            onClick={createGame}
            className="w-full gaming-button"
          >
            Create New Game
          </button>
        </div>
      </div>
    </main>
  );
} 