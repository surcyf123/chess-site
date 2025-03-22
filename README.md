# Chess Site

A real-time chess application with blitz clock functionality, built with Next.js, TypeScript, and Socket.IO.

## Features

- Real-time multiplayer chess games
- Blitz clock with customizable time controls
- Time increment per move
- Game history saved to database
- Beautiful, responsive UI
- Easy game sharing via link

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd chess-site
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Start the development server:
```bash
npm run dev:full
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

The application is split into two parts for deployment:
1. The Next.js front-end application
2. The Socket.IO server for real-time communication

### Front-end Deployment (Vercel)

1. Push your repository to GitHub
2. Connect your GitHub repository to Vercel
3. Set the following environment variables in Vercel:
   - `NEXT_PUBLIC_SOCKET_URL`: URL of your Socket.IO server (e.g., https://chess-site-socket-server.onrender.com)
   - `DATABASE_URL`: PostgreSQL connection string

### Socket.IO Server Deployment (Render)

1. Push your repository to GitHub
2. Create a new Web Service in Render
3. Connect your GitHub repository
4. Use the following settings:
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm run server`
5. Set the following environment variables:
   - `NODE_ENV`: production
   - `PORT`: 10000 (or any port assigned by Render)
   - `FRONTEND_URL`: URL of your front-end (e.g., https://chess-site.vercel.app)
   - `DATABASE_URL`: PostgreSQL connection string

### Alternative Deployment (Heroku)

1. Push your repository to GitHub
2. Connect your GitHub repository to Heroku
3. Set the following environment variables:
   - `NODE_ENV`: production
   - `PORT`: Heroku will set this automatically
   - `FRONTEND_URL`: URL of your front-end
   - `DATABASE_URL`: PostgreSQL connection string (add a Postgres add-on in Heroku)

## How to Play

1. Visit the homepage and click "Create New Game"
2. Set your desired time control and increment
3. Share the game link with your opponent
4. The first player to join will be randomly assigned white or black
5. Make moves by clicking the pieces and their destination squares
6. The clock will count down during your turn
7. Time is added after each move according to the increment setting

## Technical Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Socket.IO for real-time communication
- Prisma with PostgreSQL database (SQLite for development)
- chess.js for chess logic

## Development

- `npm run dev` - Start the Next.js development server only
- `npm run server` - Start the Socket.IO server only
- `npm run dev:full` - Start both servers for local development
- `npm run build` - Build the production application
- `npm run start` - Start the production Next.js server

## License

MIT 