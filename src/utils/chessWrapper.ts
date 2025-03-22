import { SimpleChess } from './chessEngine';

/**
 * A wrapper class that provides a consistent interface for different chess engines
 * with robust error handling
 */
export class ChessWrapper {
  private engine: any;
  private engineType: 'chess.js' | 'fallback' = 'fallback';

  constructor(fen?: string) {
    try {
      // Attempt to import chess.js
      let ChessJS;
      try {
        ChessJS = require('chess.js');
        console.log('Chess.js imported successfully', typeof ChessJS);
      } catch (importError) {
        console.error('Failed to import chess.js:', importError);
        throw new Error('Failed to import chess.js');
      }
      
      // Handle different versions and export patterns of chess.js
      if (typeof ChessJS === 'function') {
        // Direct constructor (older versions)
        this.engine = fen ? new ChessJS(fen) : new ChessJS();
        this.engineType = 'chess.js';
        console.log('Initialized with chess.js direct constructor');
      } else if (ChessJS.Chess && typeof ChessJS.Chess === 'function') {
        // Named export (common in some versions)
        this.engine = fen ? new ChessJS.Chess(fen) : new ChessJS.Chess();
        this.engineType = 'chess.js';
        console.log('Initialized with chess.js Chess named export');
      } else if (ChessJS.default && typeof ChessJS.default === 'function') {
        // ES module default export (newer versions)
        this.engine = fen ? new ChessJS.default(fen) : new ChessJS.default();
        this.engineType = 'chess.js';
        console.log('Initialized with chess.js default export');
      } else {
        // If we can't determine the structure, log details for debugging
        console.error('Unknown chess.js structure:', {
          type: typeof ChessJS,
          keys: Object.keys(ChessJS),
          hasChess: ChessJS.Chess !== undefined,
          hasDefault: ChessJS.default !== undefined
        });
        throw new Error('Chess.js not available in expected format');
      }
      
      // Verify the engine has critical methods
      if (!this.engine.fen || !this.engine.move) {
        console.error('Chess.js instance missing critical methods');
        throw new Error('Chess.js instance is invalid');
      }
    } catch (error) {
      console.error('Error initializing chess.js, using fallback engine:', error);
      this.engine = new SimpleChess(fen);
      this.engineType = 'fallback';
    }
  }

  // Safely call a method on the engine with proper error handling
  private safeCall(methodName: string, ...args: any[]): any {
    try {
      if (this.engine && typeof this.engine[methodName] === 'function') {
        return this.engine[methodName](...args);
      }
      console.warn(`Method ${methodName} not available on current engine`);
      return null;
    } catch (error) {
      console.error(`Error calling ${methodName}:`, error);
      return null;
    }
  }

  // Core chess.js API methods with safe wrappers

  fen(): string {
    return this.safeCall('fen') || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }

  load(fen: string): boolean {
    return this.safeCall('load', fen) || false;
  }

  reset(): void {
    this.safeCall('reset');
  }

  turn(): 'w' | 'b' {
    return this.safeCall('turn') || 'w';
  }

  get(square: string): any {
    return this.safeCall('get', square);
  }

  put(piece: { type: string; color: string }, square: string): boolean {
    return this.safeCall('put', piece, square) || false;
  }

  move(move: string | { from: string; to: string; promotion?: string }): any {
    return this.safeCall('move', move);
  }

  // Game state methods
  isCheck(): boolean {
    return this.safeCall('isCheck') || false;
  }

  isCheckmate(): boolean {
    return this.safeCall('isCheckmate') || false;
  }

  isDraw(): boolean {
    return this.safeCall('isDraw') || false;
  }

  isStalemate(): boolean {
    return this.safeCall('isStalemate') || false;
  }

  isGameOver(): boolean {
    return this.safeCall('isGameOver') || false;
  }

  // Move generation/validation
  moves(options?: any): any[] {
    return this.safeCall('moves', options) || [];
  }

  // History
  history(options?: { verbose?: boolean }): any[] {
    return this.safeCall('history', options) || [];
  }

  // Additional utility methods
  getEngineType(): string {
    return this.engineType;
  }

  isReady(): boolean {
    return this.engine !== null && this.engine !== undefined;
  }
} 