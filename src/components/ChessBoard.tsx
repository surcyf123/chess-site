import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Socket } from 'socket.io-client';

// Helper function to safely create a Chess instance
const createChess = (fen?: string) => {
  try {
    // With the newer chess.js version, Chess is a class that should be instantiated with 'new'
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

interface TimeControl {
  white: number;
  black: number;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  gameId,
  socket,
  playerColor,
  timeControl,
  incrementPerMove,
}) => {
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
    console.log('Highlighting should work - CSS classes properly initialized');
    
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
  }, [game, isMyTurn, playerColor]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Update: Only run a timer if game is in progress
    if (game && !game.isGameOver()) {
      // If it's my turn, decrement my timer
      if (isMyTurn) {
        console.log('Starting timer for', playerColor, 'with time:', time[playerColor]);
        interval = setInterval(() => {
          setTime(prev => ({
            ...prev,
            [playerColor]: Math.max(0, prev[playerColor] - 1)
          }));
        }, 1000);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMyTurn, playerColor, time, game]);

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
      } catch (error) {
        console.error('Error processing game state:', error);
      }
    });
    
    // Initially join the game
    socket.emit('joinGame', { gameId });
    
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('reconnect');
      socket.off('gameState');
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

        // Log current game state for debugging
        console.log('Current FEN before applying move:', game.fen());
        console.log('Current turn:', game.turn(), 'Player color:', playerColor);
        
        // Create a fresh Chess instance to validate the move
        try {
          // Create a new game instance with current FEN
          const newGame = createChess(game.fen());
          
          // Try to apply the move
          const result = newGame.move({ from, to, promotion });
          
          if (result) {
            console.log('Move applied successfully, new FEN:', newGame.fen());
            console.log('New turn:', newGame.turn(), 'Player color:', playerColor);
            
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
            console.error('Available moves:', newGame.moves({ verbose: true }));
          }
        } catch (moveError) {
          console.error('Error applying move to chess.js:', moveError);
          console.error('Move:', { from, to, promotion });
          console.error('Game state:', game.fen());
          console.error('Stack:', moveError.stack);
        }
      } catch (error) {
        console.error('Error handling received move:', error);
        console.error('Received data:', data);
        console.error('Game state:', game.fen());
        console.error('Stack:', error.stack);
      }
    };

    socket.on('moveMade', handleMoveMade);
    
    // Return a cleanup function that removes the event listener
    return () => {
      socket.off('moveMade', handleMoveMade);
    };
  }, [socket, game, playerColor, time, lastMove]);

  // Update initial turn state when component mounts
  useEffect(() => {
    const isWhiteTurn = game.turn() === 'w';
    setIsMyTurn((isWhiteTurn && playerColor === 'white') || (!isWhiteTurn && playerColor === 'black'));
  }, [game, playerColor]);

  // More robust logging for highlighting
  useEffect(() => {
    if (selectedSquare) {
      console.log(`Selected square: ${selectedSquare}`);
      console.log(`Available moves for ${selectedSquare}:`, availableMoves);
    } else {
      console.log('No square selected');
    }
  }, [selectedSquare, availableMoves]);

  const getAvailableMoves = (square: string): string[] => {
    try {
      if (!square) return [];
      console.log('Getting available moves for square:', square);
      const moves = game.moves({ square, verbose: true });
      const validMoves = moves.map(move => move.to);
      console.log('Available moves computed:', validMoves);
      return validMoves;
    } catch (e) {
      console.error('Error getting available moves:', e);
      return [];
    }
  };

  const isCapture = (from: string, to: string): boolean => {
    if (!from || !to) return false;
    try {
      const moves = game.moves({ square: from, verbose: true });
      const isCapture = moves.some(move => move.to === to && (move.captured || move.flags.includes('e')));
      console.log('Checking capture:', { from, to, isCapture });
      return isCapture;
    } catch (e) {
      console.error('Error checking capture:', e);
      return false;
    }
  };

  const makeMove = useCallback((from: string, to: string) => {
    if (!isMyTurn) {
      console.log('Not your turn');
      return false;
    }

    try {
      console.log('Attempting move:', { from, to });
      console.log('Current FEN:', game.fen());
      console.log('Current turn:', game.turn(), 'Player color:', playerColor);
      
      // Create a new game instance and try the move
      const newGame = createChess(game.fen());
      const move = newGame.move({ from, to, promotion: 'q' });

      if (!move) {
        console.error('Invalid move:', { from, to });
        return false;
      }

      console.log('Move valid, applying:', move);
      console.log('New FEN:', newGame.fen());
      console.log('New turn:', newGame.turn());

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
      console.error('Game state:', game.fen());
      return false;
    }
  }, [game, isMyTurn, playerColor, time, gameId, socket, incrementPerMove]);

  const handleSquareClick = useCallback((square: string) => {
    console.log('Square clicked:', square);

    if (!isMyTurn) {
      console.log('Not your turn');
      return;
    }

    // Get the piece at the clicked square
    const piece = game.get(square);
    console.log('Piece at square:', piece);

    // If a square is already selected
    if (selectedSquare) {
      // If clicking the same square, deselect it
      if (square === selectedSquare) {
        console.log('Deselecting square:', square);
        setSelectedSquare(null);
        setAvailableMoves([]);
        return;
      }

      // If clicking a valid destination square, make the move
      if (availableMoves.includes(square)) {
        console.log('Making move:', selectedSquare, 'to', square);
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
            console.error('Invalid move:', { from: selectedSquare, to: square });
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
          console.error('Stack:', e.stack);
          
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
      console.log('Setting selected square:', square, 'with moves:', moves);
      
      // Only set selection if there are valid moves
      if (moves && moves.length > 0) {
        setSelectedSquare(square);
        setAvailableMoves(moves);
      } else {
        console.log('No valid moves for this piece');
        // Clear selection if no valid moves
        setSelectedSquare(null);
        setAvailableMoves([]);
      }
    } else {
      // If clicking on an empty square or opponent's piece, clear selection
      console.log('Clearing selection, clicked on empty or opponent square');
      setSelectedSquare(null);
      setAvailableMoves([]);
    }
  }, [selectedSquare, availableMoves, isMyTurn, game, playerColor, time, incrementPerMove, gameId, socket, getAvailableMoves]);

  const handleDragStart = (e: React.DragEvent, square: string) => {
    const piece = game.get(square);
    if (!isMyTurn || !piece || piece.color !== playerColor.charAt(0)) {
      e.preventDefault();
      return;
    }
    
    // Set dragged piece and selected square
    setDraggedPiece(square);
    setSelectedSquare(square);
    
    // Calculate and set available moves
    const moves = getAvailableMoves(square);
    console.log('Drag start, setting moves:', moves);
    setAvailableMoves(moves);
    
    // Store dragged square data
    e.dataTransfer.setData('text/plain', square);
    
    // Make the ghost image transparent
    const ghostImage = document.createElement('div');
    ghostImage.style.opacity = '0';
    document.body.appendChild(ghostImage);
    e.dataTransfer.setDragImage(ghostImage, 0, 0);
    
    // Remove temporary element after dragging starts
    setTimeout(() => {
      document.body.removeChild(ghostImage);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSquare: string) => {
    e.preventDefault();
    const sourceSquare = e.dataTransfer.getData('text/plain');
    
    if (!isMyTurn) {
      console.log('Not your turn');
      return;
    }
    
    if (availableMoves.includes(targetSquare)) {
      try {
        // Create a new game instance to validate the move
        const newGame = createChess(game.fen());
        console.log('Validating move:', sourceSquare, 'to', targetSquare);
        console.log('Current FEN before move:', newGame.fen());
        console.log('Current turn:', newGame.turn());
        
        // Try to make the move in our local copy first
        const moveResult = newGame.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q',
        });

        if (!moveResult) {
          console.error('Invalid move:', { sourceSquare, targetSquare });
          return;
        }
        
        console.log('Move validated:', moveResult);
        console.log('New FEN after move:', newGame.fen());

        // Update timer with increment for the current player
        const updatedTime = {
          ...time,
          [playerColor]: time[playerColor] + incrementPerMove
        };
        
        // Construct the move string
        const moveString = sourceSquare + targetSquare + (moveResult.promotion || '');
        console.log('Sending move string to server:', moveString);
        
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
        
        // Check for game over
        if (newGame.isGameOver()) {
          let winner = 'draw';
          if (newGame.isCheckmate()) {
            winner = newGame.turn() === 'w' ? 'black' : 'white';
          }
          socket.emit('gameOver', { gameId, winner });
        }
      } catch (e) {
        console.error('Error making move:', e);
        console.error('Current game state:', {
          fen: game.fen(),
          turn: game.turn(),
          isCheck: game.isCheck(),
          moveNumber: game.moveNumber()
        });
        console.error('Stack:', e.stack);
      }
    } else {
      console.log('Move not in available moves:', targetSquare);
      console.log('Available moves:', availableMoves);
    }
    
    // Always clear selection and drag state
    setDraggedPiece(null);
    setSelectedSquare(null);
    setAvailableMoves([]);
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
            draggable={isMyTurn && piece.color === playerColor.charAt(0)}
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

  // Force refresh highlighting for testing
  const forceRefreshHighlighting = useCallback(() => {
    if (selectedSquare) {
      const moves = getAvailableMoves(selectedSquare);
      setAvailableMoves([...moves]); // Create new array to force re-render
    }
  }, [selectedSquare, getAvailableMoves]);

  // Use this effect to force refresh highlighting when needed
  useEffect(() => {
    if (selectedSquare) {
      forceRefreshHighlighting();
    }
  }, [selectedSquare, forceRefreshHighlighting]);

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

      {/* Game Status - Moved ABOVE the board */}
      <div className={`game-status ${isMyTurn ? 'your-turn' : 'opponents-turn'}`}>
        {isMyTurn ? "Your Turn" : "Opponent's Turn"}
      </div>

      {/* Chess Board with Wrapper */}
      <div className="chess-board-wrapper">
        <div className="chess-board">
          {[...Array(64)].map((_, i) => renderSquare(i))}
        </div>
      </div>
    </div>
  );
}; 