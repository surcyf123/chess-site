import React from 'react';

interface GameOverlayProps {
  isVisible: boolean;
  gameOverReason: 'checkmate' | 'stalemate' | 'time' | null;
  winner: 'white' | 'black' | 'draw' | null;
  playerColor: 'white' | 'black';
  onPlayAgain: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({
  isVisible,
  gameOverReason,
  winner,
  playerColor,
  onPlayAgain
}) => {
  if (!isVisible) return null;

  const isWinner = winner === playerColor;
  const isDraw = winner === 'draw';
  
  let title = '';
  let description = '';
  
  if (gameOverReason === 'checkmate') {
    title = isWinner ? 'Checkmate! You won!' : 'Checkmate! You lost.';
    description = isWinner 
      ? 'You successfully checkmated your opponent!' 
      : 'Your king was checkmated.';
  } else if (gameOverReason === 'stalemate') {
    title = 'Game drawn by stalemate';
    description = 'No legal moves available, but the king is not in check.';
  } else if (gameOverReason === 'time') {
    title = isWinner ? 'You won on time!' : 'You lost on time.';
    description = isWinner 
      ? 'Your opponent ran out of time.' 
      : 'Your clock ran to zero.';
  } else if (isDraw) {
    title = 'Game drawn';
    description = 'The game ended in a draw.';
  }

  return (
    <div className="game-overlay">
      <div className="game-overlay-content">
        <h2 className={`game-result ${isWinner ? 'win' : isDraw ? 'draw' : 'loss'}`}>
          {title}
        </h2>
        <p className="game-result-description">{description}</p>
        <button className="play-again-button" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOverlay; 