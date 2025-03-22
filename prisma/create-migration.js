// Script to create a migration using the PostgreSQL schema
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Creating migration with PostgreSQL schema...');

// Backup current schema
try {
  fs.copyFileSync(
    path.join(__dirname, 'schema.prisma'),
    path.join(__dirname, 'schema.backup.prisma')
  );
  console.log('Backed up current schema');
} catch (error) {
  console.error('Failed to back up schema:', error);
  process.exit(1);
}

// Copy PostgreSQL schema to active schema
try {
  fs.copyFileSync(
    path.join(__dirname, 'schema.postgresql.prisma'),
    path.join(__dirname, 'schema.prisma')
  );
  console.log('Using PostgreSQL schema for migration');
} catch (error) {
  console.error('Failed to copy PostgreSQL schema:', error);
  // Restore backup
  fs.copyFileSync(
    path.join(__dirname, 'schema.backup.prisma'),
    path.join(__dirname, 'schema.prisma')
  );
  process.exit(1);
}

// Run migration command
try {
  const migrationName = process.argv[2] || 'database-update';
  console.log(`Creating migration: ${migrationName}`);
  
  execSync(`npx prisma migrate dev --name ${migrationName}`, {
    stdio: 'inherit'
  });
  
  console.log('Migration created successfully!');
} catch (error) {
  console.error('Failed to create migration:', error);
} finally {
  // Restore original schema
  try {
    fs.copyFileSync(
      path.join(__dirname, 'schema.backup.prisma'),
      path.join(__dirname, 'schema.prisma')
    );
    console.log('Restored original schema');
  } catch (restoreError) {
    console.error('Failed to restore original schema:', restoreError);
  }
} 