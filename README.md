# Chess Site

A real-time chess application with blitz clock functionality, built with Next.js, TypeScript, and Socket.IO.

## Features

- Real-time multiplayer chess games
- Blitz clock with customizable time controls
- Time increment per move
- Game history saved to database
- Beautiful, responsive UI
- Easy game sharing via link
- Reconnection handling and game state synchronization

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)

## Local Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd chess-site
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with these variables:
```
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
NODE_ENV="development"
PORT="3000"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev:full
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment Options

The application can be deployed using multiple platforms. Here are detailed instructions for each option.

### Unified Deployment (Recommended)

For simpler deployment, we've created a unified server that serves both the Next.js frontend and Socket.IO backend from a single process.

#### Render.com

1. Fork this repository to your GitHub account
2. Create a new Web Service in Render
3. Connect your GitHub repository
4. Use the following settings:
   - Build Command: `./prepare-production.sh`
   - Start Command: `npm run start:unified`
   - Environment Variables:
     - `NODE_ENV`: production
     - `DATABASE_URL`: Your database connection string (Postgres or SQLite)

The `render.yaml` file is already configured for deployment.

#### Railway.app

1. Fork this repository to your GitHub account
2. Create a new project in Railway
3. Connect your GitHub repository
4. Add a PostgreSQL database service
5. Configure the environment variables:
   - `NODE_ENV`: production
   - `DATABASE_URL`: ${{Postgres.DATABASE_URL}} (use the Railway variable)

The `railway.json` file is already configured for deployment.

#### Fly.io

1. Fork this repository to your GitHub account
2. Set up the Fly.io CLI on your machine
3. Run `fly launch` to create a new app
4. Set up a PostgreSQL database using `fly postgres create`
5. Attach the database to your app: `fly postgres attach --app your-app-name your-db-name`
6. Deploy with `fly deploy`

The `fly.toml` and `Dockerfile` are already configured for deployment.

Or use our GitHub Action by configuring secrets:
- `FLY_API_TOKEN`: Your Fly.io API token
- `DATABASE_URL`: Your Fly.io PostgreSQL connection string

### Split Deployment (Advanced)

For advanced users who want to separate the frontend and backend:

#### Frontend (Next.js) - Vercel

1. Fork this repository to your GitHub account
2. Connect your GitHub repository to Vercel
3. Configure the environment variables:
   - `NEXT_PUBLIC_SOCKET_URL`: URL of your Socket.IO server
   - `DATABASE_URL`: Your database connection string

#### Backend (Socket.IO) - Any hosting platform

1. Deploy the Socket.IO server to any platform that supports Node.js
2. Configure the environment variables:
   - `NODE_ENV`: production
   - `PORT`: The port your server will run on
   - `DATABASE_URL`: Your database connection string
   - `FRONTEND_URL`: URL of your frontend (for CORS)

## Configuration Files

- `.env.local` - Local development environment variables
- `.env.production` - Production environment variables
- `fly.toml` - Fly.io configuration
- `railway.json` - Railway.app configuration
- `render.yaml` - Render.com configuration
- `Dockerfile` - Docker configuration for containerized deployments
- `prepare-production.sh` - Script to prepare the application for production

## Scripts

- `npm run dev` - Start the Next.js development server only
- `npm run server` - Start the Socket.IO server only
- `npm run dev:full` - Start both servers for local development
- `npm run build` - Build the production application
- `npm run start` - Start the production Next.js server
- `npm run start:unified` - Start the unified server (both Next.js and Socket.IO)

## Database Migrations

When deploying to production, the application automatically handles database migrations:

- For PostgreSQL, it runs `prisma migrate deploy` first, then falls back to `prisma db push` if needed
- For SQLite, it uses `prisma db push` directly

## Troubleshooting

### Socket.IO Connection Issues

If you're experiencing connection issues:

1. Check that the `NEXT_PUBLIC_SOCKET_URL` is correctly set
2. Ensure your server is accessible from the client's network
3. Check browser console for CORS errors

### Database Connection Issues

If you're experiencing database connection issues:

1. Verify your `DATABASE_URL` is correctly set
2. Check that your database server is running
3. Ensure your schema is up to date: `npx prisma db push`

## License

MIT 