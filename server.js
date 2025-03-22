const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient();

// Get port from environment variable or default to 3001
const PORT = parseInt(process.env.PORT || '3001', 10);

// Allowed origins for CORS
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = isProd 
  ? [process.env.FRONTEND_URL || 'https://chess-site.vercel.app', 'http://localhost:3000']
  : '*';

console.log(`Starting server in ${isProd ? 'production' : 'development'} mode`);
console.log(`Allowed origins: ${JSON.stringify(allowedOrigins)}`);

// Create HTTP server
const httpServer = createServer();

// Configure Socket.IO with CORS settings
const io = new Server(httpServer, {
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

// Use PORT from environment variable
httpServer.listen(PORT, () => {
  console.log(`> Socket.IO server ready on port ${PORT}`);
}); 