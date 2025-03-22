# Quick Deployment Guide

This guide will help you deploy your Chess Site to Render.com so you can play with friends online.

## 1. Push to GitHub

First, create a repository on GitHub:

1. Go to [GitHub](https://github.com) and sign in or create an account
2. Click the "+" button in the top-right corner and select "New repository"
3. Name your repository (e.g., "chess-site")
4. Make it public
5. Click "Create repository"

Then, push your code to GitHub:

```bash
# Add your GitHub repository as a remote
git remote add origin https://github.com/yourusername/chess-site.git

# Push your code
git push -u origin main
```

## 2. Deploy to Render.com

1. Create a free account at [Render.com](https://render.com)
2. From your dashboard, click "New" and select "Web Service"
3. Connect your GitHub account and select your chess-site repository
4. Configure the service:
   - **Name**: chess-site
   - **Environment**: Node
   - **Build Command**: `./prepare-production.sh`
   - **Start Command**: `npm run start:unified`
   - **Plan**: Free
5. Add these environment variables:
   - `NODE_ENV`: production
   - `DATABASE_PROVIDER`: postgresql

6. Click "Add PostgreSQL" if you want a persistent database:
   - Select the free plan
   - Link it to your web service
   - Render will automatically set up the `DATABASE_URL` environment variable

7. Click "Create Web Service"

Your chess app will be available at a URL like `https://chess-site.onrender.com` once deployment completes. Simply share this URL with friends to play together!

## 3. Playing with Friends

1. Open your app URL in your browser
2. Create a new game with your desired time control
3. Share the generated game link with your friend
4. Enjoy playing chess together!

## Troubleshooting

- If you encounter any issues, check the logs in the Render.com dashboard
- Make sure all environment variables are set correctly
- For database issues, verify the `DATABASE_URL` is properly configured 