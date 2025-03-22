# Chess Site

A real-time chess application with blitz clock functionality, built with Next.js, TypeScript, and Socket.IO.

## Features

- Real-time multiplayer chess games
- Blitz clock with customizable time controls
- Time increment per move
- Game history saved to local database
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
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
- Prisma with SQLite database
- chess.js for chess logic

## Development

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

## License

MIT 