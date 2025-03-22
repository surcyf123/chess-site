import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

// Get port from environment variable or default to 3001
const PORT = parseInt(process.env.PORT || '3001', 10);

// Allowed origins for CORS
const allowedOrigins = dev 
  ? '*' 
  : [process.env.FRONTEND_URL || 'https://chess-site.vercel.app', 'http://localhost:3000'];

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  // Configure Socket.IO with CORS settings
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins, // Use environment-specific origins
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/socket.io/'
  });

  // Add connection error logging
  io.engine.on("connection_error", (err) => {
    console.log("Connection error:", err.req.url);
    console.log("Error code:", err.code);
    console.log("Error message:", err.message);
    console.log("Error context:", err.context);
  });

  io.on('connection', (socket) => {
    console.log('Client connected with ID:', socket.id);

    socket.on('joinGame', async (gameId: string, player: string) => {
      socket.join(gameId);
      console.log(`${player} joined game ${gameId}`);
    });

    socket.on('move', async (data: {
      gameId: string,
      move: string,
      whiteTimeLeft: number,
      blackTimeLeft: number
    }) => {
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
          
          console.log('Broadcasting move to room:', gameId, moveData);
          io.to(gameId).emit('moveMade', moveData);
        } else {
          console.error('Game not found:', gameId);
        }
      } catch (error) {
        console.error('Error processing move:', error);
      }
    });

    socket.on('gameOver', async (data: {
      gameId: string,
      winner: string
    }) => {
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
  server.listen(PORT, () => {
    console.log(`> Socket.IO server ready on http://localhost:${PORT}`);
  });
}); 