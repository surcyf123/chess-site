# ♟️ Quick Start: Play Chess Online

Follow these simple steps to get your chess game online:

## 1) Push to GitHub (2 minutes)

1. Create a GitHub repository at https://github.com/new
2. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/chess-site.git
git push -u origin main
```

## 2) Deploy to Render.com (3 minutes)

1. Create an account at https://render.com/
2. Click "New" → "Web Service"
3. Connect GitHub and select your repository
4. Enter these settings:
   - Name: chess-site
   - Build Command: `./prepare-production.sh`
   - Start Command: `npm run start:unified`

5. Click "Advanced" and add these environment variables:
   - `NODE_ENV`: production
   - `DATABASE_PROVIDER`: postgresql

6. Click "Create Web Service"

## 3) Add a Database (1 minute)

1. On your Web Service page, click "Add PostgreSQL"
2. Choose the free plan
3. Click "Create Database"

## 4) Play with Friends! (30 seconds)

1. Wait for deployment (about 5 minutes)
2. Your chess site will be at: `https://chess-site.onrender.com`
3. Share the game link with your friend and play!

## Need Help?

Check the deployment logs on Render.com if you run into any issues. The most common problem is forgetting to set environment variables. 