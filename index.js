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

// Initialize Prisma client
const prisma = new PrismaClient();

// Create a sample game if none exists
async function initializeDatabase() {
  try {
    console.log('Checking if database needs initialization...');
    const gamesCount = await prisma.game.count();
    
    if (gamesCount === 0) {
      console.log('No games found, creating a sample game...');
      
      // Create a default game
      await prisma.game.create({
        data: {
          whitePlayer: '',
          blackPlayer: '',
          timeControl: 300, // 5 minutes
          incrementPerMove: 3, // 3 seconds per move
          status: 'waiting'
        }
      });
      
      console.log('Sample game created successfully!');
    } else {
      console.log(`Found ${gamesCount} existing games, skipping initialization.`);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
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
    console.log('Client connected with ID:', socket.id);

    socket.on('joinGame', async (gameId, player) => {
      socket.join(gameId);
      console.log(`${player} joined game ${gameId}`);
    });

    socket.on('move', async (data) => {
      const { gameId, move, whiteTimeLeft, blackTimeLeft } = data;
      
      try {
        console.log('Received move from client:', data);
        
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          include: { moves: true }
        });

        if (game) {
          // Create the move record in the database
          const newMove = await prisma.move.create({
            data: {
              gameId,
              move,
              moveNumber: game.moves.length + 1,
              whiteTimeLeft,
              blackTimeLeft
            }
          });

          console.log('Saved move to database:', newMove);

          // Broadcast move to all clients in the room
          const moveData = {
            id: newMove.id,
            gameId,
            move,
            moveNumber: newMove.moveNumber,
            timestamp: new Date().toISOString(),
            whiteTimeLeft,
            blackTimeLeft
          };
          
          console.log('Broadcasting move to room:', gameId);
          io.to(gameId).emit('moveMade', moveData);
        } else {
          console.error('Game not found:', gameId);
        }
      } catch (error) {
        console.error('Error processing move:', error);
      }
    });

    socket.on('gameOver', async (data) => {
      const { gameId, winner } = data;
      
      try {
        await prisma.game.update({
          where: { id: gameId },
          data: {
            status: 'completed',
            winner
          }
        });

        io.to(gameId).emit('gameEnded', { winner });
      } catch (error) {
        console.error('Error ending game:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Initialize the database after server setup
  initializeDatabase();

  // Start server on the specified port
  server.listen(port, () => {
    console.log(`> Server ready on http://localhost:${port}`);
  });
}); 