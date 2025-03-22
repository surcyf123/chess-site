import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Socket } from 'socket.io-client';
import GameOverlay from './GameOverlay';
import { useRouter } from 'next/navigation';

// Define TimeControl interface
interface TimeControl {
  white: number;
  black: number;
}

// Helper function to safely create a Chess instance
const createChess = (fen?: string) => {
  try {
    // Always use the 'new' keyword for v0.12.1
    return fen ? new Chess(fen) : new Chess();
  } catch (e) {
    console.error('Error creating Chess instance:', e);
    throw new Error('Failed to initialize chess engine');
  }
};

interface ChessBoardProps {
  gameId: string;
  socket: Socket;
  playerColor: 'white' | 'black';
  timeControl: number;
  incrementPerMove: number;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  gameId,
  socket,
  playerColor,
  timeControl,
  incrementPerMove,
}) => {
  const router = useRouter();
  const [game, setGame] = useState(() => createChess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [availableMoves, setAvailableMoves] = useState<string[]>([]);
  const [time, setTime] = useState<TimeControl>({
    white: timeControl,
    black: timeControl,
  });
  const [isMyTurn, setIsMyTurn] = useState(playerColor === 'white');
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [draggedPiece, setDraggedPiece] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<'checkmate' | 'stalemate' | 'time' | null>(null);
  const [winner, setWinner] = useState<'white' | 'black' | 'draw' | null>(null);

  // Memoize the game state update function
  const updateGameState = useCallback((newFen: string) => {
    const newGame = createChess();
    newGame.load(newFen);
    setGame(newGame);
    setIsMyTurn(newGame.turn() === (playerColor === 'white' ? 'w' : 'b'));
  }, [playerColor]);

  // Debug logging for initial state
  useEffect(() => {
    console.log('ChessBoard mounted with props:', {
      gameId,
      playerColor,
      timeControl,
      incrementPerMove
    });
    
    // Ensure initial timers are set correctly
    setTime({
      white: timeControl,
      black: timeControl
    });
  }, [gameId, playerColor, timeControl, incrementPerMove]);

  // Debug logging for game state changes
  useEffect(() => {
    console.log('Game state:', {
      fen: game.fen(),
      turn: game.turn(),
      isCheck: game.isCheck(),
      isCheckmate: game.isCheckmate(),
      isDraw: game.isDraw(),
      isMyTurn,
      playerColor
    });

    // Check for game over conditions
    if (game.isCheckmate()) {
      const checkmatedColor = game.turn() === 'w' ? 'black' : 'white';
      setGameOver(true);
      setGameOverReason('checkmate');
      setWinner(checkmatedColor);
      
      // Notify server about game over
      socket.emit('gameOver', { 
        gameId, 
        winner: checkmatedColor 
      });
    } else if (game.isDraw() || game.isStalemate()) {
      setGameOver(true);
      setGameOverReason('stalemate');
      setWinner('draw');
      
      // Notify server about game over
      socket.emit('gameOver', { 
        gameId, 
        winner: 'draw' 
      });
    }
  }, [game, isMyTurn, playerColor, gameId, socket]);

  // Timer update effect - countdown active player's time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Only run timer if game is in progress
    if (game && !game.isGameOver() && !gameOver) {
      const activeColor = game.turn() === 'w' ? 'white' : 'black';
      
      // Start counting down the active player's clock
      interval = setInterval(() => {
        setTime(prev => {
          // If clock reaches zero, game over by timeout
          if (prev[activeColor] <= 1) {
            clearInterval(interval);
            const winner = activeColor === 'white' ? 'black' : 'white';
            setGameOver(true);
            setGameOverReason('time');
            setWinner(winner);
            
            // Notify server about timeout
            socket.emit('gameOver', { 
              gameId, 
              winner 
            });
            
            return prev;
          }
          
          // Decrement active player's time
          return {
            ...prev,
            [activeColor]: prev[activeColor] - 1
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [game, gameOver, gameId, socket]);

  // Handle socket connection issues and reconnection
  useEffect(() => {
    // Listen for connection events
    socket.on('connect', () => {
      console.log('Socket connected successfully');
      
      // Rejoin the game room on reconnection
      socket.emit('joinGame', { gameId });
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      
      // Rejoin the game room on reconnection
      socket.emit('joinGame', { gameId });
      
      // Request current game state after reconnection
      socket.emit('requestGameState', { gameId });
    });
    
    // Handle game state synchronization
    socket.on('gameState', (data) => {
      console.log('Game state received:', data);
      try {
        if (data.fen) {
          const newGame = createChess();
          newGame.load(data.fen);
          setGame(newGame);
          setIsMyTurn(newGame.turn() === (playerColor === 'white' ? 'w' : 'b'));
        }
        
        if (data.whiteTimeLeft !== undefined && data.blackTimeLeft !== undefined) {
          setTime({
            white: data.whiteTimeLeft,
            black: data.blackTimeLeft
          });
        }
        
        // Check if game status is "completed" and set game over state
        if (data.status === 'completed' && data.winner) {
          setGameOver(true);
          setWinner(data.winner);
          setGameOverReason(data.reason || 'checkmate');
        }
      } catch (error) {
        console.error('Error processing game state:', error);
      }
    });
    
    // Listen for game ended event
    socket.on('gameEnded', (data) => {
      console.log('Game ended event received:', data);
      setGameOver(true);
      setWinner(data.winner);
      setGameOverReason(data.reason || 'checkmate');
    });
    
    // Initially join the game
    socket.emit('joinGame', { gameId });
    
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('reconnect');
      socket.off('gameState');
      socket.off('gameEnded');
    };
  }, [socket, gameId, playerColor]);

  useEffect(() => {
    const handleMoveMade = (data: any) => {
      console.log('Move received:', data);

      try {
        // Extract move data, fall back to properties from database record
        const move = data.move;
        const whiteTimeLeft = data.whiteTimeLeft !== undefined ? data.whiteTimeLeft : time.white;
        const blackTimeLeft = data.blackTimeLeft !== undefined ? data.blackTimeLeft : time.black;

        if (!move || move.length < 4) {
          console.error('Invalid move format:', move);
          return;
        }

        const from = move.substring(0, 2);
        const to = move.substring(2, 4);
        const promotion = move.length > 4 ? move.substring(4) : undefined;

        // Check if this is a move we made ourselves
        if (lastMove && lastMove.from === from && lastMove.to === to) {
          console.log('Skipping our own move that came back from server');
          
          // Still update the timers with the server's authoritative values
          setTime({ white: whiteTimeLeft, black: blackTimeLeft });
          return;
        }

        // Create a fresh Chess instance to validate the move
        try {
          // Create a new game instance with current FEN
          const newGame = createChess(game.fen());
          
          // Try to apply the move
          const result = newGame.move({ from, to, promotion });
          
          if (result) {
            // Update game state
            setGame(newGame);
            setLastMove({ from, to });
            
            // Update turn - it's our turn if the new game state's turn matches our color
            const isWhiteTurn = newGame.turn() === 'w';
            setIsMyTurn((isWhiteTurn && playerColor === 'white') || (!isWhiteTurn && playerColor === 'black'));
            
            // Update timers with server's authoritative values
            setTime({ white: whiteTimeLeft, black: blackTimeLeft });
            
            // Clear selection
            setSelectedSquare(null);
            setAvailableMoves([]);
          } else {
            console.error('Invalid move rejected by chess.js:', { from, to, promotion });
          }
        } catch (moveError) {
          console.error('Error applying move to chess.js:', moveError);
        }
      } catch (error) {
        console.error('Error handling received move:', error);
      }
    };

    socket.on('moveMade', handleMoveMade);
    
    return () => {
      socket.off('moveMade', handleMoveMade);
    };
  }, [game, lastMove, playerColor, socket, time]);

  const getAvailableMoves = useCallback((square: string) => {
    try {
      if (!game) return [];

      // Get all legal moves from the square
      const moves = game.moves({
        square,
        verbose: true
      });

      // Return just the target squares
      return moves.map(move => move.to);
    } catch (error) {
      console.error('Error getting available moves:', error);
      return [];
    }
  }, [game]);

  const isCapture = useCallback((from: string, to: string) => {
    try {
      // A move is a capture if there's a piece at the destination
      // or if it's an en passant move
      const piece = game.get(to);
      if (piece) return true;

      // Check for en passant
      const moves = game.moves({ 
        square: from, 
        verbose: true 
      });
      
      const move = moves.find(m => m.to === to);
      return move ? move.flags.includes('e') : false;
    } catch (error) {
      console.error('Error checking if move is capture:', error);
      return false;
    }
  }, [game]);

  const makeMove = useCallback((from: string, to: string) => {
    if (!isMyTurn) {
      console.log('Not your turn');
      return false;
    }

    try {
      // Create a new game instance and try the move
      const newGame = createChess(game.fen());
      const move = newGame.move({ from, to, promotion: 'q' });

      if (!move) {
        console.error('Invalid move:', { from, to });
        return false;
      }

      // Update local game state
      setGame(newGame);
      setLastMove({ from, to });
      
      // Update turn - it's no longer our turn after making a move
      setIsMyTurn(false);

      // Update timer with increment for the current player
      const updatedTime = {
        ...time,
        [playerColor]: time[playerColor] + incrementPerMove
      };
      setTime(updatedTime);

      // Send move to server with both timers' current values
      const moveString = from + to + (move.promotion || '');
      socket.emit('move', {
        gameId,
        move: moveString,
        whiteTimeLeft: updatedTime.white,
        blackTimeLeft: updatedTime.black
      });

      return true;
    } catch (error) {
      console.error('Error making move:', error);
      return false;
    }
  }, [game, isMyTurn, playerColor, time, gameId, socket, incrementPerMove]);

  const handleSquareClick = useCallback((square: string) => {
    if (!isMyTurn || gameOver) {
      return;
    }

    // Get the piece at the clicked square
    const piece = game.get(square);

    // If a square is already selected
    if (selectedSquare) {
      // If clicking the same square, deselect it
      if (square === selectedSquare) {
        setSelectedSquare(null);
        setAvailableMoves([]);
        return;
      }

      // If clicking a valid destination square, make the move
      if (availableMoves.includes(square)) {
        try {
          // Create a new game instance to validate the move
          const newGame = createChess(game.fen());
          
          // Try to make the move in our local copy first
          const moveResult = newGame.move({
            from: selectedSquare,
            to: square,
            promotion: 'q',
          });

          if (!moveResult) {
            // Clear selection if move is invalid
            setSelectedSquare(null);
            setAvailableMoves([]);
            return;
          }
          
          // Update timer with increment for the current player
          const updatedTime = {
            ...time,
            [playerColor]: time[playerColor] + incrementPerMove
          };
          
          // Construct the move string
          const moveString = selectedSquare + square + (moveResult.promotion || '');
          
          // First update our local state to avoid lag
          setGame(newGame);
          setLastMove({ from: selectedSquare, to: square });
          setIsMyTurn(false);
          setTime(updatedTime);
          
          // Then send move to server with both timers' current values
          socket.emit('move', {
            gameId,
            move: moveString,
            whiteTimeLeft: updatedTime.white,
            blackTimeLeft: updatedTime.black,
          });
          
          // Clear selection
          setSelectedSquare(null);
          setAvailableMoves([]);
          
          return;
        } catch (e) {
          console.error('Error making move:', e);
          
          // Clear selection on error
          setSelectedSquare(null);
          setAvailableMoves([]);
        }
      }
    }

    // If clicking a square that's not a move target, try to select a new piece
    // Only select if it's our piece
    if (piece && piece.color === (playerColor === 'white' ? 'w' : 'b')) {
      const moves = getAvailableMoves(square);
      
      // Only set selection if there are valid moves
      if (moves && moves.length > 0) {
        setSelectedSquare(square);
        setAvailableMoves(moves);
      } else {
        // Clear selection if no valid moves
        setSelectedSquare(null);
        setAvailableMoves([]);
      }
    } else {
      // If clicking on an empty square or opponent's piece, clear selection
      setSelectedSquare(null);
      setAvailableMoves([]);
    }
  }, [selectedSquare, availableMoves, isMyTurn, game, playerColor, time, incrementPerMove, gameId, socket, getAvailableMoves, gameOver]);

  const handleDragStart = (e: React.DragEvent, square: string) => {
    if (!isMyTurn || gameOver) {
      e.preventDefault();
      return;
    }
    
    const piece = game.get(square);
    if (!piece || piece.color !== (playerColor === 'white' ? 'w' : 'b')) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('text/plain', square);
    setDraggedPiece(square);
    
    // Calculate available moves for this piece
    const moves = getAvailableMoves(square);
    setSelectedSquare(square);
    setAvailableMoves(moves);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSquare: string) => {
    e.preventDefault();
    const sourceSquare = e.dataTransfer.getData('text/plain');
    
    if (!isMyTurn || gameOver) {
      return;
    }
    
    if (availableMoves.includes(targetSquare)) {
      try {
        // Create a new game instance to validate the move
        const newGame = createChess(game.fen());
        
        // Try to make the move in our local copy first
        const moveResult = newGame.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q',
        });

        if (!moveResult) {
          return;
        }

        // Update timer with increment for the current player
        const updatedTime = {
          ...time,
          [playerColor]: time[playerColor] + incrementPerMove
        };
        
        // Construct the move string
        const moveString = sourceSquare + targetSquare + (moveResult.promotion || '');
        
        // First update our local state to avoid lag
        setGame(newGame);
        setLastMove({ from: sourceSquare, to: targetSquare });
        setIsMyTurn(false);
        setTime(updatedTime);
        
        // Then send move to server with both timers' current values
        socket.emit('move', {
          gameId,
          move: moveString,
          whiteTimeLeft: updatedTime.white,
          blackTimeLeft: updatedTime.black,
        });
        
        // Clear selection and drag state
        setSelectedSquare(null);
        setAvailableMoves([]);
        setDraggedPiece(null);
        
        // Check for game over
        if (newGame.isGameOver()) {
          let winner = 'draw';
          let reason: 'checkmate' | 'stalemate' | null = null;
          
          if (newGame.isCheckmate()) {
            winner = newGame.turn() === 'w' ? 'black' : 'white';
            reason = 'checkmate';
          } else if (newGame.isDraw() || newGame.isStalemate()) {
            reason = 'stalemate';
          }
          
          socket.emit('gameOver', { gameId, winner, reason });
        }
      } catch (e) {
        console.error('Error making move:', e);
      }
    }
    
    // Always clear drag state
    setDraggedPiece(null);
  };

  const renderSquare = (i: number) => {
    // Convert index based on board orientation
    const actualIndex = playerColor === 'black' ? 63 - i : i;
    const file = actualIndex % 8;
    const rank = Math.floor(actualIndex / 8);
    const square = `${'abcdefgh'[file]}${8 - rank}`;
    
    const piece = game.get(square);
    const isSelected = square === selectedSquare;
    const isDark = (file + rank) % 2 === 1;
    const isLastMove = lastMove && (square === lastMove.from || square === lastMove.to);
    const isAvailableMove = availableMoves.includes(square);
    const isAvailableCapture = isAvailableMove && selectedSquare && isCapture(selectedSquare, square);

    // Build class name string carefully
    let squareClasses = 'chess-square';
    squareClasses += isDark ? ' chess-square-dark' : ' chess-square-light';
    
    // Important: Only apply highlight classes to specific squares that need them
    if (isSelected) {
      squareClasses += ' selected-square';
    }
    
    if (isLastMove) {
      squareClasses += ' last-move';
    }
    
    if (isAvailableMove) {
      squareClasses += isAvailableCapture ? ' available-capture' : ' available-move';
    }

    return (
      <div
        key={square}
        onClick={() => handleSquareClick(square)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, square)}
        className={squareClasses}
        data-square={square}
      >
        {/* Coordinate labels */}
        {file === (playerColor === 'black' ? 7 : 0) && (
          <span className="coordinate-label rank-label">
            {8 - rank}
          </span>
        )}
        {rank === (playerColor === 'black' ? 0 : 7) && (
          <span className="coordinate-label file-label">
            {String.fromCharCode(97 + file)}
          </span>
        )}
        
        {piece && (
          <div 
            className={`chess-piece ${piece.color === 'w' ? 'chess-piece-white' : 'chess-piece-black'}`}
            draggable={isMyTurn && !gameOver && piece.color === playerColor.charAt(0)}
            onDragStart={(e) => handleDragStart(e, square)}
            onClick={(e) => {
              // Stop propagation to prevent triggering the square click event
              e.stopPropagation();
              handleSquareClick(square);
            }}
          >
            {getPieceSymbol(piece.type, piece.color)}
          </div>
        )}
      </div>
    );
  };

  const getPieceSymbol = (type: string, color: string): string => {
    const pieces: { [key: string]: { [key: string]: string } } = {
      'w': {
        'p': '♙', 'n': '♘', 'b': '♗',
        'r': '♖', 'q': '♕', 'k': '♔'
      },
      'b': {
        'p': '♟', 'n': '♞', 'b': '♝',
        'r': '♜', 'q': '♛', 'k': '♚'
      }
    };
    return pieces[color][type];
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayAgain = () => {
    // Navigate to home page to create a new game
    router.push('/');
  };

  return (
    <div className="chess-container">
      {/* Chess Clocks */}
      <div className="chess-clocks-container">
        {/* Black Clock */}
        <div className={`chess-clock chess-clock-black ${game.turn() === 'b' ? 'chess-clock-active chess-clock-running' : ''}`}>
          {game.turn() === 'b' && <div className="turn-indicator turn-indicator-black"></div>}
          <div className="chess-clock-value">{formatTime(time.black)}</div>
          <div className="chess-clock-player">Black</div>
        </div>
        
        {/* White Clock */}
        <div className={`chess-clock chess-clock-white ${game.turn() === 'w' ? 'chess-clock-active chess-clock-running' : ''}`}>
          {game.turn() === 'w' && <div className="turn-indicator turn-indicator-white"></div>}
          <div className="chess-clock-value">{formatTime(time.white)}</div>
          <div className="chess-clock-player">White</div>
        </div>
      </div>

      {/* Game Status */}
      <div className={`game-status ${isMyTurn ? 'your-turn' : 'opponents-turn'}`}>
        {gameOver ? (
          winner === playerColor ? "You won!" : 
          winner === 'draw' ? "Game drawn" : "You lost"
        ) : (
          isMyTurn ? "Your Turn" : "Opponent's Turn"
        )}
      </div>

      {/* Chess Board with Wrapper */}
      <div className="chess-board-wrapper">
        <div className="chess-board">
          {[...Array(64)].map((_, i) => renderSquare(i))}
        </div>
        
        {/* Game Over Overlay */}
        <GameOverlay
          isVisible={gameOver}
          gameOverReason={gameOverReason}
          winner={winner}
          playerColor={playerColor}
          onPlayAgain={handlePlayAgain}
        />
      </div>
    </div>
  );
}; 