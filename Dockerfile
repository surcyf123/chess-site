FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy app source
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV NEXT_TELEMETRY_DISABLED=1

# Build the app
RUN npm run build

# Expose port
EXPOSE 8080

# Start the app
CMD ["npm", "run", "start:unified"] 