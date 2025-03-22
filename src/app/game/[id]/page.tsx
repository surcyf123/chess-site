'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChessBoard } from '../../../components/ChessBoard';
import { ErrorBoundary } from '../../../components/ErrorBoundary';

interface GameData {
  id: string;
  timeControl: number;
  incrementPerMove: number;
  status: string;
  whitePlayer: string;
  blackPlayer: string;
}

export default function Game({ params }: { params: { id: string } }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [copied, setCopied] = useState(false);
  const [moveCount, setMoveCount] = useState(0);

  // Track game state from ChessBoard
  useEffect(() => {
    const handleMoveMade = () => {
      // Increment move count when a move is made
      setMoveCount(prev => prev + 0.5); // 0.5 for each player's move (so 1 per full turn)
    };

    if (socket) {
      socket.on('moveMade', handleMoveMade);
      
      return () => {
        socket.off('moveMade', handleMoveMade);
      };
    }
  }, [socket]);

  useEffect(() => {
    // Get the socket URL from environment variable
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    console.log('Connecting to socket server at:', socketUrl);
    
    // More robust socket connection with better error handling
    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'], // Start with polling then upgrade
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true,
      path: '/socket.io/',
      withCredentials: false,
    });
    
    // Debug socket connection attempts
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });
    
    newSocket.on('connect', () => {
      console.log('Socket successfully connected with ID:', newSocket.id);
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt #${attemptNumber}`);
    });
    
    setSocket(newSocket);

    // Fetch game data first
    fetch(`/api/games/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setGameData(data);
        
        // Determine player color based on available slots
        let color: 'white' | 'black';
        if (data.whitePlayer === '') {
          color = 'white';
        } else if (data.blackPlayer === '') {
          color = 'black';
        } else {
          // If both slots are taken, default to white as spectator
          color = 'white';
        }
        
        setPlayerColor(color);
        
        // Join the game with the determined color
        newSocket.on('connect', () => {
          console.log('Socket connected');
          newSocket.emit('joinGame', { gameId: params.id, player: color });
        });
        
        // Register for connect event if socket is already connected
        if (newSocket.connected) {
          console.log('Socket already connected');
          newSocket.emit('joinGame', { gameId: params.id, player: color });
        }
        
        // Listen for game state updates
        newSocket.on('gameState', (data) => {
          console.log('Game state received:', data);
          // If we receive a state update, we could update local state if needed
        });
        
        // Join the game on the server
        fetch(`/api/games/${params.id}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ color }),
        });
      });

    return () => {
      newSocket.close();
    };
  }, [params.id]);

  const copyGameLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!socket || !gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1b1e]">
        <div className="text-3xl text-white font-bold animate-pulse">Loading game...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#1a1b1e] flex flex-col">
        {/* Header */}
        <header className="bg-[#2d2a23] border-b border-[#444] p-4 shadow-lg sticky top-0 w-full z-20">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#d9c08c] to-[#a67c52] rounded-lg shadow-lg flex items-center justify-center text-black text-xl">♞</div>
              Chess Arena
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-gray-300 text-sm bg-[#1f1f1f] px-4 py-2 rounded-lg border border-[#333]">
                Game ID: <span className="font-mono text-blue-400">{params.id.substring(0, 8)}...</span>
              </div>
              <button
                onClick={copyGameLink}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg
                  ${copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/20'}`}
              >
                {copied ? '✓ Copied!' : '⎘ Share Game'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Game Board - Centered */}
            <div className="lg:col-span-8 flex justify-center">
              <ChessBoard
                gameId={params.id}
                socket={socket}
                playerColor={playerColor}
                timeControl={gameData.timeControl}
                incrementPerMove={gameData.incrementPerMove}
              />
            </div>
            
            {/* Game Info */}
            <div className="lg:col-span-4 space-y-4 self-start">
              <div className="bg-[#2d2a23] rounded-xl shadow-xl p-5 border border-[#444]">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-blue-400">★</span>
                  Game Information
                </h2>
                <div className="space-y-3">
                  <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#333] relative overflow-hidden">
                    <div className="text-gray-400 text-sm mb-1">Playing as</div>
                    <div className="text-white font-bold flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full ${playerColor === 'white' ? 'bg-white' : 'bg-black'} shadow-md border border-[#444]`}></div>
                      <span>
                        {playerColor.charAt(0).toUpperCase() + playerColor.slice(1)}
                      </span>
                    </div>
                    {/* Decorative accent */}
                    <div className={`absolute w-1 h-full top-0 left-0 ${playerColor === 'white' ? 'bg-white' : 'bg-gray-800'}`}></div>
                  </div>
                  
                  <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#333] relative overflow-hidden">
                    <div className="text-gray-400 text-sm mb-1">Time Control</div>
                    <div className="text-white font-bold flex items-center gap-2">
                      <span className="text-amber-400">⏱</span>
                      <span>
                        {Math.floor(gameData.timeControl / 60)} minutes
                        {gameData.incrementPerMove > 0 && (
                          <span className="text-blue-400 ml-1">+{gameData.incrementPerMove}s</span>
                        )}
                      </span>
                    </div>
                    {/* Decorative accent */}
                    <div className="absolute w-1 h-full top-0 left-0 bg-amber-500"></div>
                  </div>
                  
                  <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#333] relative overflow-hidden">
                    <div className="text-gray-400 text-sm mb-1">Game Stats</div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">Move Count:</span>
                      <span className="text-white font-mono bg-[#333] px-2 py-0.5 rounded">{Math.floor(moveCount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Game Status:</span>
                      <span className="text-green-400 font-medium">In Progress</span>
                    </div>
                    {/* Decorative accent */}
                    <div className="absolute w-1 h-full top-0 left-0 bg-blue-500"></div>
                  </div>
                </div>
              </div>

              <button
                className="gaming-button w-full flex items-center justify-center gap-2"
              >
                <span>⚑</span> 
                <span>Resign Game</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
} 