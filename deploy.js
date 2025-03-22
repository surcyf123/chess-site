#!/usr/bin/env node

/**
 * Chess Site Deployment Helper
 * 
 * This script helps with deploying the Chess Site to various platforms.
 * Run it with: node deploy.js [platform]
 * 
 * Available platforms:
 * - render: Deploy to Render.com
 * - railway: Deploy to Railway.app
 * - fly: Deploy to Fly.io
 * - gcloud: Deploy to Google Cloud Run
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to execute commands
function runCommand(command, options = {}) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { 
      stdio: 'inherit',
      ...options
    });
    return true;
  } catch (error) {
    console.error(`Command failed: ${error.message}`);
    return false;
  }
}

// Check prerequisites
function checkPrerequisites(platform) {
  console.log(`\n🔍 Checking prerequisites for ${platform}...`);
  
  // Check if Git is installed
  try {
    execSync('git --version', { stdio: 'ignore' });
    console.log('✅ Git is installed');
  } catch (error) {
    console.error('❌ Git is not installed. Please install Git first.');
    return false;
  }
  
  // Check for uncommitted changes
  try {
    const status = execSync('git status --porcelain').toString();
    if (status) {
      console.warn('⚠️  You have uncommitted changes. It\'s recommended to commit them before deploying.');
      const proceed = readline.keyInYN('Do you want to proceed anyway?');
      if (!proceed) return false;
    } else {
      console.log('✅ Git repository is clean');
    }
  } catch (error) {
    console.warn('⚠️  Unable to check Git status. Make sure you\'re in a Git repository.');
  }
  
  // Platform-specific checks
  switch (platform) {
    case 'render':
      console.log('✅ No additional prerequisites for Render.com');
      break;
    case 'railway':
      try {
        execSync('railway --version', { stdio: 'ignore' });
        console.log('✅ Railway CLI is installed');
      } catch (error) {
        console.error('❌ Railway CLI is not installed. Please install it with: npm i -g @railway/cli');
        return false;
      }
      break;
    case 'fly':
      try {
        execSync('fly version', { stdio: 'ignore' });
        console.log('✅ Fly CLI is installed');
      } catch (error) {
        console.error('❌ Fly CLI is not installed. Please install it from https://fly.io/docs/hands-on/install-flyctl/');
        return false;
      }
      break;
    case 'gcloud':
      try {
        execSync('gcloud --version', { stdio: 'ignore' });
        console.log('✅ Google Cloud CLI is installed');
      } catch (error) {
        console.error('❌ Google Cloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install');
        return false;
      }
      break;
  }
  
  return true;
}

// Deploy to Render.com
function deployToRender() {
  console.log('\n🚀 Deploying to Render.com...');
  console.log('Render.com deployments are handled through GitHub integration.');
  console.log('To deploy to Render.com:');
  console.log('1. Push your code to GitHub');
  console.log('2. Connect your GitHub repository to Render.com');
  console.log('3. Render will automatically deploy your app based on the render.yaml file');
  
  const shouldPush = readline.keyInYN('Do you want to push your current code to GitHub now?');
  
  if (shouldPush) {
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    if (runCommand(`git push origin ${branch}`)) {
      console.log('✅ Code pushed to GitHub');
      console.log('🔗 Now connect your GitHub repository to Render.com to complete the deployment');
    }
  } else {
    console.log('Skipping GitHub push. You can manually push your code when ready.');
  }
}

// Deploy to Railway.app
function deployToRailway() {
  console.log('\n🚀 Deploying to Railway.app...');
  
  // Check if user is logged in
  try {
    execSync('railway whoami', { stdio: 'ignore' });
  } catch (error) {
    console.log('You need to log in to Railway first');
    runCommand('railway login');
  }
  
  // Deploy to Railway
  if (runCommand('railway up')) {
    console.log('✅ Successfully deployed to Railway!');
  }
}

// Deploy to Fly.io
function deployToFly() {
  console.log('\n🚀 Deploying to Fly.io...');
  
  // Check if an app has been created
  let hasApp = false;
  try {
    execSync('fly status', { stdio: 'ignore' });
    hasApp = true;
  } catch (error) {
    console.log('No Fly.io app configured. Let\'s create one.');
  }
  
  if (!hasApp) {
    if (!runCommand('fly launch')) {
      return;
    }
  }
  
  // Deploy to Fly.io
  if (runCommand('fly deploy')) {
    console.log('✅ Successfully deployed to Fly.io!');
  }
}

// Deploy to Google Cloud Run
function deployToGCloud() {
  console.log('\n🚀 Deploying to Google Cloud Run...');
  
  // Check if user is logged in
  try {
    execSync('gcloud auth list', { stdio: 'ignore' });
  } catch (error) {
    console.log('You need to log in to Google Cloud first');
    runCommand('gcloud auth login');
  }
  
  // Make sure Docker is running
  try {
    execSync('docker info', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Docker is not running. Please start Docker and try again.');
    return;
  }
  
  // Deploy using Cloud Build
  if (runCommand('gcloud builds submit --config cloudrun.yaml')) {
    console.log('✅ Successfully deployed to Google Cloud Run!');
  }
}

// Main function
async function main() {
  // Get the platform argument
  const args = process.argv.slice(2);
  let platform = args[0]?.toLowerCase();
  
  // If no platform provided, ask the user
  if (!platform) {
    console.log('Chess Site Deployment Helper');
    console.log('---------------------------');
    console.log('This script helps you deploy the Chess Site to various platforms.');
    console.log('Available platforms:');
    console.log('1. Render.com');
    console.log('2. Railway.app');
    console.log('3. Fly.io');
    console.log('4. Google Cloud Run');
    
    const answer = await new Promise(resolve => {
      rl.question('\nEnter the number of the platform you want to deploy to: ', resolve);
    });
    
    switch (answer.trim()) {
      case '1': platform = 'render'; break;
      case '2': platform = 'railway'; break;
      case '3': platform = 'fly'; break;
      case '4': platform = 'gcloud'; break;
      default:
        console.error('Invalid selection. Exiting.');
        rl.close();
        return;
    }
  }
  
  // Validate platform
  const validPlatforms = ['render', 'railway', 'fly', 'gcloud'];
  if (!validPlatforms.includes(platform)) {
    console.error(`Invalid platform: ${platform}`);
    console.error(`Valid platforms are: ${validPlatforms.join(', ')}`);
    rl.close();
    return;
  }
  
  // Check prerequisites
  if (!checkPrerequisites(platform)) {
    console.error('Prerequisites check failed. Please fix the issues and try again.');
    rl.close();
    return;
  }
  
  // Run the pre-deployment steps
  console.log('\n🔧 Preparing for deployment...');
  
  // Always build the app before deployment
  console.log('Building the application...');
  runCommand('npm run build');
  
  // Deploy based on platform
  switch (platform) {
    case 'render':
      deployToRender();
      break;
    case 'railway':
      deployToRailway();
      break;
    case 'fly':
      deployToFly();
      break;
    case 'gcloud':
      deployToGCloud();
      break;
  }
  
  console.log('\n🎉 Deployment process completed!');
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('An error occurred:', error);
  process.exit(1);
}); 