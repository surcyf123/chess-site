'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [timeControl, setTimeControl] = useState(300); // 5 minutes
  const [increment, setIncrement] = useState(2); // 2 seconds per move
  const [timeInputValue, setTimeInputValue] = useState('5'); // Track the raw input for time
  const [incrementInputValue, setIncrementInputValue] = useState('2'); // Track the raw input for increment
  const [isLoading, setIsLoading] = useState(false);

  const createGame = async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#1a1b1e] p-4">
      <div className="max-w-4xl w-full mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Chess Arena</h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Play real-time chess with friends. Create a game, share the link, and enjoy!
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full max-w-5xl">
        {/* Game Creation Panel */}
        <div className="md:col-span-7 bg-[#2d2a23] p-8 rounded-xl shadow-lg border border-[#444] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600"></div>
          
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="text-blue-400 mr-2">▶</span> Create a New Game
          </h2>
          
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
                className="w-full px-3 py-2 bg-[#1f1f1f] border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                className="w-full px-3 py-2 bg-[#1f1f1f] border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                min="0"
                placeholder="2"
              />
            </div>

            <div className="bg-[#1f1f1f] rounded-lg p-4 border border-gray-700">
              <div className="text-gray-300 text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Time per player:</span>
                  <span className="font-semibold text-white">{timeInputValue || '5'} minute{parseInt(timeInputValue) !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span>Increment:</span>
                  <span className="font-semibold text-white">{incrementInputValue || '0'} second{parseInt(incrementInputValue) !== 1 ? 's' : ''} per move</span>
                </div>
                <div className="border-t border-gray-700 my-2 pt-2 flex justify-between">
                  <span>Game type:</span>
                  <span className="font-semibold text-amber-400">
                    {parseInt(timeInputValue) < 3 ? 'Bullet' : parseInt(timeInputValue) < 10 ? 'Blitz' : 'Rapid'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={createGame}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all shadow-lg ${
                isLoading 
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Game...
                </span>
              ) : (
                "Create New Game"
              )}
            </button>
          </div>
        </div>
        
        {/* Information Panel */}
        <div className="md:col-span-5 bg-[#2d2a23] p-8 rounded-xl shadow-lg border border-[#444] self-start">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="text-amber-400 mr-2">♞</span> How to Play
          </h2>
          
          <div className="space-y-4 text-gray-300">
            <div className="bg-[#1f1f1f] p-4 rounded-lg border border-gray-700">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold mr-3">1</div>
                <h3 className="text-white font-medium">Create a game</h3>
              </div>
              <p className="text-sm pl-11">Set your preferred time control and increment, then create a new game.</p>
            </div>
            
            <div className="bg-[#1f1f1f] p-4 rounded-lg border border-gray-700">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold mr-3">2</div>
                <h3 className="text-white font-medium">Share the link</h3>
              </div>
              <p className="text-sm pl-11">Send the game link to your friend so they can join your game.</p>
            </div>
            
            <div className="bg-[#1f1f1f] p-4 rounded-lg border border-gray-700">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold mr-3">3</div>
                <h3 className="text-white font-medium">Play together</h3>
              </div>
              <p className="text-sm pl-11">The first player will be randomly assigned white or black. Make moves by clicking on pieces and their destination squares.</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              Join an existing game by pasting a game link into your browser, or create a new game to get started.
            </p>
          </div>
        </div>
      </div>
      
      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>Chess Arena – Play real-time chess with friends</p>
        <p className="mt-1">Built with Next.js, Socket.IO, and Chess.js</p>
      </footer>
    </main>
  );
} 