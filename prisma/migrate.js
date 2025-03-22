const { exec } = require('child_process');
const { PrismaClient } = require('@prisma/client');

console.log('Running Prisma migrations...');

// Run the Prisma migrations
exec('npx prisma migrate deploy', (error, stdout, stderr) => {
  if (error) {
    console.error(`Migration error: ${error.message}`);
    
    // Check if the error is related to the database not existing
    if (error.message.includes('database does not exist')) {
      console.log('Database does not exist, creating it...');
      
      // Try to create the database using the connection string
      // This is a simplified approach - in a real deployment, you would use proper database provisioning
      exec('npx prisma db push --accept-data-loss', (err, out, stdErr) => {
        if (err) {
          console.error(`Database creation error: ${err.message}`);
          return;
        }
        console.log('Database schema created successfully!');
        
        // Initialize with a default game for testing
        initializeDatabase();
      });
      return;
    }
    
    return;
  }
  
  console.log(`Migration output: ${stdout}`);
  console.log('Migrations applied successfully!');
  
  // Initialize database with default data if needed
  initializeDatabase();
});

// Function to initialize the database with default data
async function initializeDatabase() {
  try {
    const prisma = new PrismaClient();
    
    // Check if there are any games in the database
    const gamesCount = await prisma.game.count();
    
    if (gamesCount === 0) {
      console.log('Initializing database with a default game...');
      
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
      
      console.log('Database initialized with a default game!');
    } else {
      console.log('Database already has games, skipping initialization.');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
} 