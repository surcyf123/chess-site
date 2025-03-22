# ♟️ Quick Start: Play Chess Online

Follow these simple steps to get your chess game online:

## 1) Deploy to Render.com (3 minutes)

1. Create an account at https://render.com/
2. Click "New" → "Web Service" → "Build and deploy from a Git repository"
3. Choose "Connect a repository" or use the public URL: 
   `https://github.com/yourusername/chess-site`
4. Configure the service:
   - Name: chess-site
   - Environment: Node
   - Branch: main
   - Build Command: `./prepare-production.sh`
   - Start Command: `npm run start:unified`
   - Plan: Free

5. Click "Advanced" and add this environment variable:
   - `NODE_ENV`: production

6. Click "Create Web Service"

## 2) Add a PostgreSQL Database (1 minute)

1. In your Render dashboard, find your chess-site web service
2. Click the "PostgreSQL" link at the top
3. Click "New PostgreSQL" 
4. Use the free plan and connect it to your web service
5. Click "Create Database"

## 3) Play with Friends! (30 seconds)

1. Wait for deployment (5-10 minutes)
2. Your chess site will be at: `https://chess-site.onrender.com`
3. Share the game link with your friend and play!

## Need Help?

Check the deployment logs in your Render dashboard by clicking on your web service and clicking "Logs". 