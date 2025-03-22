// A minimal implementation of a chess engine that provides basic functionality
// This is used as a fallback when chess.js fails to load

// Types for the piece colors and types
export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

// Interface for a chess piece
export interface Piece {
  color: PieceColor;
  type: PieceType;
}

// Interface for a move
export interface Move {
  from: string;
  to: string;
  promotion?: PieceType;
  piece?: Piece;
  captured?: Piece;
}

// A simple FEN parser and chess state manager
export class SimpleChess {
  private board: Map<string, Piece> = new Map();
  private turn: PieceColor = 'w';
  private castling: string = 'KQkq';
  private enPassant: string | null = null;
  private halfMoves: number = 0;
  private fullMoves: number = 1;
  private moveHistory: Move[] = [];
  private gameOver: boolean = false;

  constructor(fen?: string) {
    this.load(fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }

  // Load a position from FEN
  load(fen: string): boolean {
    try {
      this.board.clear();
      const [position, turn, castling, enPassant, halfMoves, fullMoves] = fen.split(' ');
      
      // Parse the position
      let rank = 8;
      let file = 1;
      
      for (const char of position) {
        if (char === '/') {
          rank--;
          file = 1;
        } else if ('12345678'.includes(char)) {
          file += parseInt(char, 10);
        } else {
          const square = this.fileRankToSquare(file, rank);
          const color: PieceColor = char === char.toUpperCase() ? 'w' : 'b';
          const type: PieceType = char.toLowerCase() as PieceType;
          this.board.set(square, { color, type });
          file++;
        }
      }
      
      // Parse the other FEN components
      this.turn = turn === 'w' ? 'w' : 'b';
      this.castling = castling;
      this.enPassant = enPassant === '-' ? null : enPassant;
      this.halfMoves = parseInt(halfMoves, 10);
      this.fullMoves = parseInt(fullMoves, 10);
      
      return true;
    } catch (e) {
      console.error('Error parsing FEN:', e);
      // Reset to starting position
      this.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      return false;
    }
  }

  // Get the FEN representation of the current position
  fen(): string {
    let fenParts = [];
    
    // Position
    let position = '';
    for (let rank = 8; rank >= 1; rank--) {
      let emptyCount = 0;
      
      for (let file = 1; file <= 8; file++) {
        const square = this.fileRankToSquare(file, rank);
        const piece = this.board.get(square);
        
        if (piece) {
          if (emptyCount > 0) {
            position += emptyCount.toString();
            emptyCount = 0;
          }
          
          const pieceChar = piece.type;
          position += piece.color === 'w' ? pieceChar.toUpperCase() : pieceChar;
        } else {
          emptyCount++;
        }
      }
      
      if (emptyCount > 0) {
        position += emptyCount.toString();
      }
      
      if (rank > 1) {
        position += '/';
      }
    }
    
    fenParts.push(position);
    fenParts.push(this.turn);
    fenParts.push(this.castling || '-');
    fenParts.push(this.enPassant || '-');
    fenParts.push(this.halfMoves.toString());
    fenParts.push(this.fullMoves.toString());
    
    return fenParts.join(' ');
  }

  // Convert file (1-8) and rank (1-8) to algebraic notation (a1, h8, etc.)
  private fileRankToSquare(file: number, rank: number): string {
    return `${'abcdefgh'[file - 1]}${rank}`;
  }

  // Convert algebraic notation to file and rank
  private squareToFileRank(square: string): [number, number] {
    const file = 'abcdefgh'.indexOf(square[0]) + 1;
    const rank = parseInt(square[1], 10);
    return [file, rank];
  }

  // Get a piece at a specific square
  get(square: string): Piece | null {
    return this.board.get(square) || null;
  }

  // Get the current turn
  getTurn(): PieceColor {
    return this.turn;
  }

  // Check if the current position is check
  isCheck(): boolean {
    // Simplified check detection (not fully implemented)
    return false;
  }

  // Check if the current position is checkmate
  isCheckmate(): boolean {
    // Simplified checkmate detection (not fully implemented)
    return this.gameOver && this.isCheck();
  }

  // Check if the current position is a draw
  isDraw(): boolean {
    // Simplified draw detection (not fully implemented)
    return this.gameOver && !this.isCheck();
  }

  // Check if the current position is stalemate
  isStalemate(): boolean {
    // Simplified stalemate detection (not fully implemented)
    return this.isDraw();
  }

  // Check if the game is over
  isGameOver(): boolean {
    return this.gameOver;
  }

  // Get all legal moves for a piece at a specific square
  moves({ square, verbose }: { square?: string; verbose?: boolean } = {}): any[] {
    // Simplified move generation (not fully implemented)
    // Just returns empty array to prevent errors
    return [];
  }

  // Make a move
  move({ from, to, promotion }: { from: string; to: string; promotion?: PieceType }): Move | null {
    try {
      const piece = this.board.get(from);
      if (!piece) return null;
      
      // Check if it's the correct turn
      if (piece.color !== this.turn) return null;
      
      // Get the captured piece (if any)
      const captured = this.board.get(to) || undefined;
      
      // Create a move object
      const move: Move = { from, to, promotion, piece, captured };
      
      // Update the board
      this.board.delete(from);
      this.board.set(to, piece);
      
      // Update the turn
      this.turn = this.turn === 'w' ? 'b' : 'w';
      
      // Update move counters
      if (this.turn === 'w') {
        this.fullMoves++;
      }
      
      if (piece.type === 'p' || captured) {
        this.halfMoves = 0;
      } else {
        this.halfMoves++;
      }
      
      // Save the move to history
      this.moveHistory.push(move);
      
      return move;
    } catch (e) {
      console.error('Error making move:', e);
      return null;
    }
  }
} 