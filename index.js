const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const next = require('next');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Environment setup
const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Initialize Next.js app
const app = next({ dev });
const handle = app.getRequestHandler();

// Run Prisma migrations before initializing the client
console.log('Running database setup...');
try {
  if (isProd) {
    console.log('Production environment detected, setting up database...');
    // Run Prisma migrations in production
    exec('npx prisma migrate deploy', (error, stdout, stderr) => {
      if (error) {
        console.error(`Migration error: ${error.message}`);
        // If migration fails, try db push as fallback
        console.log('Trying database push as fallback...');
        exec('npx prisma db push --accept-data-loss', (err, out, stdErr) => {
          if (err) {
            console.error(`Database push error: ${err.message}`);
          } else {
            console.log('Database schema pushed successfully');
          }
        });
      } else {
        console.log(`Migration output: ${stdout}`);
        console.log('Migrations applied successfully!');
      }
    });
  } else {
    // For development, just ensure the database exists
    const dbPath = path.join(__dirname, 'prisma/dev.db');
    if (!fs.existsSync(dbPath)) {
      console.log('Development database not found, creating it...');
      exec('npx prisma db push', (err, out, stdErr) => {
        if (err) {
          console.error(`Database creation error: ${err.message}`);
        } else {
          console.log('Development database created successfully');
        }
      });
    } else {
      console.log('Development database exists, continuing');
    }
  }
} catch (error) {
  console.error('Error in database setup:', error);
  console.log('Will try to continue without migrations...');
}

// Initialize Prisma client with better error handling
let prisma;
try {
  prisma = new PrismaClient();
  // Test the connection
  prisma.$connect().then(() => {
    console.log('Successfully connected to the database');
    
    // Initialize the database after connecting successfully
    initializeDatabase().catch(err => {
      console.error('Error initializing database:', err);
    });
  }).catch(err => {
    console.error('Failed to connect to the database:', err);
  });
} catch (error) {
  console.error('Error initializing Prisma client:', error);
}

// Create a sample game if none exists
async function initializeDatabase() {
  try {
    console.log('Checking if database needs initialization...');
    const gamesCount = await prisma.game.count();
    
    if (gamesCount === 0) {
      console.log('No games found, creating a sample game...');
      
      const timeControl = 300; // 5 minutes
      const incrementPerMove = 3; // 3 seconds
      
      // Create a default game
      await prisma.game.create({
        data: {
          whitePlayer: '',
          blackPlayer: '',
          timeControl,
          incrementPerMove,
          whiteTimeLeft: timeControl,
          blackTimeLeft: timeControl,
          status: 'waiting',
          movesJson: JSON.stringify([]),
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        }
      });
      
      console.log('Sample game created successfully!');
    } else {
      console.log(`Found ${gamesCount} existing games, skipping initialization.`);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// CORS configuration
const allowedOrigins = isProd 
  ? [process.env.FRONTEND_URL || '*', 'http://localhost:3000']
  : '*';

console.log(`Starting server in ${isProd ? 'production' : 'development'} mode on port ${port}`);
console.log(`Allowed origins: ${JSON.stringify(allowedOrigins)}`);

// Prepare the Next.js app, then set up the server
app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req, res) => {
    handle(req, res);
  });

  // Configure Socket.IO with CORS settings
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/socket.io/'
  });

  // Add connection error logging
  io.engine.on("connection_error", (err) => {
    console.log("Connection error:", err.req?.url);
    console.log("Error code:", err.code);
    console.log("Error message:", err.message);
    console.log("Error context:", err.context);
  });

  io.on('connection', (socket) => {
    console.log('A user connected');
    
    // Handle joining a game room
    socket.on('joinGame', async (data) => {
      try {
        const { gameId } = data;
        console.log(`User ${socket.id} joining game ${gameId}`);
        
        // Join the socket to the game's room
        socket.join(`game:${gameId}`);
        
        // Get the current game state from database
        const game = await prisma.game.findUnique({
          where: { id: gameId },
        });
        
        if (game) {
          // Emit current game state to the connecting client
          socket.emit('gameState', {
            fen: game.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Default FEN if not set
            whiteTimeLeft: game.whiteTimeLeft,
            blackTimeLeft: game.blackTimeLeft,
            status: game.status
          });
        } else {
          console.error(`Game ${gameId} not found for joining user`);
        }
      } catch (error) {
        console.error('Error handling joinGame:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    // Handle requests for current game state
    socket.on('requestGameState', async (data) => {
      try {
        const { gameId } = data;
        console.log(`User ${socket.id} requesting game state for ${gameId}`);
        
        // Get the current game state from database
        const game = await prisma.game.findUnique({
          where: { id: gameId },
        });
        
        if (game) {
          // Emit current game state to the requesting client
          socket.emit('gameState', {
            fen: game.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Default FEN if not set
            whiteTimeLeft: game.whiteTimeLeft,
            blackTimeLeft: game.blackTimeLeft,
            status: game.status
          });
        } else {
          console.error(`Game ${gameId} not found for state request`);
          socket.emit('error', { message: 'Game not found' });
        }
      } catch (error) {
        console.error('Error handling requestGameState:', error);
        socket.emit('error', { message: 'Failed to get game state' });
      }
    });

    socket.on('move', async (data) => {
      try {
        console.log('Move received:', data);
        const { gameId, move, whiteTimeLeft, blackTimeLeft } = data;
        
        // Validate the game ID and move data
        if (!gameId || !move) {
          console.error('Invalid move data:', data);
          return;
        }
        
        // Get the existing game
        const game = await prisma.game.findUnique({
          where: { id: gameId }
        });
        
        if (!game) {
          console.error(`Game ${gameId} not found`);
          return;
        }
        
        // Parse existing moves or create new array
        let moves = [];
        if (game.movesJson) {
          try {
            moves = JSON.parse(game.movesJson);
          } catch (e) {
            console.error('Error parsing existing moves JSON:', e);
          }
        }
        
        // Add new move to array
        moves.push(move);
        
        // Update the game state in the database
        const updatedGame = await prisma.game.update({
          where: { id: gameId },
          data: {
            movesJson: JSON.stringify(moves),
            whiteTimeLeft,
            blackTimeLeft,
            lastMoveAt: new Date()
          }
        });
        
        // Broadcast the move to all clients in the game room
        io.to(`game:${gameId}`).emit('moveMade', {
          move,
          whiteTimeLeft,
          blackTimeLeft
        });
        
        console.log(`Move ${move} broadcast to game:${gameId}`);
      } catch (error) {
        console.error('Error handling move:', error);
        socket.emit('error', { message: 'Failed to process move' });
      }
    });

    socket.on('gameOver', async (data) => {
      try {
        const { gameId, winner } = data;
        
        if (!gameId) {
          console.error('Invalid gameOver data:', data);
          return;
        }
        
        // Update game status in database
        await prisma.game.update({
          where: { id: gameId },
          data: {
            status: 'completed',
            winner
          }
        });
        
        // Notify all clients in the game room
        io.to(`game:${gameId}`).emit('gameEnded', { winner });
        console.log(`Game ${gameId} ended. Winner: ${winner}`);
      } catch (error) {
        console.error('Error handling gameOver:', error);
        socket.emit('error', { message: 'Failed to end game' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Start server on the specified port
  server.listen(port, () => {
    console.log(`> Server ready on http://localhost:${port}`);
  });
}); 