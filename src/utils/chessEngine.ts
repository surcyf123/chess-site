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
  private _turn: PieceColor = 'w';
  private castling: string = 'KQkq';
  private enPassant: string | null = null;
  private halfMoves: number = 0;
  private fullMoves: number = 1;
  private moveHistory: Move[] = [];
  private _gameOver: boolean = false;
  private _check: boolean = false;
  private _checkmate: boolean = false;
  private _draw: boolean = false;
  private _stalemate: boolean = false;

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
      this._turn = turn === 'w' ? 'w' : 'b';
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
    fenParts.push(this._turn);
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

  // Get the current turn - THIS IS A CRITICAL METHOD USED BY THE CHESSBOARD
  turn(): PieceColor {
    return this._turn;
  }

  // Check if the current position is check
  isCheck(): boolean {
    return this._check;
  }

  // Check if the current position is checkmate
  isCheckmate(): boolean {
    return this._checkmate;
  }

  // Check if the current position is a draw
  isDraw(): boolean {
    return this._draw;
  }

  // Check if the current position is stalemate
  isStalemate(): boolean {
    return this._stalemate;
  }

  // Check if the game is over
  isGameOver(): boolean {
    return this._gameOver;
  }

  // Get all legal moves for a piece at a specific square
  moves({ square, verbose }: { square?: string; verbose?: boolean } = {}): any[] {
    if (verbose) {
      // Return an empty array with the expected properties
      return [];
    }
    // Just returns empty array to prevent errors
    return [];
  }

  // Make a move - handles both string and object formats
  move(move: string | { from: string; to: string; promotion?: PieceType }): Move | null {
    try {
      let from: string;
      let to: string;
      let promotion: PieceType | undefined;

      // Parse the move parameter based on its type
      if (typeof move === 'string') {
        // Parse the string move format (e.g., "e2e4" or "e7e8q")
        from = move.substring(0, 2);
        to = move.substring(2, 4);
        promotion = move.length > 4 ? move.substring(4, 5) as PieceType : undefined;
      } else {
        // Extract from move object
        from = move.from;
        to = move.to;
        promotion = move.promotion;
      }

      // Get the piece to move
      const piece = this.board.get(from);
      if (!piece) return null;
      
      // Check if it's the correct turn
      if (piece.color !== this._turn) return null;
      
      // Get the captured piece (if any)
      const captured = this.board.get(to) || undefined;
      
      // Create a move object
      const moveObj: Move = { from, to, promotion, piece, captured };
      
      // Update the board
      this.board.delete(from);
      this.board.set(to, piece);
      
      // Update the turn
      this._turn = this._turn === 'w' ? 'b' : 'w';
      
      // Update move counters
      if (this._turn === 'w') {
        this.fullMoves++;
      }
      
      if (piece.type === 'p' || captured) {
        this.halfMoves = 0;
      } else {
        this.halfMoves++;
      }
      
      // Save the move to history
      this.moveHistory.push(moveObj);
      
      return moveObj;
    } catch (e) {
      console.error('Error making move:', e);
      return null;
    }
  }

  // Add a piece to a specific square
  put(piece: Piece, square: string): boolean {
    try {
      // Validate square format
      if (!square.match(/^[a-h][1-8]$/)) {
        console.error('Invalid square format:', square);
        return false;
      }
      
      // Validate piece
      if (!piece || !piece.color || !piece.type) {
        console.error('Invalid piece:', piece);
        return false;
      }
      
      // Place the piece
      this.board.set(square, piece);
      
      // Since we modified the board, we need to recalculate game state
      // In a real implementation, this would check for check/checkmate/etc.
      // For simplicity, we'll just return true
      return true;
    } catch (e) {
      console.error('Error putting piece:', e);
      return false;
    }
  }

  // Extra utility methods to match chess.js API

  // Reset the game to the initial position
  reset(): void {
    this.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }

  // Implement any missing methods that ChessBoard component might be using
  history(): Move[] {
    return this.moveHistory;
  }
} 